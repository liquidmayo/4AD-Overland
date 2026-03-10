import React, { useState } from 'react';

export type RollRequest = {
  id: string;
  notation: string;
  reason: string;
  resolve: (value: number) => void;
};

interface DiceModalProps {
  request: RollRequest;
  onRoll: (val: number) => void;
}

export default function DiceModal({ request, onRoll }: DiceModalProps) {
  const [val, setVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(val);
    if (!isNaN(num)) {
      onRoll(num);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-2 text-slate-800">Dice Roll Required</h3>
        <p className="mb-4 text-slate-600">{request.reason}</p>
        
        <div className="bg-slate-100 p-4 rounded-lg mb-6 text-center">
          <span className="text-sm text-slate-500 uppercase tracking-wider font-bold">Roll</span>
          <p className="text-3xl font-mono font-bold text-slate-800 mt-1">{request.notation}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 mb-1">Result</label>
          <input 
            type="number" 
            value={val} 
            onChange={e => setVal(e.target.value)}
            className="w-full border border-slate-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            autoFocus
            required
            min="1"
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Submit Roll
          </button>
        </form>
      </div>
    </div>
  );
}
