
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from "./apiKey";

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentPlayId = 0;
const audioCache = new Map<string, AudioBuffer>();

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  return audioContext;
};

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

export const stopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    currentSource = null;
  }
};

export const playLogAudio = async (text: string): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API Key is missing. TTS disabled.");
    return;
  }

  // Increment ID to track this specific request
  const myId = ++currentPlayId;
  
  // Stop any currently playing audio immediately
  stopAudio();

  const ctx = getAudioContext();
  
  // Handle suspended state (Autoplay policy)
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (e) {
      console.warn("Could not resume AudioContext (user interaction needed):", e);
      return;
    }
  }

  try {
    let audioBuffer = audioCache.get(text);

    if (!audioBuffer) {
      // Fetch if not in cache
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      // If another request started while we were fetching, abort
      if (myId !== currentPlayId) return;

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        console.warn("No audio data received from API for TTS.");
        return;
      }

      const audioBytes = decode(base64Audio);
      audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

      // Cache management (Simple FIFO/LRU-ish)
      if (audioCache.size > 50) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) audioCache.delete(firstKey);
      }
      audioCache.set(text, audioBuffer);
    }

    // If another request started while we were decoding, abort
    if (myId !== currentPlayId) return;

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
    currentSource = source;

    return new Promise((resolve) => {
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null;
        }
        resolve();
      };
    });
  } catch (error) {
    if (myId === currentPlayId) {
        console.error("TTS playback failed:", error);
    }
    // Don't throw, just log, to prevent game crash on audio failure
  }
};
