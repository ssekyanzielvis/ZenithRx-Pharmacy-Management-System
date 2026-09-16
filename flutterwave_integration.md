# Flutterwave Integration for ZenithRx (Uganda)

Flutterwave is actually a good choice for your Uganda project, especially because it can handle both MTN and Airtel Mobile Money in Uganda, as well as cards. Flutterwave's current documentation lists Uganda (UGX) with mobilemoneyuganda, and the Uganda mobile-money integration supports the MTN and AIRTEL networks.

That means you may be able to use one Flutterwave integration instead of separately integrating the MTN and Airtel APIs.

## 1. What you will get from Flutterwave

For your project, the setup can be:

```text
       YOUR APPLICATION
              │
              ▼
         FLUTTERWAVE
              │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
    MTN         Airtel       VISA/
Mobile Money    Money      Mastercard
     │            │            │
     └────────────┼────────────┘
                  ▼
             Your Webhook
                  │
                  ▼
              Supabase
```

Flutterwave currently supports Uganda mobile money and lists Airtel and MTN as the supported Uganda networks.

## 2. Create your Flutterwave account

Go to the official developer platform:
[Flutterwave Developer Portal](https://developer.flutterwave.com/?utm_source=chatgpt.com)

Flutterwave provides a sandbox/test environment where you can develop without processing real money.
Create your account and log in.

## 3. Get your API keys

Inside your Flutterwave dashboard, go to:
**Settings ↓ API Keys**

Flutterwave provides different credentials for test and live environments. Their documentation says the test credentials are prefixed with `_TEST`, while live credentials are separate.

You'll see credentials such as:
- Public Key
- Secret Key
- Encryption Key

For your current setup:
```env
FLUTTERWAVE_PUBLIC_KEY=""
FLUTTERWAVE_SECRET_KEY=""
FLUTTERWAVE_ENCRYPTION_KEY=""
```

> **Important**
> Your **PUBLIC KEY** can be used client-side where appropriate.
> But your **SECRET KEY** must never be put into React/Vite frontend code. Flutterwave explicitly says the secret key must be kept server-side.

## 4. Configure your .env

For development:
```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxx
```
*Don't copy those example values literally. Put the credentials from your Flutterwave dashboard.*

I would also add:
```env
FLUTTERWAVE_WEBHOOK_SECRET=your_random_secret
```
The webhook secret is something you create, rather than something you copy from the API keys page.

## 5. You have two ways to integrate Flutterwave

Flutterwave currently supports several integration approaches, including:
- Flutterwave Standard
- SDKs/plugins
- Direct API integration

For your project, I recommend the **API/backend approach**, because you're building a serious payment system with Supabase and multiple providers.

## 6. For Uganda, you can collect MTN and Airtel

This is the particularly useful part.
Flutterwave's Uganda mobile-money API expects information such as:
- `phone_number`
- `network`
- `amount`
- `currency`
- `email`
- `tx_ref`

The network is `MTN` or `AIRTEL` and currency is `UGX`. Flutterwave documents this exact Uganda flow.

So your frontend could display:
```text
┌──────────────────────────────┐
│           CHECKOUT           │
│                              │
│      Amount: UGX 50,000      │
│                              │
│      Payment method          │
│                              │
│      ○ MTN Mobile Money      │
│      ○ Airtel Money          │
│      ○ Visa / Mastercard     │
│                              │
│      Phone Number            │
│      +256 7XXXXXXXX          │
│                              │
│          PAY NOW             │
└──────────────────────────────┘
```

## 7. Your backend receives the request

Suppose the user chooses:
- Airtel Money
- UGX 50,000
- +256700000000

Your frontend sends your backend something like:
```json
{
  "order_id": "ORD-10001",
  "provider": "flutterwave",
  "network": "AIRTEL",
  "phone_number": "256700000000"
}
```

Notice that we're not trusting the frontend to tell us the amount. Your backend should retrieve:
`ORD-10001` ↓ `Database` ↓ `Amount = 50,000 UGX`

Then your backend creates the Flutterwave payment.

## 8. Flutterwave sends the payment request

Conceptually:
```text
      Your Backend
            │
            │ UGX 50,000
            │ MTN/AIRTEL
            │ phone number
            ▼
       Flutterwave
            │
            ▼
   Mobile Money Network
            │
            ▼
     Customer's Phone
            │
            ▼
   Customer enters PIN
```

Flutterwave says that after the customer authorizes the mobile-money request, the wallet is debited and Flutterwave sends a webhook notification to your server.

## 9. Don't immediately mark the order as paid

This is extremely important.
Suppose Flutterwave initially responds:
```json
{ "status": "pending" }
```

Your database should contain:
`payment.status = PENDING`
*(Not: `payment.status = SUCCESSFUL`)*

Then the customer approves the payment.
Flutterwave sends your webhook:
```text
   Flutterwave
        │
        │ POST
        ▼
/api/payments/webhook/flutterwave
```

Your backend verifies the payment and then changes:
`PENDING` ↓ `SUCCESSFUL`

Flutterwave specifically recommends verifying the transaction before providing the purchased service/value.

## 10. Create your webhook

Your `.env` can contain:
```env
APP_URL=http://localhost:3000
FLUTTERWAVE_WEBHOOK_URL=http://localhost:3000/api/payments/webhook/flutterwave
FLUTTERWAVE_WEBHOOK_SECRET=...
```

But remember: **Flutterwave cannot normally reach your localhost.**
For local development, use a public HTTPS tunnel such as:
`https://your-tunnel-url.ngrok-free.app`

Then:
```env
FLUTTERWAVE_WEBHOOK_URL=https://your-tunnel-url.ngrok-free.app/api/payments/webhook/flutterwave
```

In production:
```env
FLUTTERWAVE_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook/flutterwave
```

## 11. Configure the webhook in Flutterwave

In your Flutterwave dashboard:
**Settings ↓ Webhooks ↓ Add webhook**

Set:
- Webhook URL: `https://your-domain.com/api/payments/webhook/flutterwave`

Flutterwave recommends using a webhook because mobile-money transactions can complete asynchronously.

## 12. Protect the webhook

Don't simply accept `POST /api/payments/webhook/flutterwave` from anyone.
Flutterwave supports webhook signature verification. Their current documentation describes using a secret hash/signature to ensure the request came from Flutterwave.

Your backend should effectively do:
```text
    Incoming webhook
            │
            ▼
     Check signature
            │
       ┌────┴────┐
       │         │
    Invalid    Valid
       │         │
    Reject       ▼
           Verify payment
                 │
                 ▼
          Update database
```

## 13. Your Supabase payment table

I'd create something like:
```sql
create table payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    order_id uuid,
    provider text not null,
    provider_transaction_id text,
    transaction_reference text not null unique,
    amount numeric(12,2) not null,
    currency text not null default 'UGX',
    payment_method text,
    mobile_network text,
    phone_number text,
    status text not null default 'PENDING',
    provider_response jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

For example:
- `id` → UUID
- `provider` → flutterwave
- `reference` → ORD-20260912-00001
- `amount` → 50000
- `currency` → UGX
- `network` → MTN
- `phone` → 2567xxxxxxx
- `status` → PENDING

## 14. Also create payment events

I strongly recommend another table:
```sql
create table payment_events (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid,
    provider text not null,
    event_type text,
    payload jsonb,
    created_at timestamptz default now()
);
```

This gives you an audit trail. For example:
- `10:01:02` payment.created
- `10:01:15` payment.pending
- `10:02:04` webhook.received
- `10:02:05` payment.verified
- `10:02:06` payment.successful

That's very useful when troubleshooting payment disputes.

## 15. Your final payment architecture

Since you originally wanted all five providers, I'd actually build your application like this:

```text
       PAYMENT SERVICE
              │
 ┌────────────┼─────────────┐
 │            │             │
 ▼            ▼             ▼
FLUTTERWAVE PESAPAL       STRIPE
 │            │             │
 ┌────┴────┐    ▼             ▼
MTN     AIRTEL
MoMo    Money
```

So Flutterwave handles:
- MTN Mobile Money
- Airtel Money
- Cards

while Pesapal and Stripe can remain additional providers where useful. This means you don't need the Airtel Developer Portal just to accept Airtel Money through Flutterwave. Flutterwave already documents Uganda mobile money with MTN and Airtel networks.

---

## What I recommend you do now

Let's get Flutterwave working first, rather than trying to configure all providers simultaneously.

**Step 1**
Create/login to your Flutterwave developer account.
[Open Flutterwave Developer Portal](https://developer.flutterwave.com/?utm_source=chatgpt.com)

**Step 2**
Get your Test/Sandbox API credentials from:
Dashboard → Settings → API Keys
*(Flutterwave says test and live credentials are environment-specific.)*

**Step 3**
Put them in:
```env
FLUTTERWAVE_PUBLIC_KEY=...
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_ENCRYPTION_KEY=...
FLUTTERWAVE_WEBHOOK_SECRET=...
```

**Step 4**
Don't send the keys to me. Just tell me:
*"I have obtained the Flutterwave test keys."*

Then I can take you through the actual implementation, starting with your Supabase payments tables and then building the Flutterwave payment endpoint for UGX + MTN/Airtel + cards, followed by the webhook and payment verification.
