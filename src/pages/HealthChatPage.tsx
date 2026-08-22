import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  Trash2,
  HelpCircle,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  CornerDownLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { SEOHead } from '../components/SEOHead.js';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
  detectTextLanguage
} from '../lib/speechUtils.js';

interface HealthChatPageProps {
  onNavigate: (page: string) => void;
}

export const HealthChatPage: React.FC<HealthChatPageProps> = ({ onNavigate }) => {
  const { user, activeReport } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg_welcome',
        role: 'model',
        text: `Hello! I am **MediVerse AI**, your educational health assistant.\n\nI can help you understand medical terminology, explain common lab parameters, explore dietary ideas, and prepare questions for your doctor.\n\n*Please remember: I provide educational health information only and do not replace professional clinical diagnosis or doctor consultations.*`,
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useReportContext, setUseReportContext] = useState<boolean>(!!activeReport);

  // Voice AI states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);

  const recognizerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'What does high cholesterol mean?',
    'What foods are good for iron deficiency?',
    'What is HbA1c and how is it used?',
    'What does low vitamin D mean for the body?',
    'What should I ask my doctor about my report?'
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {}
      }
      stopSpeaking();
    };
  }, []);

  // Toggle Voice Input (Speech to Text)
  const handleToggleVoiceInput = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    try {
      const recognizer = createSpeechRecognizer({
        continuous: false,
        interimResults: true,
        onResult: (result) => {
          setInputMessage(result.transcript);
          if (result.isFinal) {
            setIsListening(false);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          if (err === 'not-allowed') {
            setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
          }
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch (err) {
      console.warn('Voice input trigger error:', err);
      setIsListening(false);
    }
  };

  // Text to Speech playback for AI responses
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (activeSpeakingId === msgId) {
      stopSpeaking();
      setActiveSpeakingId(null);
      return;
    }

    stopSpeaking();
    setActiveSpeakingId(msgId);

    speakText(text, {
      onEnd: () => setActiveSpeakingId(null),
      onError: () => setActiveSpeakingId(null)
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (isListening && recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'msg_welcome')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          reportContext: useReportContext && activeReport ? activeReport : undefined,
          userProfile: user
            ? {
                age: user.age,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                allergies: user.allergies
              }
            : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from AI.');
      }

      const botMsgId = `bot_${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMsg]);

      // If auto-speak enabled, read out loud
      if (autoSpeakEnabled) {
        handleSpeakMessage(botMsgId, data.reply);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: 'I apologize, I encountered a temporary connection issue. Please check your query and try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    stopSpeaking();
    setActiveSpeakingId(null);
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        role: 'model',
        text: `Conversation cleared. How can I assist with your health questions today?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div id="ai-health-chat-page" className="min-h-screen bg-slate-50 py-6 sm:py-10">
      <SEOHead
        title="AI Health Assistant & Conversational Medical Chat | MediVerse AI"
        description="Chat with MediVerse AI health assistant for 24/7 educational health information, wellness inquiries, and lab report context guidance in plain language."
        canonicalPath="/ai-chat"
        keywords="AI health assistant, healthcare AI, health chat, medical assistant AI, wellness information, digital health platform, voice health chat"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "AI Health Assistant Chat",
          "description": "24/7 conversational AI for health literacy and medical concept explanations with voice capability.",
          "url": "https://medi-verse-ai-wine.vercel.app/ai-chat"
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Voice & Text Health Assistant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Health Chat
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              AI health information only — not a diagnosis or replacement for a doctor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeSpeakingId) {
                  stopSpeaking();
                  setActiveSpeakingId(null);
                }
                setAutoSpeakEnabled(!autoSpeakEnabled);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                autoSpeakEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle Auto-Read AI Answers"
            >
              {autoSpeakEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>{autoSpeakEnabled ? 'Voice Auto-Read: ON' : 'Voice Auto-Read: OFF'}</span>
            </button>

            <button
              onClick={handleClearChat}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <span>{speechError}</span>
            <button onClick={() => setSpeechError(null)} className="text-rose-600 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Report Context Banner if Available */}
        {activeReport ? (
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-blue-950">Active Lab Report Loaded:</span>{' '}
                <span className="text-blue-800 font-mono">{activeReport.fileName}</span>{' '}
                <span className="text-blue-600">({activeReport.testResults.length} tests)</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={useReportContext}
                onChange={e => setUseReportContext(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>Include report findings in chat context</span>
            </label>
          </div>
        ) : (
          <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <InfoIcon className="w-4 h-4 text-slate-400" />
              <span>No lab report loaded. You can upload a report to chat about your specific test results.</span>
            </div>
            <button
              onClick={() => onNavigate('lab-report')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Upload Report
            </button>
          </div>
        )}

        {/* Chat Window Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[560px] sm:h-[620px] overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-2 prose prose-sm max-w-none prose-slate">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Audio Read-Out Button for Bot messages */}
                  {msg.role === 'model' && msg.id !== 'msg_welcome' && (() => {
                    const langInfo = detectTextLanguage(msg.text);
                    return (
                      <div className="flex items-center gap-2 px-1">
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(msg.id, msg.text)}
                          className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                            activeSpeakingId === msg.id
                              ? 'text-indigo-600 font-bold'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {activeSpeakingId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-indigo-600 animate-pulse" />
                              <span>Stop Reading ({langInfo.name})</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Listen in {langInfo.name}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>MediVerse AI is composing guidance...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 overflow-x-auto flex gap-2 text-xs">
            <span className="text-slate-400 font-medium py-1 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Suggested:
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 rounded-full shrink-0 transition-colors whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form with Voice Button */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            {isListening && (
              <div className="mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 animate-pulse">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="font-semibold">Listening to your voice... speak now</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className="text-xs font-bold text-indigo-700 hover:underline"
                >
                  Done
                </button>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Speech-to-Text Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-3 rounded-xl border transition-all shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30 animate-pulse'
                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200'
                }`}
                title={isListening ? 'Stop listening' : 'Speak your question'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Ask about medical terms, lab tests, healthy nutrition, or doctor questions...'}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium shadow-sm transition-all shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        <DisclaimerBanner />
      </div>
    </div>
  );
};

function InfoIcon(props: any) {
  return <HelpCircle {...props} />;
}
