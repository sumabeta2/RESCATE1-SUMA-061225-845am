import React, { useState } from 'react';
import { ArrowLeft, Search, Lock, Unlock, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { ClinicalCase, PatientData, RoleType } from '../types';

interface HistoryScreenProps {
  onBack: () => void;
  onSelectCase: (data: PatientData, role: RoleType, date: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<ClinicalCase[]>([
    { id: '1', patientName: 'JUAN PÉREZ', date: new Date().toISOString(), diagnosis_summary: 'Dolor torácico agudo', isProtected: false, roleUsed: 'PARAMEDICO', data: { name: 'JUAN PÉREZ', age: '45', sex: 'M', medication: 'Ninguna', history: 'Hipertensión' } },
    { id: '2', patientName: 'MARÍA GONZÁLEZ', date: new Date(Date.now() - 86400000 * 2).toISOString(), diagnosis_summary: 'Reacción alérgica', isProtected: true, roleUsed: 'MEDICO', data: { name: 'MARÍA GONZÁLEZ', age: '32', sex: 'F', medication: 'Loratadina', history: 'Alergia a AINES' } }
  ]);

  const toggleProtection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCases(prevCases => prevCases.map(c => c.id === id ? { ...c, isProtected: !c.isProtected } : c));
  };

  const filteredCases = cases.filter(c => c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.diagnosis_summary.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1"><h1 className="font-black text-lg text-slate-800 uppercase tracking-wide">HISTORIAL DE CASOS</h1></div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto w-full px-4 pt-4 space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start"><AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /><p className="text-xs text-yellow-800 leading-relaxed font-medium">Los casos se borrarán automáticamente a los 30 días. Si desea que no se borren, proteja el caso haciendo clic en el icono del candado (<Lock className="w-3 h-3 inline" />).</p></div>
        <div className="relative"><input type="text" placeholder="BUSCAR POR NOMBRE O DIAGNÓSTICO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-bold uppercase text-sm" /><Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" /></div>
      </div>
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-4 space-y-3">
        {filteredCases.map((item) => (
          <div key={item.id} onClick={() => onSelectCase(item.data, item.roleUsed, item.date)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer flex items-center justify-between group">
            <div className="flex items-start gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><FileText className="w-5 h-5" /></div>
              <div className="min-w-0"><h3 className="font-black text-slate-800 uppercase truncate">{item.patientName}</h3><p className="text-xs text-slate-500 font-bold uppercase truncate">{item.diagnosis_summary}</p><p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
            </div>
            <div className="flex items-center gap-3 pl-2">
              <button onClick={(e) => toggleProtection(e, item.id)} className={`p-2 rounded-full transition-colors ${item.isProtected ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500'}`}>{item.isProtected ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}</button>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-500 transition-colors" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};