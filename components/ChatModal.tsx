
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { XIcon, SendIcon } from './Icons';
import { playClickSound, playTypingSound } from '../audio';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'creator';
  time: string;
}

const EmojiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
  </svg>
);

const PaperClipIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
  </svg>
);

// Memoized Background to prevent re-renders
const ChatBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-blue-500/20 blur-[90px] rounded-full mix-blend-screen animate-blob will-change-transform"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] bg-cyan-500/10 blur-[80px] rounded-full mix-blend-screen animate-blob animation-delay-2000 will-change-transform"></div>
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-500/10 blur-[60px] rounded-full mix-blend-screen animate-blob animation-delay-4000 will-change-transform"></div>
  </div>
));

// Extracted Input Dock Component
const ChatInputDock = memo(({ onSendMessage }: { onSendMessage: (text: string) => void }) => {
  const [text, setText] = useState('');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      playTypingSound();
      if (event.key === 'Enter') {
          handleSend();
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
  };

  const handleSend = () => {
      if (text.trim()) {
          onSendMessage(text);
          setText('');
      }
  };

  return (
    <div className="p-5 pt-2 relative z-20 bg-gradient-to-t from-[#0f111a] to-transparent">
      {/* Visible Label for A11y Requirement */}
      <label htmlFor="chat-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-4">
          Message
      </label>
      
      <div className="relative flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all focus-within:bg-white/10 focus-within:border-white/20 focus-within:shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] transform-gpu">
        
        {/* Icons */}
        <div className="flex gap-1 pl-2 flex-shrink-0">
            <button onClick={playClickSound} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all" aria-label="Add Emoji">
                <EmojiIcon className="w-5 h-5" />
            </button>
            <button onClick={playClickSound} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all" aria-label="Attach File">
                <PaperClipIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Input */}
        <input 
          id="chat-input"
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-transparent py-3 text-[15px] font-medium text-white placeholder-slate-400/60 focus:outline-none px-2"
          autoFocus
        />
        
        {/* Glowing Send Orb */}
        <button 
          onClick={() => { playClickSound(); handleSend(); }}
          disabled={!text.trim()}
          title={!text.trim() ? "Message cannot be empty" : "Send message"}
          className="flex-shrink-0 group relative w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_5px_15px_rgba(6,182,212,0.4),inset_0_2px_2px_rgba(255,255,255,0.4)] transition-all hover:scale-105 hover:shadow-[0_8px_20px_rgba(6,182,212,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          aria-label="Send Message"
        >
          <SendIcon className="w-5 h-5 text-white drop-shadow-md translate-x-0.5" />
        </button>
      </div>
    </div>
  );
});

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, creatorName }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'creator',
      text: `Hello! Thanks for viewing my work. How can I help you today?`,
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=334155&color=e2e8f0&bold=true`;

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSendMessage = useCallback((text: string) => {
    playClickSound();
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessage: Message = { id: Date.now(), text, sender: 'user', time: timeString };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = { 
        id: Date.now() + 1,
        text: "That sounds great! I'm available for freelance work if you need customizations.", 
        sender: 'creator',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prevMessages => [...prevMessages, reply]);
      playTypingSound(); 
    }, 2500);
  }, []);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500"
      onClick={onClose}
    >
      {/* Mobile: Bottom Sheet | Desktop: Centered Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-[420px] h-[85vh] md:h-[800px] md:max-h-[90vh] flex flex-col rounded-t-[32px] md:rounded-[48px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden transform transition-all duration-500 animate-slide-up border-t border-x border-white/10 md:border transform-gpu"
        onClick={(e) => e.stopPropagation()}
        style={{
            background: 'linear-gradient(180deg, #0a0f1e 0%, #111827 100%)'
        }}
      >
        <ChatBackground />

        {/* --- Header --- */}
        <div className="relative z-20 px-6 py-5 bg-white/5 backdrop-blur-md border-b border-white/5 flex items-center justify-between shadow-lg shadow-black/20 transform-gpu">
          <div className="flex items-center gap-4">
             <div className="relative">
                {/* Avatar Glow */}
                <div className="absolute -inset-2 bg-cyan-500/30 blur-md rounded-full"></div>
                <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-white/20 to-white/5 border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                    <img src={avatarUrl} alt={creatorName} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0f111a] shadow-[0_0_8px_#4ade80]"></div>
             </div>
             <div>
                <h3 className="text-lg font-bold text-white tracking-wide drop-shadow-md">{creatorName}</h3>
                <p className="text-xs font-medium text-cyan-200/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Online
                </p>
             </div>
          </div>
          
          <button 
            onClick={() => { playClickSound(); onClose(); }} 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95 group shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close Chat"
          >
            <XIcon className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </button>
        </div>

        {/* --- Chat Body --- */}
        <div 
            ref={chatBodyRef} 
            className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 p-6 space-y-6 scroll-smooth no-scrollbar"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-spring-up`}>
                    {/* 3D Bubble Container */}
                    <div className={`relative max-w-[85%] group perspective-500 transform-gpu`}>
                        
                        {/* The Bubble */}
                        <div className={`
                            relative px-5 py-4 text-[15px] leading-relaxed rounded-[24px] backdrop-blur-md transition-all duration-300
                            ${isUser 
                                ? 'rounded-tr-[4px] text-white bg-gradient-to-br from-blue-600/80 to-cyan-500/80' 
                                : 'rounded-tl-[4px] text-slate-100 bg-gradient-to-br from-slate-800/60 to-slate-900/60'
                            }
                        `}
                        style={{
                            boxShadow: isUser 
                                ? 'inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 5px rgba(0,0,0,0.2), 0 10px 20px -5px rgba(6,182,212,0.3)' 
                                : 'inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -2px 5px rgba(0,0,0,0.3), 0 10px 20px -5px rgba(0,0,0,0.3)',
                            border: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)'
                        }}
                        >
                            {/* Specular Highlight (Glass/Gel Effect) */}
                            <div className="absolute top-1 left-4 right-4 h-[40%] bg-gradient-to-b from-white/10 to-transparent rounded-full blur-[4px] pointer-events-none"></div>

                            <span className="relative z-10 drop-shadow-sm font-medium">{msg.text}</span>
                        </div>

                        {/* Time */}
                        <span className={`text-[10px] font-semibold text-slate-500/60 mt-2 block ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
                            {msg.time}
                        </span>
                    </div>
                </div>
            );
          })}

          {isTyping && (
             <div className="flex items-start animate-spring-up">
                 <div className="px-4 py-3 bg-slate-800/60 rounded-[24px] rounded-tl-[4px] shadow-lg border border-white/5 flex gap-1.5 items-center backdrop-blur-md transform-gpu">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(34,211,238,0.6)] [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(34,211,238,0.6)] [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
                 </div>
             </div>
          )}
        </div>

        <ChatInputDock onSendMessage={handleSendMessage} />

      </div>
      
      <style>{`
        @keyframes spring-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); }
          60% { opacity: 1; transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-spring-up {
          animation: spring-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .perspective-500 {
            perspective: 500px;
        }
      `}</style>
    </div>
  );
};

export default ChatModal;
