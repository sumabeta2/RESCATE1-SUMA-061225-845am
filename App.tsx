import React, { useState, useEffect, useCallback } from 'react';
import { ActivationScreen } from './components/ActivationScreen';
import { PatientFormScreen } from './components/PatientFormScreen';
import { AssistanceScreen } from './components/AssistanceScreen';
import { SupportScreen } from './components/SupportScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { AdminScreen } from './components/AdminScreen';
import { PatientData, RoleType, AccessCode } from './types';
import { generateInitialCodes } from './utils/code-generator';

const ADMIN_CODE = '561393';
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'ACTIVATION' | 'PATIENT_FORM' | 'ASSISTANCE' | 'SUPPORT' | 'HISTORY' | 'ADMIN'>('ACTIVATION');
  const [isAdmin, setIsAdmin] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [userRole, setUserRole] = useState<RoleType>('PRIMER_RESPONDIENTE');
  
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>(() => {
    const saved = localStorage.getItem('suma_codes_v2_5');
    return saved ? JSON.parse(saved) : generateInitialCodes();
  });

  const [activeSessionCode, setActiveSessionCode] = useState<AccessCode | null>(null);

  useEffect(() => {
    localStorage.setItem('suma_codes_v2_5', JSON.stringify(accessCodes));
  }, [accessCodes]);

  useEffect(() => {
    let timeout: number;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (currentScreen !== 'ACTIVATION') {
        timeout = window.setTimeout(() => {
           handleLogout();
           alert("Sesión cerrada por inactividad (5 min).");
        }, IDLE_TIMEOUT);
      }
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    
    resetTimer();
    
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timeout);
    };
  }, [currentScreen]);

  const handleUpdateCode = (updatedCode: AccessCode) => {
    setAccessCodes(prev => prev.map(c => c.code === updatedCode.code ? updatedCode : c));
    if (activeSessionCode?.code === updatedCode.code) {
        setActiveSessionCode(updatedCode);
    }
  };

  const handleDeleteCode = (codeToDelete: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar el código ${codeToDelete}? Esta acción es irreversible.`)) {
      setAccessCodes(prev => prev.filter(c => c.code !== codeToDelete));
    }
  };

  const handleActivation = (codeOrAccess: string | AccessCode) => {
    if (typeof codeOrAccess === 'string') {
        if (codeOrAccess === ADMIN_CODE) {
            setIsAdmin(true);
            setCurrentScreen('PATIENT_FORM');
        }
    } else {
        setIsAdmin(false);
        setActiveSessionCode(codeOrAccess);
        setCurrentScreen('PATIENT_FORM');
    }
  };

  const handleStartAssistance = (data: PatientData, role: RoleType) => {
    setPatientData(data); setUserRole(role);
    setCurrentScreen('ASSISTANCE');
  };

  const handleLogout = () => {
    setPatientData(null); 
    setIsAdmin(false);
    setActiveSessionCode(null);
    setCurrentScreen('ACTIVATION');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {currentScreen === 'ACTIVATION' && (
        <ActivationScreen 
            onActivate={handleActivation} 
            codes={accessCodes}
            onCodeUpdate={handleUpdateCode}
        />
      )}
      
      {currentScreen === 'PATIENT_FORM' && (
        <PatientFormScreen 
            isAdmin={isAdmin} 
            activeCode={activeSessionCode}
            onStartAssistance={handleStartAssistance} 
            onLogout={handleLogout} 
            onOpenSupport={() => setCurrentScreen('SUPPORT')} 
            onOpenHistory={() => setCurrentScreen('HISTORY')} 
            onOpenAdmin={() => setCurrentScreen('ADMIN')} 
        />
      )}
      
      {currentScreen === 'ASSISTANCE' && patientData && (
        <AssistanceScreen 
            patientData={patientData} 
            userRole={userRole} 
            onEndSession={() => setCurrentScreen('PATIENT_FORM')} 
        />
      )}
      
      {currentScreen === 'SUPPORT' && (
        <SupportScreen onBack={() => setCurrentScreen('PATIENT_FORM')} />
      )}
      
      {currentScreen === 'HISTORY' && (
        <HistoryScreen 
            onBack={() => setCurrentScreen('PATIENT_FORM')} 
            onSelectCase={(data, role) => handleStartAssistance(data, role)} 
        />
      )}
      
      {currentScreen === 'ADMIN' && (
        <AdminScreen 
            onBack={() => setCurrentScreen('PATIENT_FORM')} 
            codes={accessCodes}
            onUpdateCode={handleUpdateCode}
            onDeleteCode={handleDeleteCode}
        />
      )}
    </div>
  );
};

export default App;