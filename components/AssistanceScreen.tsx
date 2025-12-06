import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, MapPin, FileDown, Share2, Loader2, Bot, ArrowLeft, CheckCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PatientData, RoleType, Message as AppMessage, Role as MessageRole, ModelType } from '../types'; // Renamed Message to AppMessage for clarity
import { jsPDF } from "jspdf";
import { useLiveAPI } from '../hooks/use-live-api';
import { streamChatResponse } from '../services/geminiService'; // Import the service

interface AssistanceScreenProps {
  onEndSession: () => void;
  patientData: PatientData;
  userRole: RoleType;
}

export const AssistanceScreen: React.FC<AssistanceScreenProps> = ({ onEndSession, patientData, userRole }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<AppMessage[]>([
    {
      id: "initial-bot-message",
      text: `Hola. Soy la Dra. Suma. He recibido los datos del paciente: ${patientData.name}, ${patientData.age} años. Actuando como apoyo para: ${userRole}. Por favor, indícame los signos y síntomas.`,
      role: MessageRole.MODEL,
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'success'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const caseDateRef = useRef(new Date());
  const lastMessageIsFinal = useRef(true);

  const systemInstruction = `
    Eres la Dra. Suma, una IA experta en medicina de urgencias.
    TU ROL: Proveer soporte de decisiones clínicas en tiempo real por voz.
    USUARIO: ${userRole}. PACIENTE: ${patientData.name}, ${patientData.age} años.
    
    SI EL USUARIO ES "PRIMER_RESPONDIENTE":
    - Usa lenguaje MUY SIMPLE. Cero tecnicismos.
    - NUNCA recomiendes medicamentos.
    - Guía paso a paso en primeros auxilios.
    
    SI ES PERSONAL DE SALUD:
    - Usa lenguaje técnico y preciso (ABCDE, Glasgow).
    
    COMPORTAMIENTO DE VOZ:
    - Responde de manera concisa y clara, como en una radiofrecuencia.
    - Sé empática pero firme.
    - Prioriza la vida.
  `;

  const { connect, disconnect, connected, isVolume, setOnMessage } = useLiveAPI({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    systemInstruction: systemInstruction
  });

  useEffect(() => {
    setOnMessage((text, sender, endOfTurn) => {
      if (endOfTurn) {
        lastMessageIsFinal.current = true;
        return;
      }
  
      if (!text) return;
  
      setMessages((prev) => {
        const lastMsg = prev.length > 0 ? prev[prev.length - 1] : null;
        if (!lastMessageIsFinal.current && lastMsg && lastMsg.role === (sender === 'user' ? MessageRole.USER : MessageRole.MODEL)) {
          const updatedMsg = { ...lastMsg, text: lastMsg.text + text };
          return [...prev.slice(0, -1), updatedMsg];
        } else {
          lastMessageIsFinal.current = false;
          return [...prev, { id: Date.now().toString(), text, role: (sender === 'user' ? MessageRole.USER : MessageRole.MODEL), timestamp: Date.now() }];
        }
      });
    });
  }, [setOnMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isVolume]);

  const toggleMic = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading) return;
    const textToSend = inputMessage;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: textToSend, role: MessageRole.USER, timestamp: Date.now() }]);
    setInputMessage('');
    setIsLoading(true);

    try {
        let accumulatedResponse = '';
        await streamChatResponse(
            messages, // Pass current messages as history
            textToSend,
            [], // No attachments for now
            ModelType.FLASH,
            (chunkText) => {
                accumulatedResponse += chunkText;
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.role === MessageRole.MODEL && lastMsg.isStreaming) {
                        return prev.slice(0, -1).concat({ ...lastMsg, text: lastMsg.text + chunkText });
                    } else {
                        return prev.concat({ id: Date.now().toString(), text: chunkText, role: MessageRole.MODEL, timestamp: Date.now(), isStreaming: true });
                    }
                });
            },
            systemInstruction // Pass the specific system instruction
        );
        // After streaming, mark the last message as not streaming
        setMessages(prev => prev.map(msg => msg.isStreaming ? { ...msg, isStreaming: false } : msg));

    } catch(e) { 
        console.error(e); 
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Error de conexión.", role: MessageRole.MODEL, timestamp: Date.now(), isError: true }]);
    } 
    finally { setIsLoading(false); }
  };

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(`https://wa.me/?text=${encodeURIComponent("Ubicación: " + url)}`, '_blank');
      });
    } else {
        alert("Geolocalización no activada.");
    }
  };

  const generatePDF = (share: boolean) => {
    setPdfStatus('generating');
    setTimeout(() => {
        const doc = new jsPDF();
        let y = 20;
        doc.setFontSize(16); doc.text("REPORTE MÉDICO SUMA", 10, y); y+=10;
        doc.setFontSize(10); doc.text(`Fecha: ${new Date().toLocaleDateString()} Hora: ${new Date().toLocaleTimeString()}`, 10, y); y += 6;
        doc.text(`Paciente: ${patientData.name}`, 10, y); y += 6;
        doc.text(`Edad: ${patientData.age} | Sexo: ${patientData.sex}`, 10, y); y += 6;
        doc.text(`Atendido por Rol: ${userRole}`, 10, y); y += 10; doc.line(10, y, 200, y); y += 10;

        messages.forEach(m => {
            const prefix = m.role === MessageRole.MODEL ? 'Dra. Suma: ' : 'Usuario: ';
            const lines = doc.splitTextToSize(prefix + m.text, 180);
            if (y + lines.length * 5 > 280) { doc.addPage(); y=20; }
            if (m.role === MessageRole.MODEL) doc.setTextColor(200, 0, 0); else doc.setTextColor(0, 0, 0);
            doc.text(lines, 10, y);
            y += lines.length * 5 + 2;
        });

        const now = new Date();
        const safeName = patientData.name.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
        const fname = `Reporte_${safeName}_${now.toISOString().split('T')[0]}_${now.getHours()}-${now.getMinutes()}.pdf`;

        if (share && navigator.share) {
            const file = new File([doc.output('blob')], fname, {type: 'application/pdf'});
            navigator.share({files: [file]}).catch(console.error);
            setPdfStatus('idle');
        } else {
            doc.save(fname);
            setPdfStatus('success');
            setTimeout(() => setPdfStatus('idle'), 3000);
        }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={onEndSession} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="relative w-8 h-8 flex items-center justify-center animate-heartbeat-slow shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-red-600">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="absolute text-white text-xs font-bold pb-0.5">S</span>
              <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none overflow-hidden z-10 text-green-400">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <path d="M0 50 L200 50 L215 20 L225 80 L235 50 L245 50 L260 20 L275 80 L285 50 L500 50" fill="none" stroke="currentColor" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" className="animate-ecg-flow" style={{ strokeDasharray: '500', strokeDashoffset: '500' }} />
                </svg>
              </div>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-baseline">
                <h1 className="font-black text-slate-800 uppercase text-sm truncate pr-2">{patientData.name} ({patientData.age}A)</h1>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">{caseDateRef.current.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="flex gap-2 text-[10px] font-bold uppercase text-slate-500">
                <span>{caseDateRef.current.toLocaleDateString()}</span>
                <span>•</span>
                <span className="text-red-600">{userRole.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto p-4 flex flex-col space-y-4 overflow-y-auto pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] gap-2 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === MessageRole.MODEL ? (
                <div className="w-10 h-10 flex items-center justify-center shrink-0 relative">
                   <div className="absolute w-full h-full bg-white rounded-full border border-slate-100 shadow-sm"></div>
                   <Bot className="w-5 h-5 text-red-600 relative z-10" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-white border-2 border-red-500 flex items-center justify-center shrink-0 shadow-sm text-slate-900 font-black text-xs">
                  {userRole.substring(0,2)}
                </div>
              )}
              <div className={`p-4 rounded-2xl shadow-sm text-sm ${msg.role === MessageRole.USER ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-red-600 text-white rounded-tl-none font-medium'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isVolume && (
            <div className="flex justify-start w-full animate-pulse">
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Dra. Suma escuchando/hablando...
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button onClick={toggleMic} className={`p-4 rounded-full transition-all border-2 shadow-lg ${connected ? 'bg-red-600 border-red-600 text-white animate-pulse ring-4 ring-red-200' : 'bg-white border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500'}`}>
            {connected ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <div className="flex-grow relative">
            <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder={connected ? "Modo Manos Libres Activo..." : "Escribir mensaje..."} disabled={connected} className="w-full pl-4 pr-4 py-3 bg-slate-100 border-0 rounded-xl text-slate-800 focus:ring-2 focus:ring-red-500 transition-all" />
          </div>
          {!connected && <button onClick={() => handleSendMessage()} className="p-3 rounded-xl bg-slate-800 text-white shadow-lg"><Send className="w-6 h-6" /></button>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 z-40">
        <div className="max-w-3xl mx-auto flex justify-between gap-2">
          <button onClick={sendLocation} className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-green-400"><MapPin className="w-5 h-5 mb-1" /> <span className="text-[10px] font-bold uppercase">Ubicación</span></button>
          <button onClick={() => generatePDF(false)} className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-red-400"><FileDown className="w-5 h-5 mb-1" /> <span className="text-[10px] font-bold uppercase">PDF</span></button>
          <button onClick={() => generatePDF(true)} className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-blue-400"><Share2 className="w-5 h-5 mb-1" /> <span className="text-[10px] font-bold uppercase">Compartir</span></button>
        </div>
      </div>
    </div>
  );