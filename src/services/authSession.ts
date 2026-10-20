/**
 * authSession.ts — API session token handling (client)
 * ---------------------------------------------------------------------------
 * Holds the signed token issued by the server (patient / staff / quantum_admin)
 * and attaches it to every same-origin `/api/*` request.
 * The token is the only credential: profile JSON in storage is display-only and
 * grants nothing, so editing it in dev-tools cannot elevate access.
 */
export type SessionRole = 'patient' | 'staff' | 'quantum_admin';

const TOKEN_KEY = 'zenithrx__auth_token'; // `zenithrx__` prefix → never synced to the hub
const ROLE_KEY = 'zenithrx__auth_role';
export const AUTH_CHANGE_EVENT = 'zenithrx:auth-change';

/** Admin sessions live only for the tab; patient/staff persist across reloads. */
function storageFor(role: SessionRole): Storage {
  return role === 'quantum_admin' ? sessionStorage : localStorage;
}

export function setAuthToken(token: string, role: SessionRole) {
  clearAuthToken(false);
  storageFor(role).setItem(TOKEN_KEY, token);
  storageFor(role).setItem(ROLE_KEY, role);
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function clearAuthToken(notify = true) {
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(TOKEN_KEY);
    s.removeItem(ROLE_KEY);
  }
  if (notify) window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

function decode(token: string): { exp: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** Current token, or null if absent/expired (expired tokens are purged). */
export function getAuthToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const claims = decode(token);
  if (!claims || claims.exp * 1000 < Date.now()) {
    clearAuthToken();
    return null;
  }
  return token;
}

export function getAuthRole(): SessionRole | null {
  if (!getAuthToken()) return null;
  return (sessionStorage.getItem(ROLE_KEY) || localStorage.getItem(ROLE_KEY)) as SessionRole | null;
}

let installed = false;
/** Wrap fetch so same-origin /api calls carry the bearer token automatically. */
export function installAuthFetch() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const isApi = url.startsWith('/api/') || url.startsWith(`${location.origin}/api/`);
      const token = getAuthToken();
      if (isApi && token) {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        return nativeFetch(input, { ...init, headers }).then((res) => {
          if (res.status === 401 && !url.includes('/api/auth/')) clearAuthToken(); // expired/revoked
          return res;
        });
      }
    } catch {
      /* fall through to plain fetch */
    }
    return nativeFetch(input, init);
  };
}

export async function postJson<T = any>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = {};
      }
    }
    const hasJsonData = Object.keys(data).length > 0;
    return { ok: res.ok && hasJsonData, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} as any };
  }
}
