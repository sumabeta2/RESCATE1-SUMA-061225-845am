import React, { useState } from 'react';
import { Eye, EyeOff, Activity, AlertCircle } from 'lucide-react';
import { getDeviceId } from '../utils/device-id'; // Corrected import path
import { AccessCode } from '../types';

interface ActivationScreenProps {
  onActivate: (code: string | AccessCode) => void;
  codes: AccessCode[];
  onCodeUpdate: (code: AccessCode) => void;
}

const ADMIN_CODE = '561393';

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivate, codes, onCodeUpdate }) => {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
      setError('');
    }
  };

  const handleActivateClick = () => {
    if (code.length !== 6) return;

    if (code === ADMIN_CODE) {
      onActivate(code);
      return;
    }

    const foundCode = codes.find(c => c.code === code);
    
    if (!foundCode) {
      setError('Código inválido.');
      return;
    }

    if (foundCode.status === 'BLOCKED' || foundCode.status === 'EXPIRED' || foundCode.status === 'USED') {
      setError('Este código ha caducado, está en uso o está bloqueado.');
      return;
    }

    const deviceId = getDeviceId();

    if (foundCode.deviceId && foundCode.deviceId !== deviceId) {
      setError('Código inválido para este dispositivo.');
      return;
    }

    let updatedCode = { ...foundCode };
    
    if (updatedCode.status === 'AVAILABLE') {
       updatedCode.deviceId = deviceId;
       updatedCode.status = 'ACTIVE';
       
       if (!updatedCode.activatedAt) {
           updatedCode.activatedAt = new Date().toISOString();
           if (foundCode.type === '24H') {
               updatedCode.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
           } else {
               updatedCode.expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
           }
       }
       onCodeUpdate(updatedCode);
    }

    if (updatedCode.expiresAt && new Date() > new Date(updatedCode.expiresAt)) {
        updatedCode.status = 'EXPIRED';
        onCodeUpdate(updatedCode);
        setError('El código ha expirado.');
        return;
    }

    onActivate(updatedCode);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md flex flex-col items-center z-10 space-y-8">
        <div className="relative w-40 h-40 flex items-center justify-center animate-heartbeat">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-red-600 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))' }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="absolute text-white text-6xl font-bold font-sans pb-2 z-20">S</span>
          <div className="absolute inset-0 flex items-center justify-center opacity-90 pointer-events-none overflow-hidden z-10 text-green-400">
            <svg className="w-full h-16" viewBox="0 0 500 100" preserveAspectRatio="none">
               <path d="M0 50 L200 50 L215 20 L225 80 L235 50 L245 50 L260 20 L275 80 L285 50 L500 50" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" className="animate-ecg-flow" style={{ strokeDasharray: '500', strokeDashoffset: '500' }} />
            </svg>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold tracking-[0.3em] text-slate-800">SUMA</h1>
          <p className="text-gray-500 font-medium text-sm sm:text-base max-w-xs mx-auto leading-relaxed">Tu Asistente Médico Personal, <br/> Cuando Más Lo Necesitas</p>
        </div>
        
        <div className="w-full space-y-6 pt-4 flex flex-col items-center">
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Activity className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input type={showCode ? "text" : "password"} maxLength={6} value={code} onChange={handleCodeChange} className="block w-full pl-10 pr-12 py-4 border-2 border-gray-200 rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 sm:text-2xl text-xl tracking-[0.5em] text-center font-bold transition-all shadow-sm" placeholder="000000" />
            <button type="button" onClick={() => setShowCode(!showCode)} className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
              {showCode ? <EyeOff className="h-6 w-6" aria-hidden="true" /> : <Eye className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>

          {error && (
             <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
                <AlertCircle className="w-4 h-4"/> {error}
             </div>
          )}

          <button type="button" disabled={code.length !== 6} onClick={handleActivateClick} className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white transition-all transform hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 active:scale-[0.98] ${code.length === 6 ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/30 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}>ACTIVAR</button>
          <div className="pt-2"><span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">v2.5</span></div>
        </div>
      </div>
    </div>
  );