import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Trash2, Shield, X, User, Smartphone, Monitor, Save } from 'lucide-react';
import { AccessCode } from '../types';

interface AdminScreenProps {
  onBack: () => void;
  codes: AccessCode[];
  onUpdateCode: (code: AccessCode) => void;
  onDeleteCode: (code: string) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack, codes, onUpdateCode, onDeleteCode }) => {
  const [activeTab, setActiveTab] = useState<'24H' | 'MONTHLY'>('24H');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    if (selectedCode) {
        setEditName(selectedCode.assignedTo || '');
        setEditPhone(selectedCode.phoneNumber || '');
    }
  }, [selectedCode]);

  const handleSaveUser = () => {
    if (selectedCode) {
        const updated = {
            ...selectedCode,
            assignedTo: editName,
            phoneNumber: editPhone
        };
        onUpdateCode(updated);
        setSelectedCode(updated);
        alert("Datos guardados correctamente.");
    }
  };

  const toggleStatus = (codeItem: AccessCode) => {
    const updated = {
        ...codeItem,
        status: codeItem.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' as any
    };
    onUpdateCode(updated);
  };

  const filteredCodes = codes.filter(c => {
      if (activeTab === '24H') return c.type === '24H';
      if (activeTab === 'MONTHLY') return c.type === 'MONTHLY';
      return false;
  }).filter(c => c.code.includes(searchTerm) || c.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusPill = (status: AccessCode['status']) => {
    switch(status) {
      case 'AVAILABLE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">DISPONIBLE</span>;
      case 'USED':
      case 'EXPIRED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{status}</span>;
      case 'BLOCKED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">BLOQUEADO</span>;
      case 'ACTIVE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">ACTIVO</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-200">
      <header className="bg-slate-950 shadow-md sticky top-0 z-20 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1"><h1 className="font-black text-lg text-white uppercase tracking-wide flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500" /> ADMINISTRACIÓN</h1></div>
        </div>
      </header>

      <div className="bg-slate-950 px-4 py-4 sticky top-[60px] z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button onClick={() => setActiveTab('24H')} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-lg ${activeTab === '24H' ? 'bg-emerald-400 text-white ring-2 ring-emerald-400/50' : 'bg-slate-800 text-slate-500'}`}>
             24 HORAS
          </button>
          <button onClick={() => setActiveTab('MONTHLY')} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-lg ${activeTab === 'MONTHLY' ? 'bg-gray-500 text-white ring-2 ring-gray-500/50' : 'bg-slate-800 text-slate-500'}`}>
             MENSUAL
          </button>
        </div>
        <div className="max-w-3xl mx-auto mt-4 relative">
          <input type="text" placeholder="BUSCAR CÓDIGO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold tracking-widest" />
          <Search className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
        </div>
      </div>

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-4 space-y-3">
        {filteredCodes.map((item) => (
          <div key={item.code} onClick={() => setSelectedCode(item)} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors">
            <div>
                <h3 className="font-black text-2xl text-white tracking-widest font-mono">{item.code}</h3>
                <div className="flex items-center gap-2 mt-1">
                    {getStatusPill(item.status)}
                </div>
            </div>
            
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                 <button onClick={() => onDeleteCode(item.code)} className="p-3 bg-slate-900 text-red-500 rounded-lg hover:bg-red-900/20 transition-colors border border-slate-700"><Trash2 className="w-5 h-5" /></button>
                {activeTab === 'MONTHLY' && (
                     <button onClick={() => toggleStatus(item)} className={`px-4 py-2 rounded-lg font-bold text-xs ${item.status === 'ACTIVE' ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900'}`}>
                        {item.status === 'ACTIVE' ? 'DESACTIVAR' : 'ACTIVAR'}
                     </button>
                )}
            </div>
          </div>
        ))}
      </main>

      {selectedCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="font-black text-xl text-white flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500"/> DETALLES DE ACCESO</h2>
                    <button onClick={() => setSelectedCode(null)}><X className="w-6 h-6 text-slate-400 hover:text-white"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <div className="text-4xl font-mono font-black text-white tracking-[0.2em] mb-2">{selectedCode.code}</div>
                        <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-400 border border-slate-700">
                             {selectedCode.type === '24H' ? 'ACCESO TEMPORAL (24H)' : 'ACCESO MENSUAL (31 DÍAS)'}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-blue-400 mt-3"/>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-500 uppercase">USUARIO</p>
                                <input 
                                    type="text" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Nombre del usuario"
                                    className="w-full mt-1 bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Smartphone className="w-5 h-5 text-purple-400 mt-3"/>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-500 uppercase">TELÉFONO</p>
                                <input 
                                    type="text" 
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="+58 ..."
                                    className="w-full mt-1 bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveUser} className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">
                            <Save className="w-4 h-4" /> GUARDAR DATOS
                        </button>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-slate-800">
                         <div className="flex items-center gap-2 mb-2">
                            <Monitor className="w-4 h-4 text-red-500"/>
                            <p className="text-xs font-black text-red-500 uppercase">DISPOSITIVO VINCULADO (IMEI)</p>
                         </div>
                         <p className="font-mono text-xs text-slate-300 break-all">{selectedCode.deviceId || 'No vinculado aún'}</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <button onClick={() => setSelectedCode(null)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">CERRAR</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};