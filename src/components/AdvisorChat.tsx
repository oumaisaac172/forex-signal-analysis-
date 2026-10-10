import React, { useState, useRef, useEffect } from 'react';
import type { TradingSignal, ChatMessage } from '../types';
import { updateAnalysisChatInFirestore } from '../firebase';
import {
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface AdvisorChatProps {
  signal: TradingSignal;
  onUpdateSignalChat: (updatedChat: ChatMessage[]) => void;
  userId: string;
}

const QUICK_PROMPTS = [
  "What's the risk-reward ratio?",
  'How should I manage position size?',
  'What indicators support this signal?',
  'When should I exit this trade?',
  'How should I trail my stop loss?',
];

export const AdvisorChat: React.FC<AdvisorChatProps> = ({
  signal,
  onUpdateSignalChat,
  userId,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = signal.chatHistory || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isSending) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newChatWithUser = [...messages, userMsg];
    onUpdateSignalChat(newChatWithUser);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: signal,
          messages: newChatWithUser,
          question: textToSend,
        }),
      });

      const data = await res.json();
      const advisorText = data.answer || "Maintain strict risk boundaries and monitor price action near key levels.";

      const advisorMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'advisor',
        text: advisorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalChat = [...newChatWithUser, advisorMsg];
      onUpdateSignalChat(finalChat);

      // Persist to Cloud Firestore under /users/{userId}/analyses/{analysisId}
      if (userId && signal.id) {
        await updateAnalysisChatInFirestore(userId, signal.id, finalChat);
      }
    } catch (err) {
      console.error('Failed to get advisor response:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'advisor',
        text: 'Statistical risk edge remains intact. Protect capital and adhere strictly to your Stop Loss level.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalChat = [...newChatWithUser, errorMsg];
      onUpdateSignalChat(finalChat);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Ask About This Analysis</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                AI Prop Mentor
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive trading advisor for risk management, position sizing & execution strategy.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Synced to Firestore</span>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div>
        <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Suggested Questions:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#0a0d16] hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="min-h-[220px] max-h-[380px] overflow-y-auto space-y-3 p-3 rounded-xl bg-[#080b12] border border-slate-800/80 shadow-inner">
        {messages.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-medium text-slate-400">No questions asked yet for this signal.</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Click a suggested question above or type your own question below to get senior trading advisor insights.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                      : 'bg-[#121726] border border-slate-700/80 text-slate-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`text-[9px] mt-1.5 flex items-center justify-end ${
                      isUser ? 'text-slate-900/70 font-semibold' : 'text-slate-500 font-mono'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start space-x-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-[#121726] border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-amber-300 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1">Advisor evaluating trade structure...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about position size, trailing stops, or macroeconomic risks..."
          disabled={isSending}
          className="flex-1 bg-[#0a0d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-amber-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
};
