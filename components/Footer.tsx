
import React from 'react';
import { TwitterIcon } from './Icons';
import { playClickSound } from '../audio';
import { ScrollReveal } from './ScrollReveal';

interface FooterProps {
  onShowNotification: (message: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onShowNotification }) => {
  const handleLink = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    playClickSound();
    window.open(url, '_blank');
  };

  return (
    <footer className="relative bg-[#030304] border-t border-white/[0.08] pt-16 overflow-hidden flex flex-col">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Logo Area */}
                <div className="text-center md:text-left">
                    <h4 className="text-white font-bold text-lg mb-1 tracking-tight">Templr</h4>
                    <p className="text-slate-600 text-xs">
                        High-performance template ecosystem.
                    </p>
                </div>

                {/* Socials */}
                <div className="flex gap-6">
                    <a href="https://x.com/GTqhqh48540" onClick={(e) => handleLink(e, 'https://x.com/GTqhqh48540')} className="text-slate-500 hover:text-white transition-colors"><TwitterIcon className="w-4 h-4" /></a>
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-slate-700 text-[10px]">© 2024 Templr Inc. All rights reserved.</p>
            </div>
        </ScrollReveal>
      </div>

      {/* Background Image with top fade */}
      <div className="relative w-full h-[300px] md:h-[450px] z-0 pointer-events-none mt-4">
        <img 
          src="https://i.ibb.co/218M2Dpc/1773216566644-019cdbf1-0fae-77a1-9733-2fc4cbbed401.png" 
          alt="Footer Background" 
          className="w-full h-full object-cover object-top opacity-100"
          referrerPolicy="no-referrer"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)' 
          }}
        />
      </div>
    </footer>
  );
};

export default Footer;
