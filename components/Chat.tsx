import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import NarrativeText from './NarrativeText';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-eid-panel">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`
                max-w-[95%] lg:max-w-[85%] rounded-lg p-4 text-sm shadow-md
                ${msg.role === 'user' 
                  ? 'bg-eid-accent text-white rounded-br-none border border-white/10' 
                  : 'bg-black/40 border border-white/5 rounded-bl-none'}
              `}
            >
              {msg.role === 'model' ? (
                <NarrativeText text={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap font-sans text-gray-100">{msg.content}</div>
              )}
            </div>
            <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider font-mono">
              {msg.role === 'user' ? 'YOU' : 'GAME MASTER'}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
             <div className="bg-black/40 text-gray-500 border border-white/5 rounded-lg p-3 text-sm animate-pulse font-mono">
                <i className="fa-solid fa-microchip mr-2"></i>
                Constructing narrative geometry...
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-eid-dark">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you do?"
            disabled={isLoading}
            className="w-full bg-eid-panel border border-white/10 text-white rounded-md pl-4 pr-12 py-3 focus:outline-none focus:border-id-glow transition-colors placeholder-gray-600 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
