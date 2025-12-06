import React, { useState, useEffect } from 'react';
import { LogOut, HelpCircle, FileText, Shield, User, AlertTriangle } from 'lucide-react';
import { RoleType, PatientData, AccessCode } from '../types';

interface PatientFormScreenProps {
  isAdmin: boolean;
  activeCode: AccessCode | null;
  onStartAssistance: (data: PatientData, role: RoleType) => void;
  onLogout: () => void;
  onOpenSupport: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
}

export const PatientFormScreen: React.FC<PatientFormScreenProps> = ({ isAdmin, activeCode, onStartAssistance, onLogout, onOpenSupport, onOpenHistory, onOpenAdmin }) => {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [formData, setFormData] = useState<PatientData>({
    name: '',
    age: '',
    sex: '',
    medication: '',
    history: ''
  });
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (activeCode && activeCode.expiresAt) {
        const expires = new Date(activeCode.expiresAt).getTime();
        const now = new Date().getTime();
        const diffHours = (expires - now) / (1000 * 60 * 60);

        if (activeCode.type === '24H' && diffHours > 0 && diffHours <= 4) {
            setWarningMessage("FALTAN 4 HORAS PARA CADUCAR EL CÓDIGO. Comuníquese con la persona que le dio acceso para recibir un código definitivo y permanente.");
        } else if (activeCode.type === 'MONTHLY' && diffHours > 0 && diffHours <= 24) {
            setWarningMessage("Su código mensual caduca en menos de 24 horas. Contacte al administrador para renovarlo.");
        } else {
            setWarningMessage('');
        }
    }
  }, [activeCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.name.trim().length > 0 && formData.age.trim().length > 0 && selectedRole !== null;

  const handleSubmit = () => {
    if (isFormValid && selectedRole) {
      onStartAssistance(formData, selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex items-center justify-center animate-heartbeat-slow">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-red-600 drop-shadow-sm"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              <span className="absolute text-white text-lg font-bold font-sans pb-0.5 shadow-sm z-20">S</span>
              <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none overflow-hidden z-10 text-green-400">
                 <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                   <path d="M0 50 L200 50 L215 20 L225 80 L235 50 L245 50 L260 20 L275 80 L285 50 L500 50" fill="none" stroke="currentColor" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" className="animate-ecg-flow" style={{ strokeDasharray: '500', strokeDashoffset: '500' }} />
                 </svg>
              </div>
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-wider">SUMA</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpenHistory} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm font-medium transition-colors shadow-sm"><FileText className="w-4 h-4" /><span className="font-bold uppercase">HISTORIAL</span></button>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold transition-colors uppercase ml-1"><LogOut className="w-4 h-4" /><span className="sr-only sm:not-sr-only">SALIR</span></button>
          </div>
        </div>
      </header>

      {warningMessage && (
        <div className="bg-red-600 p-4 animate-pulse">
            <div className="max-w-3xl mx-auto flex items-start gap-3 text-white">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <p className="font-black uppercase text-sm leading-tight">{warningMessage}</p>
            </div>
        </div>
      )}
      
      {isAdmin && (
        <div className="bg-white border-b border-slate-200 p-2 flex justify-center">
            <button onClick={onOpenAdmin} className="bg-black text-red-500 font-black uppercase text-sm px-6 py-2 rounded-lg shadow-md hover:bg-gray-900 transition-colors flex items-center gap-2">
                <Shield className="w-4 h-4" /> ADMON
            </button>
        </div>
      )}
      
      <div className="bg-slate-200 py-1 text-center border-b border-slate-300"><span className="text-red-600 font-black text-xs uppercase tracking-[0.2em]">NUEVO CASO</span></div>
      
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-6 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2 border-l-4 border-red-600 pl-3">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Mi Rol <span className="text-red-500">*</span></h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {(['MEDICO', 'ENFERMERO', 'PARAMEDICO', 'PRIMER_RESPONDIENTE'] as RoleType[]).map((role) => (
              <button key={role} onClick={() => setSelectedRole(role)} className={`p-4 rounded-xl text-center font-bold text-sm sm:text-base transition-all duration-200 shadow-sm border-2 uppercase ${selectedRole === role ? 'bg-red-600 text-white border-red-600 shadow-red-200 scale-[1.02]' : 'bg-white text-slate-700 border-transparent hover:border-red-100 hover:bg-slate-50'}`}>
                {role === 'MEDICO' && 'MÉDICO'}{role === 'ENFERMERO' && 'ENFERMERO'}{role === 'PARAMEDICO' && 'PARAMÉDICO'}{role === 'PRIMER_RESPONDIENTE' && '1er RESPONDIENTE'}
              </button>
            ))}
          </div>
          {!selectedRole && <p className="text-xs text-red-500 font-bold uppercase animate-pulse pl-3">* Debes seleccionar un rol</p>}
        </section>
        
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Datos del Paciente / Víctima</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">NOMBRE COMPLETO <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Escribe el nombre..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-bold uppercase" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">EDAD <span className="text-red-500">*</span></label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">SEXO</label>
              <select name="sex" value={formData.sex} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-bold uppercase appearance-none ${formData.sex ? 'text-slate-900' : 'text-slate-400'}`}>
                <option value="">SELECCIONAR...</option>
                <option value="M" className="text-slate-900">MASCULINO</option>
                <option value="F" className="text-slate-900">FEMENINO</option>
                <option value="O" className="text-slate-900">OTRO</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">MEDICACIÓN ACTUAL</label>
              <input type="text" name="medication" value={formData.medication} onChange={handleInputChange} placeholder="EJ: INSULINA, HIPERTENSIVOS..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-bold uppercase" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ANTECEDENTES DE SALUD</label>
              <textarea name="history" value={formData.history} onChange={handleInputChange} rows={2} placeholder="EJ: DIABETES, CIRUGÍAS PREVIAS..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-bold uppercase resize-none" />
            </div>
          </div>
        </section>
      </main>
      <footer className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-20 space-y-3">
        <div className="max-w-3xl mx-auto space-y-3">
          <button disabled={!isFormValid} onClick={handleSubmit} className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg transition-all duration-200 ${isFormValid ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/40 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>INICIAR ASISTENCIA</button>
          <button onClick={onOpenSupport} className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-2"><HelpCircle className="w-5 h-5" /> Soporte Técnico</button>
        </div>
      </footer>
    </div>
  );