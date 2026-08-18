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
  CornerDownLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';

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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

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

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMsg]);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Health Information Assistant</span>
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
              onClick={handleClearChat}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

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

          {/* Input Form */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask about medical terms, lab tests, healthy nutrition, or doctor questions..."
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
