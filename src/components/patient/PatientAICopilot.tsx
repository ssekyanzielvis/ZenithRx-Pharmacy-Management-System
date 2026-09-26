import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
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

interface PatientAICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  patientUser: PatientProfile | null;
  onOpenTeleconsult?: () => void;
}

const DEFAULT_PROMPT_PILLS = [
  {
    icon: Clock,
    label: 'Missed Dose',
    query: 'I missed my morning dose of medication. What is the safe protocol on whether to take it now or wait?',
  },
  {
    icon: Pill,
    label: 'Check Interactions',
    query: 'Can I safely take Painkillers (like Ibuprofen or Panadol) alongside my routine antibiotics or blood pressure pills?',
  },
  {
    icon: AlertTriangle,
    label: 'Side Effects Check',
    query: 'I am experiencing mild nausea and dizziness after starting my new prescription. Is this normal or dangerous?',
  },
  {
    icon: HeartPulse,
    label: 'Emergency Symptoms',
    query: 'What are the emergency red-flag symptoms that mean I should go straight to the hospital rather than wait?',
  },
];

export const PatientAICopilot: React.FC<PatientAICopilotProps> = ({
  isOpen,
  onClose,
  patientUser,
  onOpenTeleconsult,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: `Hello ${patientUser?.fullName || 'there'}! I am **Quantum RxAI**, your personal clinical assistant at ZenithRx.\n\nAre you feeling confused about your prescription, unsure what to do after a missed dose, or experiencing unexpected symptoms? Ask me anything below, or pick a quick topic.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

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
        content: result.error || 'I could not reach the clinical engine. Please speak to our on-duty pharmacist via Teleconsult.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }

    setIsLoading(false);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const cleanText = text.replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl ring-2 ring-white/30">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Quantum RxAI Copilot</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-white/20 rounded-full">
                  Clinical Triage
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                Always-on 24/7 patient guidance & triage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages with 1cm vertical spacing */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-[1cm] bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            const triage = msg.triage;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'} group`}
              >
                {isAI && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-200 dark:border-teal-800 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                    isAI
                      ? 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                      : 'bg-teal-600 text-white rounded-br-none'
                  }`}
                >
                  {/* Triage Alert Banner if applicable */}
                  {triage && triage.triageLevel === 'URGENT_EMERGENCY' && (
                    <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs uppercase tracking-wide">
                          Urgent Red Flag Detected
                        </div>
                        <p className="text-xs mt-0.5">{triage.immediateAction}</p>
                        <a
                          href="tel:999"
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Dial Emergency (999 / 112)
                        </a>
                      </div>
                    </div>
                  )}

                  {triage && triage.triageLevel === 'PHARMACIST_CONSULT_RECOMMENDED' && (
                    <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                      <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs uppercase tracking-wide">
                          Pharmacist Consult Recommended
                        </div>
                        <p className="text-xs mt-0.5">{triage.immediateAction}</p>
                        {onOpenTeleconsult && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenTeleconsult();
                            }}
                            className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                          >
                            Book 1-Click Teleconsult
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message text with newline rendering */}
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Immediate Action Pill */}
                  {triage && triage.triageLevel === 'ROUTINE' && triage.immediateAction && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                      <span className="font-semibold">Next Step:</span>
                      <span>{triage.immediateAction}</span>
                    </div>
                  )}

                  {/* Suggested Follow-up Quick Replies */}
                  {triage?.suggestedQuickReplies && triage.suggestedQuickReplies.length > 0 && (
                    <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                      {triage.suggestedQuickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(reply)}
                          className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Text-to-Speech */}
                  <div className="mt-2 flex items-center justify-between text-[10px] opacity-60">
                    <span>{msg.timestamp}</span>
                    {isAI && (
                      <button
                        onClick={() => handleSpeak(msg.content)}
                        className="hover:opacity-100 transition-opacity p-0.5"
                        title="Read aloud"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3 h-3 text-teal-600" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!isAI && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400 pl-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center animate-spin">
                <RefreshCw className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span>Quantum RxAI is reviewing clinical safety database...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Topic Chips (When few messages) */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Common Questions When Stuck:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_PROMPT_PILLS.map((pill, idx) => {
                const Icon = pill.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(pill.query)}
                    className="flex items-center gap-2 p-2.5 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl text-xs text-slate-700 dark:text-slate-200 transition-all group"
                  >
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-medium truncate">{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Input */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your medicine, dose, side effects, or symptoms..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500 dark:focus:border-teal-400 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" />
            AI guidance is assistive. For emergency conditions or prescription dispensing, our licensed pharmacists provide final clinical oversight.
          </div>
        </div>
      </div>
    </div>
  );
};
