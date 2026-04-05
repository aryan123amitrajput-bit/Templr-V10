
import React from 'react';
import { MailIcon } from './Icons';
import { playClickSound } from '../audio';

const ContactFloat = () => {
  return (
    <div className="fixed bottom-8 right-8 z-[90] flex flex-col items-end gap-4 pointer-events-none">
        
      {/* Button */}
      <a 
        href="mailto:templrsaas@gmail.com"
        onClick={playClickSound}
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#050505] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md"></div>
        
        {/* Icon */}
        <MailIcon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors relative z-10" />
        
        {/* Tooltip Label (Shows on Hover) */}
        <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-[#050505] border border-white/10 text-xs font-bold text-white uppercase tracking-widest opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap shadow-xl pointer-events-none">
            Contact Support
        </div>
      </a>
    </div>
  );
};

export default React.memo(ContactFloat);
