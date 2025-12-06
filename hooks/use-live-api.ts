import { useState, useCallback, useEffect, useRef } from "react";
import { useAudioRecorder } from "../utils/audio-recorder";
import { AudioStreamer } from "../utils/audio-streamer";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

export type LiveConfig = {
  model: string;
  systemInstruction?: string;
};

export function useLiveAPI({ model, systemInstruction }: LiveConfig) {
  const [connected, setConnected] = useState(false);
  const [isVolume, setIsVolume] = useState(false);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const sessionRef = useRef<any>(null);
  // FIX: Added ref for the session promise to prevent stale closures.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // FIX: Added ref for the onMessage callback to be set from the component.
  const onMessageCallbackRef = useRef<((text: string, sender: 'user' | 'bot', endOfTurn: boolean) => void) | null>(null);

  // FIX: Expose setOnMessage to allow component to register a callback.
  const setOnMessage = useCallback((callback: (text: string, sender: 'user' | 'bot', endOfTurn: boolean) => void) => {
    onMessageCallbackRef.current = callback;
  }, []);


  useEffect(() => {
    audioStreamerRef.current = new AudioStreamer({
      sampleRate: 24000,
      onComplete: () => setIsVolume(false)
    });
    return () => { audioStreamerRef.current?.stop(); };
  }, []);

  const { start: startRecording, stop: stopRecording } = useAudioRecorder({
    onAudioData: (base64) => {
      // FIX: Use session promise to send data, preventing race conditions and stale closures.
      if(sessionPromiseRef.current){
        sessionPromiseRef.current.then(session => {
          if (session) {
            session.sendRealtimeInput({
              media: {
                // FIX: Correct MIME type for PCM audio as per documentation.
                mimeType: "audio/pcm;rate=16000",
                data: base64
              }
            });
          }
        });
      }
    }
  });

  const connectWithCallbacks = useCallback(async () => {
    if (sessionRef.current) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const config: any = {
      responseModalities: [Modality.AUDIO],
      // FIX: Use a valid voice name from the documentation.
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      systemInstruction: systemInstruction,
      // FIX: Enable transcription to get text from audio.
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
    
    const sessionPromise = ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      callbacks: {
        onopen: () => {
          setConnected(true);
          startRecording();
        },
        onmessage: (message: LiveServerMessage) => {
          const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64) {
            setIsVolume(true);
            audioStreamerRef.current?.addPCM16(audioBase64);
          }

          // FIX: Handle transcription messages and call the registered callback.
          if (onMessageCallbackRef.current) {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              onMessageCallbackRef.current(text, 'user', false);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              onMessageCallbackRef.current(text, 'bot', false);
            }
            if (message.serverContent?.turnComplete) {
              // Signal that the current stream of messages for a turn is complete.
              onMessageCallbackRef.current("", 'user', true);
            }
          }
        },
        onclose: () => {
          setConnected(false);
          stopRecording();
          sessionRef.current = null;
          sessionPromiseRef.current = null; // Reset promise ref
        },
        onerror: (e) => {
          console.error("Live API Error:", e);
        }
      },
      config
    });

    sessionPromiseRef.current = sessionPromise;

    sessionPromise.then(session => {
        sessionRef.current = session;
    });

  }, [systemInstruction, startRecording, stopRecording]);


  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
          sessionRef.current.close();
      } catch(e) {}
      sessionRef.current = null;
      sessionPromiseRef.current = null;
    }
    stopRecording();
    setConnected(false);
    audioStreamerRef.current?.stop();
  }, [stopRecording]);

  // FIX: Return setOnMessage so the component can use it.
  return { connect: connectWithCallbacks, disconnect, connected, isVolume, setOnMessage };
}