import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertTriangle,
  PhoneCall,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Pill,
  Clock,
  HeartPulse,
  ChevronRight,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Mic,
  MicOff,
  Stethoscope,
  Info,
  ShieldAlert,
  ArrowRight,
  Building2,
  MessageSquare,
} from 'lucide-react';
import {
  askPatientCopilot,
  PatientCopilotContext,
  PatientCopilotResponse,
} from '../../services/aiService';
import { PatientProfile } from '../../services/patientAuthService';

interface Message {
  id: string;
  sender: 'patient' | 'assistant';
  content: string;
  timestamp: string;
  triage?: PatientCopilotResponse;
}

interface PatientAICopilotPageProps {
  patientUser: PatientProfile | null;
  onOpenTeleconsult?: () => void;
  onNavigateToMedSearch?: (query: string) => void;
}

const QUICK_PROMPT_TOPICS = [
  {
    icon: Clock,
    label: 'Missed Dose',
    description: 'Safe protocol if a dose was skipped',
    query: 'I missed my morning dose of medication. What is the safe protocol on whether to take it now or wait?',
    category: 'Dosage',
  },
  {
    icon: Pill,
    label: 'Drug Interactions',
    description: 'Check painkiller & antibiotic safety',
    query: 'Can I safely take Painkillers (like Ibuprofen or Panadol) alongside my routine antibiotics or blood pressure pills?',
    category: 'Safety',
  },
  {
    icon: AlertTriangle,
    label: 'Side Effects Check',
    description: 'Assess dizziness, nausea, or rash',
    query: 'I am experiencing mild nausea and dizziness after starting my new prescription. Is this normal or dangerous?',
    category: 'Triage',
  },
  {
    icon: HeartPulse,
    label: 'Emergency Red Flags',
    description: 'Symptoms needing immediate ER care',
    query: 'What are the emergency red-flag symptoms that mean I should go straight to the hospital rather than wait?',
    category: 'Emergency',
  },
  {
    icon: Stethoscope,
    label: 'Food & Drink Conflicts',
    description: 'Grapefruit, dairy & alcohol safety',
    query: 'Are there any food, dairy, or drink restrictions (like grapefruit juice or alcohol) with my common medications?',
    category: 'Lifestyle',
  },
  {
    icon: ShieldCheck,
    label: 'Storage & Expiry',
    description: 'Room temp vs refrigeration rules',
    query: 'How should I store reconstituted antibiotic suspensions and eye drops after opening?',
    category: 'Storage',
  },
];

export const PatientAICopilotPage: React.FC<PatientAICopilotPageProps> = ({
  patientUser,
  onOpenTeleconsult,
  onNavigateToMedSearch,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: `Hello ${patientUser?.fullName || 'there'}! I am **Quantum RxAI**, your personal clinical assistant at ZenithRx.\n\nI can help you understand your prescription, check for drug interactions, advise on missed doses, or evaluate side effects. Ask me anything below or choose a topic to get started.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const context: PatientCopilotContext = {
      patientId: patientUser?.id,
      name: patientUser?.fullName,
      age: patientUser?.age,
      allergies: patientUser?.allergies || [],
      activeMedications: ['Augmentin 625mg', 'Panadol Extra'],
      chronicConditions: patientUser?.chronicConditions || [],
    };

    const historyPayload = messages.map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    const result = await askPatientCopilot(query, historyPayload, context);

    if (result.success && result.data) {
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: result.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        triage: result.data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const fallbackMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        content:
          result.error ||
          'I could not reach the clinical safety database. Please speak directly to our on-duty pharmacist via Teleconsult.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }

    setIsLoading(false);
  };

  const handleSpeak = (msgId: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking && speakingMsgId === msgId) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      } else {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingMsgId(null);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setSpeakingMsgId(null);
        };
        setIsSpeaking(true);
        setSpeakingMsgId(msgId);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleReset = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        content: `Session refreshed. Hello ${patientUser?.fullName || 'there'}! What clinical questions or medication concerns can I help you resolve today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-[1cm]" style={{ paddingTop: '1cm', paddingBottom: '1cm' }}>
      {/* ── 1. Page Header & Clinical Triage Command Bar ── */}
      <div
        className="bg-gradient-to-r from-[#0d3b43] via-[#092e35] to-[#071a24] text-white rounded-3xl border border-teal-500/30 shadow-lg relative overflow-hidden"
        style={{ padding: '1cm', marginBottom: '1cm' }}
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-xs">
                <Sparkles className="w-5 h-5 text-teal-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Quantum RxAI Copilot
                  </h1>
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                    24/7 Clinical Triage
                  </span>
                </div>
                <p className="text-xs text-teal-200/90 font-medium mt-1">
                  Intelligent dosage clarification, drug interactions &amp; symptom severity screening
                </p>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenTeleconsult && (
              <button
                onClick={onOpenTeleconsult}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Human Pharmacist</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Patient Clinical Profile Context Bar with 1cm vertical spacing */}
        <div
          className="border-t border-teal-500/20 flex items-center justify-between gap-3 text-xs text-teal-100/80 flex-wrap"
          style={{ marginTop: '1cm', paddingTop: '1cm' }}
        >
          <div className="flex items-center gap-2 font-medium">
            <span className="text-emerald-400 font-bold">Safety Profile:</span>
            <span>{patientUser?.fullName || 'Grace Nakato'}</span>
            <span>•</span>
            <span>Allergies: {patientUser?.allergies?.length ? patientUser.allergies.join(', ') : 'None Recorded'}</span>
            <span>•</span>
            <span>Regimen: Active Antibiotics &amp; Analgesics</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NDA &amp; PSU Clinical Guidelines Grounded</span>
          </div>
        </div>
      </div>

      {/* ── 2. Main Two-Column Layout (Chat Canvas & Clinical Panel) with 1cm gap ── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 items-start"
        style={{ marginTop: '1cm', gap: '1cm' }}
      >
        
        {/* Left / Main Chat Canvas (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col h-[740px] overflow-hidden">
          
          {/* Chat Messages Stream with 1cm vertical spacing */}
          <div
            className="flex-1 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/30 flex flex-col"
            style={{ padding: '1cm', gap: '1cm' }}
          >
            {messages.map((msg) => {
              const isAI = msg.sender === 'assistant';
              const triage = msg.triage;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'} group`}
                >
                  {isAI && (
                    <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs border border-teal-400/40 mt-0.5">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl shadow-xs text-sm leading-relaxed transition-all ${
                      isAI
                        ? 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs'
                        : 'bg-teal-700 dark:bg-teal-600 text-white rounded-br-none shadow-md font-medium'
                    }`}
                    style={{ padding: '1cm' }}
                  >
                    {/* Triage Alert: Urgent Red Flag */}
                    {triage && triage.triageLevel === 'URGENT_EMERGENCY' && (
                      <div
                        className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200"
                        style={{ padding: '0.6cm' }}
                      >
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-black text-xs uppercase tracking-wide text-rose-700 dark:text-rose-300">
                            🚨 Urgent Red Flag Detected
                          </div>
                          <p className="text-xs leading-relaxed">{triage.immediateAction}</p>
                          <a
                            href="tel:999"
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Dial Emergency (999 / 112)</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Triage Alert: Pharmacist Consultation Recommended */}
                    {triage && triage.triageLevel === 'PHARMACIST_CONSULT_RECOMMENDED' && (
                      <div
                        className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200"
                        style={{ padding: '0.6cm' }}
                      >
                        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-black text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            👨‍⚕️ Pharmacist Clinical Review Recommended
                          </div>
                          <p className="text-xs leading-relaxed">{triage.immediateAction}</p>
                          {onOpenTeleconsult && (
                            <button
                              onClick={onOpenTeleconsult}
                              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                            >
                              <span>Book 1-Click Teleconsult</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Main Content */}
                    <div className="whitespace-pre-line space-y-2">{msg.content}</div>

                    {/* Immediate Action Protocol for Routine Queries */}
                    {triage && triage.triageLevel === 'ROUTINE' && triage.immediateAction && (
                      <div
                        className="border-t border-slate-100 dark:border-slate-700/60 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1.5 font-medium"
                        style={{ marginTop: '0.5cm', paddingTop: '0.5cm' }}
                      >
                        <span className="font-black text-slate-800 dark:text-slate-200">Next Step:</span>
                        <span>{triage.immediateAction}</span>
                      </div>
                    )}

                    {/* Follow-up Quick Action Chips */}
                    {triage?.suggestedQuickReplies && triage.suggestedQuickReplies.length > 0 && (
                      <div
                        className="border-t border-slate-100 dark:border-slate-700/60 space-y-2"
                        style={{ marginTop: '0.5cm', paddingTop: '0.5cm' }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggested Follow-ups:</p>
                        <div className="flex flex-wrap gap-2">
                          {triage.suggestedQuickReplies.map((reply, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(reply)}
                              className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl border border-slate-200 dark:border-slate-600 transition-all font-semibold cursor-pointer"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions: Timestamp, TTS, Copy */}
                    <div
                      className="flex items-center justify-between text-[11px] opacity-70 border-t border-slate-100 dark:border-slate-700/40"
                      style={{ marginTop: '0.5cm', paddingTop: '0.4cm' }}
                    >
                      <span>{msg.timestamp}</span>
                      {isAI && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSpeak(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-teal-600 transition-all cursor-pointer"
                            title={speakingMsgId === msg.id && isSpeaking ? 'Stop speech' : 'Read aloud'}
                          >
                            {speakingMsgId === msg.id && isSpeaking ? (
                              <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-teal-600 transition-all cursor-pointer"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isAI && (
                    <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      {patientUser?.fullName ? patientUser.fullName.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div
                className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit animate-pulse"
                style={{ padding: '0.6cm' }}
              >
                <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
                <span>Quantum RxAI is screening clinical pharmacology database &amp; checking dosage safety...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Topic Chips (When few messages) with 1cm vertical spacing */}
          {messages.length <= 3 && (
            <div
              className="border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs"
              style={{ padding: '1cm' }}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                Frequently Asked Clinical Questions:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '0.5cm' }}>
                {QUICK_PROMPT_TOPICS.slice(0, 4).map((topic, idx) => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(topic.query)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">{topic.label}</span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">{topic.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Chat Input Bar with 1cm vertical spacing */}
          <div
            className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
            style={{ padding: '1cm' }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2.5"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about medicines, side effects, interactions, or dosage..."
                  disabled={isLoading}
                  className="w-full py-3.5 pl-4 pr-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium shadow-2xs"
                />
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute right-3 p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-teal-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div
              className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1.5"
              style={{ marginTop: '0.6cm' }}
            >
              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                AI guidance is assistive. For emergency conditions or prescription modifications, our registered pharmacists provide final clinical oversight.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Safety & Protocol Panel (4 cols on lg) with exact 1cm vertical gap between cards */}
        <div className="lg:col-span-4 flex flex-col" style={{ gap: '1cm' }}>
          
          {/* Active Safety Profile Card with 1cm padding */}
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-4"
            style={{ padding: '1cm' }}
          >
            <div
              className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: '0.5cm' }}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Active Clinical Safety Shield
                </h3>
                <p className="text-[10px] text-slate-400">Personalized to your registered profile</p>
              </div>
            </div>

            <div className="space-y-3 text-xs" style={{ marginTop: '0.5cm', marginBottom: '0.5cm' }}>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{patientUser?.fullName || 'Grace Nakato'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">Known Allergies:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                  {patientUser?.allergies?.length ? patientUser.allergies.join(', ') : 'None Reported'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">Chronic Conditions:</span>
                <span className="font-bold text-cyan-700 dark:text-cyan-300">
                  {patientUser?.chronicConditions?.length ? patientUser.chronicConditions.join(', ') : 'Hypertension (Mild)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Active Regimen:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">2 Monitored Drugs</span>
              </div>
            </div>

            {onNavigateToMedSearch && (
              <button
                onClick={() => onNavigateToMedSearch('')}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ marginTop: '0.5cm' }}
              >
                <span>Browse Formulary &amp; Stock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Guided Clinical Topics Card with 1cm padding */}
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-4"
            style={{ padding: '1cm' }}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Guided Clinical Queries
            </h4>
            <div className="space-y-3" style={{ gap: '0.4cm', display: 'flex', flexDirection: 'column' }}>
              {QUICK_PROMPT_TOPICS.map((topic, i) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(topic.query)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-100 dark:border-slate-800/80 hover:border-teal-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{topic.label}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{topic.description}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 ml-2">
                      {topic.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Escalation & Teleconsult Card with 1cm padding */}
          <div
            className="bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-800/40 rounded-3xl shadow-xs space-y-4"
            style={{ padding: '1cm' }}
          >
            <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4" />
              <span>Clinical Safety Escalation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you develop chest pain, severe shortness of breath, anaphylaxis, or confusion, call emergency services immediately:
            </p>
            <div className="grid grid-cols-2 gap-3" style={{ paddingTop: '0.3cm' }}>
              <a
                href="tel:999"
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 999 / 112</span>
              </a>
              <a
                href="tel:0200913555"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs text-center flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                <span>PSU Hotline</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
