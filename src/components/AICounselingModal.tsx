import React, { useState } from 'react';
import { Sparkles, X, Loader2, BookOpen, Send } from 'lucide-react';
import { DrugItem } from '../types';

interface AICounselingModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugs: DrugItem[];
}

export const AICounselingModal: React.FC<AICounselingModalProps> = ({
  isOpen,
  onClose,
  drugs,
}) => {
  const [selectedDrug, setSelectedDrug] = useState(drugs[0]?.brandName || 'Augmentin 625mg');
  const [patientName, setPatientName] = useState('Sarah Wanjiku');
  const [dosage, setDosage] = useState('1 tablet twice daily after meals for 7 days');
  const [counselingOutput, setCounselingOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCounseling = async () => {
    setIsLoading(true);
    setCounselingOutput('');
    try {
      const res = await fetch('/api/ai/counseling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugName: selectedDrug,
          patientName,
          dosage,
        }),
      });
      const data = await res.json();
      if (data.counselingText) {
        setCounselingOutput(data.counselingText);
      } else {
        setCounselingOutput(
          `**Patient Counseling Leaflet for ${patientName}**\n\n` +
            `**Medication:** ${selectedDrug}\n` +
            `**Directions:** ${dosage}\n\n` +
            `1. **How to Take:** Take each dose with a full glass of water. It is best taken with or right after a meal to reduce stomach discomfort.\n` +
            `2. **Food & Drink:** Avoid alcohol during treatment. Drink plenty of fluids throughout the day.\n` +
            `3. **Missed Dose:** If you miss a dose, take it as soon as you remember unless it is almost time for your next scheduled dose.\n` +
            `4. **Side Effects to Monitor:** Mild nausea, loose stools, or mild headache. Contact pharmacy if severe rash or swelling occurs.\n` +
            `5. **Storage:** Store below 25°C in a cool, dry place away from direct sunlight.`
        );
      }
    } catch (err) {
      console.error('Counseling error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Quantum RxAI Patient Counseling Assistant</h3>
            <p className="text-xs text-slate-500">Generate personalized patient medication guidance leaflets</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block">Medication:</label>
            <select
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium mt-1"
            >
              {drugs.map((d) => (
                <option key={d.id} value={d.brandName}>{d.brandName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block">Patient Name:</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium mt-1"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="font-bold text-slate-700 block">Dosage Instructions:</label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium mt-1"
          />
        </div>

        <button
          onClick={handleGenerateCounseling}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Generate Clinical Patient Advice</span>
        </button>

        {counselingOutput && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs max-h-60 overflow-y-auto whitespace-pre-wrap font-sans text-slate-800">
            {counselingOutput}
          </div>
        )}
      </div>
    </div>
  );
};
