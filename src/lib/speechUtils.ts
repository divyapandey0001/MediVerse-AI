// Native Conversational Voice Engine powered by Gemini Audio
// Delivers young, warm, crystal-clear, and natural Indian conversational voice synthesis
// Completely replaces robotic browser TTS for Hindi and Hinglish with Gemini native audio

export interface SpeechRecognitionResultItem {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export type SupportedLanguage = 'Hindi' | 'English' | 'Hinglish';

export interface DetectedLanguageInfo {
  langCode: 'hi-IN' | 'en-IN' | 'en-US';
  bcp47: string;
  name: SupportedLanguage;
  isHinglish: boolean;
  script: 'Devanagari' | 'Latin';
}

export interface SpeechSessionController {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: () => boolean;
  isPaused: () => boolean;
  detectedLang: DetectedLanguageInfo;
}

// Global active playback state
let currentActiveAudio: HTMLAudioElement | null = null;
let currentSessionId: number = 0;
let isAudioPaused: boolean = false;
let globalSpeakingStatus: boolean = false;

// In-memory audio cache for zero-latency instant replays
const audioCache = new Map<string, string>();

/**
 * Check if Speech Recognition is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Check if Audio playback is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof Audio !== 'undefined';
}

/**
 * Legacy voice helper for backwards compatibility
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return [];
}

/**
 * Accurately detects whether a given text is in Hindi (Devanagari), Hinglish (Romanized Hindi+English), or English
 */
export function detectTextLanguage(text: string): DetectedLanguageInfo {
  if (!text || typeof text !== 'string') {
    return {
      langCode: 'en-IN',
      bcp47: 'en-IN',
      name: 'English',
      isHinglish: false,
      script: 'Latin'
    };
  }

  // 1. Check for Devanagari script characters (Unicode \u0900 to \u097F)
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  const totalChars = text.replace(/[\s\d\p{P}]/gu, '').length;

  if (devanagariMatches && devanagariMatches.length > 0) {
    const devanagariRatio = devanagariMatches.length / Math.max(1, totalChars);
    if (devanagariRatio > 0.15 || devanagariMatches.length >= 4) {
      return {
        langCode: 'hi-IN',
        bcp47: 'hi-IN',
        name: 'Hindi',
        isHinglish: false,
        script: 'Devanagari'
      };
    }
  }

  // 2. Check for Romanized Hindi / Hinglish keywords
  const hinglishMarkerPatterns = [
    /\b(aap|aapko|aapka|aapki|aapke|apna|apni|apne)\b/i,
    /\b(mera|meri|mere|mujhe|mujhko|humein|humara|humari|tum|tumhe|tumhara)\b/i,
    /\b(yeh|ye|woh|wo|iska|iski|iske|isko|usko|unko|iska|unki|unke)\b/i,
    /\b(kya|kyun|kaise|kahan|kab|kitna|kitni|kaun|kisko|kisi)\b/i,
    /\b(hai|hain|ho|hun|hoon|tha|thi|the|hoga|hogi|honge)\b/i,
    /\b(karein|kare|karna|karta|karti|karte|kijiye|karo|raha|rahi|rahe)\b/i,
    /\b(dawai|dawaii|dawa|medicine|tablet|capsule|peena|paani|pani|khana|khayein)\b/i,
    /\b(bukhar|fever|dard|pain|khansi|cough|sardi|cold|sar|headache|pet|stomach)\b/i,
    /\b(doctor|dr|hospital|clinic|ilaaj|treatment|report|checkup|test|lab)\b/i,
    /\b(chahiye|sakta|sakti|sakte|dena|dijiye|lena|lijiye|rakhein|rakho)\b/i,
    /\b(bahut|zyada|jyada|kam|accha|acchi|theek|thik|bhi|aur|lekin|magar|agar|par)\b/i,
    /\b(subah|morning|shaam|evening|raat|night|dopahar|afternoon|daily|din|roz)\b/i,
    /\b(namaste|dhanyawad|shukriya|swagat|alvida|sunie|bataiye|samajh)\b/i
  ];

  let hinglishMatchesCount = 0;
  for (const pattern of hinglishMarkerPatterns) {
    if (pattern.test(text)) {
      hinglishMatchesCount++;
    }
  }

  if (hinglishMatchesCount >= 2 || (hinglishMatchesCount >= 1 && /\b(hai|hain|aap|karein|kare|dawai|kijiye)\b/i.test(text))) {
    return {
      langCode: 'hi-IN',
      bcp47: 'hi-IN',
      name: 'Hinglish',
      isHinglish: true,
      script: 'Latin'
    };
  }

  // 3. Default to English
  return {
    langCode: 'en-IN',
    bcp47: 'en-IN',
    name: 'English',
    isHinglish: false,
    script: 'Latin'
  };
}

// Clean markdown and formatting noise before spoken voice generation
function cleanTextForAudio(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/\*(.*?)\*/g, '$1') // remove italic
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^#+\s+/gm, '') // remove markdown headings
    .replace(/^[-*•]\s+/gm, '') // remove bullet points
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // convert markdown links
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/[\r\n]+/g, ' ') // normalize whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Fetch Gemini Native Audio WAV from secure backend
 */
async function fetchGeminiSpeechAudio(text: string, language: SupportedLanguage): Promise<string> {
  const cacheKey = `${language}:${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const res = await fetch('/api/ai/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language,
      voiceName: 'Aoede' // Young, warm, conversational Indian voice
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to synthesize native voice audio.');
  }

  const data = await res.json();
  if (!data.audioBase64) {
    throw new Error('No audio returned from voice synthesis.');
  }

  const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
  
  // Cache response (keep cache size reasonable)
  if (audioCache.size > 50) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(cacheKey, audioSrc);

  return audioSrc;
}

/**
 * Master Speech Synthesis Engine:
 * - Powered by Gemini Native Audio for natural, young, warm Indian conversational voice
 * - Completely avoids browser SpeechSynthesis for Hindi/Hinglish (no robotic/elderly voices)
 * - Directly generates natural spoken Hindi and authentic mixed Hinglish
 * - English is synthesized with the same young, warm, clear voice
 * - Full Play/Pause/Resume/Stop coordination
 */
export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    langOverride?: string;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onChunkStart?: (chunkIndex: number, totalChunks: number) => void;
  }
): SpeechSessionController | null {
  if (!isSpeechSynthesisSupported()) return null;

  try {
    // 1. Stop any currently playing audio
    stopSpeaking();

    const sessionId = ++currentSessionId;
    const detectedLang = detectTextLanguage(text);
    const cleanedText = cleanTextForAudio(text);

    if (!cleanedText) {
      options?.onEnd?.();
      return null;
    }

    let isSessionStopped = false;
    let audioElement: HTMLAudioElement | null = null;

    const controller: SpeechSessionController = {
      stop: () => {
        if (currentSessionId === sessionId) {
          isSessionStopped = true;
          stopSpeaking();
        }
      },
      pause: () => {
        if (currentSessionId === sessionId && audioElement && !audioElement.paused) {
          isAudioPaused = true;
          audioElement.pause();
        }
      },
      resume: () => {
        if (currentSessionId === sessionId && audioElement && audioElement.paused) {
          isAudioPaused = false;
          audioElement.play().catch(e => console.warn('Audio resume error:', e));
        }
      },
      isSpeaking: () => currentSessionId === sessionId && globalSpeakingStatus && !isAudioPaused,
      isPaused: () => currentSessionId === sessionId && isAudioPaused,
      detectedLang
    };

    // Asynchronously fetch and play Gemini native conversational audio
    (async () => {
      try {
        globalSpeakingStatus = true;
        isAudioPaused = false;

        const audioSrc = await fetchGeminiSpeechAudio(cleanedText, detectedLang.name);

        if (isSessionStopped || currentSessionId !== sessionId) {
          return;
        }

        audioElement = new Audio(audioSrc);
        currentActiveAudio = audioElement;

        if (options?.rate && options.rate > 0) {
          audioElement.playbackRate = Math.min(Math.max(options.rate, 0.75), 1.5);
        }

        audioElement.onended = () => {
          if (currentSessionId === sessionId) {
            globalSpeakingStatus = false;
            isAudioPaused = false;
            currentActiveAudio = null;
            options?.onEnd?.();
          }
        };

        audioElement.onerror = (e) => {
          if (currentSessionId === sessionId) {
            globalSpeakingStatus = false;
            isAudioPaused = false;
            currentActiveAudio = null;
            console.warn('Audio playback error:', e);
            options?.onError?.(e);
          }
        };

        await audioElement.play();
        options?.onChunkStart?.(0, 1);
      } catch (err: any) {
        if (currentSessionId === sessionId && !isSessionStopped) {
          globalSpeakingStatus = false;
          isAudioPaused = false;
          currentActiveAudio = null;
          console.warn('Gemini Native Audio synthesis error:', err);

          // For English ONLY: fall back to browser speech if network fails
          if (detectedLang.name === 'English' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
              const utter = new SpeechSynthesisUtterance(cleanedText);
              utter.lang = 'en-IN';
              utter.onend = () => options?.onEnd?.();
              utter.onerror = (e) => options?.onError?.(e);
              window.speechSynthesis.speak(utter);
              return;
            } catch (synthErr) {
              options?.onError?.(synthErr);
              return;
            }
          }

          options?.onError?.(err);
        }
      }
    })();

    return controller;
  } catch (err) {
    console.warn('Voice synthesis invocation failed:', err);
    options?.onError?.(err);
    return null;
  }
}

/**
 * Stop any active audio speech playback immediately
 */
export function stopSpeaking() {
  globalSpeakingStatus = false;
  isAudioPaused = false;

  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
      currentActiveAudio = null;
    } catch (e) {
      // ignore
    }
  }

  // Also cancel any browser speech synthesis if active
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Pause active speech
 */
export function pauseSpeaking() {
  if (currentActiveAudio && !currentActiveAudio.paused) {
    isAudioPaused = true;
    try {
      currentActiveAudio.pause();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Resume paused speech
 */
export function resumeSpeaking() {
  if (currentActiveAudio && isAudioPaused) {
    isAudioPaused = false;
    try {
      currentActiveAudio.play().catch(e => console.warn('Resume error:', e));
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Check if speech is currently playing
 */
export function isSpeaking(): boolean {
  return globalSpeakingStatus && !isAudioPaused;
}

/**
 * Speech recognition helper for voice input with multilingual support (Hindi, Hinglish, English)
 */
export function createSpeechRecognizer(params: {
  onResult: (result: SpeechRecognitionResultItem) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}) {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  try {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = params.continuous ?? true;
    recognition.interimResults = params.interimResults ?? true;
    // Set recognition language: default to hi-IN / en-IN
    recognition.lang = params.language || 'hi-IN';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (text) {
        params.onResult({
          transcript: text.trim(),
          isFinal: !!finalTranscript,
          confidence: event.results[0]?.[0]?.confidence || 0.95
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition event error:', event.error);
        params.onError(event.error);
      }
    };

    recognition.onend = () => {
      params.onEnd();
    };

    return recognition;
  } catch (err) {
    console.warn('Could not initialize SpeechRecognition:', err);
    return null;
  }
}
