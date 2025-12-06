export function useAudioRecorder({ onAudioData }: { onAudioData: (base64: string) => void }) {
  const streamRef = { current: null as MediaStream | null };
  const processorRef = { current: null as ScriptProcessorNode | null };
  const contextRef = { current: null as AudioContext | null };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        } 
      });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass({ sampleRate: 16000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcmData.buffer);
        onAudioData(base64);
      };

      source.connect(processor);
      processor.connect(context.destination);

      streamRef.current = stream;
      processorRef.current = processor;
      contextRef.current = context;
    } catch (err) {
      console.error("Error accediendo al micrófono:", err);
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    contextRef.current?.close();
    streamRef.current = null;
    processorRef.current = null;
    contextRef.current = null;
  };

  return { start, stop };
}

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}