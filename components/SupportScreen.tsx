import React, { useState, useRef, useEffect } from 'react';
import { Send, XCircle, Bot, User, LifeBuoy, Mail, Book, Pill, ArrowLeft } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Message as AppMessage, Role as MessageRole, ModelType } from "../types"; // Renamed Message to AppMessage for clarity

interface SupportScreenProps {
  onBack: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

type ResourceMode = 'NONE' | 'PHARMA' | 'VOCAB';

export const SupportScreen: React.FC<SupportScreenProps> = ({ onBack }) => {
  const [resourceMode, setResourceMode] = useState<ResourceMode>('NONE');
  const [inputMessage, setInputMessage] = useState('');
  
  const [messages, setMessages] = useState<AppMessage[]>([
    { id: "support-bot-1", text: "Hola, soy el Soporte Técnico de SUMA. ¿En qué puedo ayudarte sobre el uso de la aplicación?", role: MessageRole.MODEL, timestamp: Date.now() }
  ]);
  
  const [pharmaMessages, setPharmaMessages] = useState<AppMessage[]>([
    { id: "pharma-bot-1", text: "Bienvenido a la Guía Farmacológica. Escriba el nombre del medicamento para consultar indicaciones, dosis y precauciones.", role: MessageRole.MODEL, timestamp: Date.now() }
  ]);

  const [vocabMessages, setVocabMessages] = useState<AppMessage[]>([
    { id: "vocab-bot-1", text: "Bienvenido al Vocabulario Médico. Pregunte por cualquier término y le daré su significado técnico.", role: MessageRole.MODEL, timestamp: Date.now() }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let systemInstruction = '';
        let model = ModelType.FLASH; // Default model

        if (resourceMode === 'NONE') {
            systemInstruction = `Eres el Agente de Soporte Técnico de la aplicación "SUMA". Tu objetivo es ayudar con dudas de la app. NO consejos médicos.`;
        } else if (resourceMode === 'PHARMA') {
            systemInstruction = `Eres una Guía Farmacológica experta. TU ROL: Proveer información detallada sobre medicamentos. FORMATO: Indicaciones, Mecanismo de acción, Dosis (general), Precauciones, Efectos Adversos, Interacciones, Nombres Comerciales. RESPONDE SIEMPRE con rigor médico. Si te preguntan algo que no es un medicamento, indícalo.`;
            model = ModelType.PRO; // Use PRO for complex medical queries
        } else if (resourceMode === 'VOCAB') {
            systemInstruction = `Eres un Diccionario Médico experto. TU ROL: Definir términos médicos con precisión. Si el usuario pregunta "¿Cómo se dice...?" responde con el término técnico (Ej: Piedras riñones -> Nefrolitiasis). Si pregunta "¿Qué es...?" da la definición.`;
        }

        const chat = ai.chats.create({
          model: model,
          config: { systemInstruction, temperature: 0.3 },
        });
        chatSessionRef.current = chat;
      } catch (error) {
        console.error("Error iniciando Gemini:", error);
      }
    };
    initChat();
  }, [resourceMode]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading) return;
    
    const newUserMessage: AppMessage = { id: Date.now().toString(), text: inputMessage, role: MessageRole.USER, timestamp: Date.now() };
    
    if (resourceMode === 'NONE') setMessages(p => [...p, newUserMessage]);
    else if (resourceMode === 'PHARMA') setPharmaMessages(p => [...p, newUserMessage]);
    else if (resourceMode === 'VOCAB') setVocabMessages(p => [...p, newUserMessage]);

    setInputMessage('');
    setIsLoading(true);

    try {
      if (chatSessionRef.current) {
        const result = await chatSessionRef.current.sendMessage({ message: newUserMessage.text });
        const botMsg: AppMessage = { id: Date.now().toString() + 1, text: result.text || "...", role: MessageRole.MODEL, timestamp: Date.now() };
        
        if (resourceMode === 'NONE') setMessages(p => [...p, botMsg]);
        else if (resourceMode === 'PHARMA') setPharmaMessages(p => [...p, botMsg]);
        else if (resourceMode === 'VOCAB') setVocabMessages(p => [...p, botMsg]);
      }
    } catch (error) {
       console.error(error);
       const errorMsg: AppMessage = { id: Date.now().toString() + 1, text: "Error de conexión.", role: MessageRole.MODEL, timestamp: Date.now(), isError: true };
       if (resourceMode === 'NONE') setMessages(p => [...p, errorMsg]);
       else if (resourceMode === 'PHARMA') setPharmaMessages(p => [...p, errorMsg]);
       else if (resourceMode === 'VOCAB') setVocabMessages(p => [...p, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = () => {
      const subject = encodeURIComponent("Sugerencia para App SUMA");
      const body = encodeURIComponent(`Hola Ramón,\n\nTengo la siguiente sugerencia para la App:\n\n\nDatos técnicos:\nCódigo Usuario: [Auto-Generado]\nVersión: v2.5`);
      window.open(`mailto:contacto@ramondelgado.online?subject=${subject}&body=${body}`);
  };

  const activeMessages = resourceMode === 'NONE' ? messages : (resourceMode === 'PHARMA' ? pharmaMessages : vocabMessages);
  
  const bgColor = resourceMode === 'PHARMA' ? 'bg-orange-50' : (resourceMode === 'VOCAB' ? 'bg-purple-50' : 'bg-blue-50');
  const headerColor = resourceMode === 'PHARMA' ? 'bg-orange-800' : (resourceMode === 'VOCAB' ? 'bg-purple-600' : 'bg-blue-900');
  const userMsgColor = resourceMode === 'PHARMA' ? 'bg-orange-700' : (resourceMode === 'VOCAB' ? 'bg-purple-500' : 'bg-blue-800');
  const sendBtnColor = resourceMode === 'PHARMA' ? 'bg-orange-700' : (resourceMode === 'VOCAB' ? 'bg-purple-500' : 'bg-blue-600');

  return (
    <div className={`min-h-screen ${bgColor} flex flex-col font-sans transition-colors duration-300`}>
      <header className={`${headerColor} text-white shadow-md sticky top-0 z-20 transition-colors duration-300`}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
              {resourceMode === 'NONE' && <LifeBuoy className="w-6 h-6 opacity-80" />}
              {resourceMode === 'PHARMA' && <Pill className="w-6 h-6 opacity-80" />}
              {resourceMode === 'VOCAB' && <Book className="w-6 h-6 opacity-80" />}
              <span className="font-bold text-lg tracking-wide">
                  {resourceMode === 'NONE' ? 'SOPORTE TÉCNICO' : (resourceMode === 'PHARMA' ? 'GUÍA FARMACOLÓGICA' : 'VOCABULARIO MÉDICO')}
              </span>
          </div>
          <button onClick={() => resourceMode === 'NONE' ? onBack() : setResourceMode('NONE')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors border border-white/20">
              {resourceMode === 'NONE' ? <><XCircle className="w-4 h-4" /><span>Cerrar</span></> : <><ArrowLeft className="w-4 h-4" /><span>Volver</span></>}
          </button>
        </div>
      </header>
      
      <main className="flex-grow w-full max-w-3xl mx-auto p-4 flex flex-col space-y-4 overflow-y-auto pb-64">
        {activeMessages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] gap-2 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${msg.role === MessageRole.USER ? `${userMsgColor} text-white/90` : 'bg-white text-slate-600'}`}>
                {msg.role === MessageRole.USER ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === MessageRole.USER ? `${userMsgColor} text-white rounded-tr-none` : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>{msg.text}</div>
            </div>
          </div>
        ))}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex flex-col">
         {resourceMode === 'NONE' && (
             <div className="w-full bg-slate-50 border-b border-slate-200 p-2 flex flex-col gap-2">
                 <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
                    <button className="w-full bg-green-800 text-white font-bold py-2 rounded-lg text-sm uppercase tracking-wide cursor-default">RECURSOS PROFESIONALES</button>
                    <div className="flex gap-2">
                        <button onClick={() => setResourceMode('PHARMA')} className="flex-1 bg-orange-800 hover:bg-orange-900 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Pill className="w-4 h-4"/> GUÍA FARMACOLÓGICA
                        </button>
                        <button onClick={() => setResourceMode('VOCAB')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Book className="w-4 h-4"/> VOCABULARIO MÉDICO
                        </button>
                    </div>
                    <div className="flex justify-center pt-1">
                        <button onClick={handleSuggestion} className="flex items-center gap-2 bg-sky-100 text-sky-800 px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-sky-200 transition-colors">
                            <Mail className="w-4 h-4" /> SUGERENCIAS
                        </button>
                    </div>
                 </div>
             </div>
         )}

         <div className="p-4 max-w-3xl mx-auto w-full flex gap-2 bg-white">
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe aquí..." className="flex-grow px-4 py-3 bg-slate-100 border-0 rounded-xl text-slate-900 focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all placeholder-slate-400 font-medium" />
            <button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading} className={`p-3 rounded-xl ${sendBtnColor} text-white hover:opacity-90 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md`}><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};