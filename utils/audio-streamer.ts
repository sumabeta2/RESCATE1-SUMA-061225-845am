// utils/audio-streamer.ts
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class AudioStreamer {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private onCompleteCallback: () => void;
  private sampleRate: number;

  constructor({ sampleRate, onComplete }: { sampleRate: number; onComplete: () => void }) {
    // Ensure AudioContext is only created once.
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    this.outputNode = this.audioContext.createGain();
    this.outputNode.connect(this.audioContext.destination);
    this.onCompleteCallback = onComplete;
    this.sampleRate = sampleRate;
  }

  async addPCM16(base64Audio: string) {
    if (!base64Audio) return;

    try {
      this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        this.audioContext,
        this.sampleRate,
        1, // Assuming mono audio (1 channel) for PCM
      );

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);

      source.addEventListener('ended', () => {
        this.sources.delete(source);
        if (this.sources.size === 0 && this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      });

      source.start(this.nextStartTime);
      this.nextStartTime = this.nextStartTime + audioBuffer.duration;
      this.sources.add(source);
    } catch (error) {
      console.error("Error decoding or playing audio chunk:", error);
    }
  }

  stop() {
    for (const source of this.sources.values()) {
      try {
        source.stop();
      } catch (e) {
        // Source might have already stopped or errored
      }
      this.sources.delete(source);
    }
    this.nextStartTime = 0;
    // Do not close audioContext as it might be reused.
  }

  // Helper to ensure AudioContext is resumed if needed (e.g., after user gesture)
  resumeContext() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}