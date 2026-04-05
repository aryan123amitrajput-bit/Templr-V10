
import React, { memo } from 'react';
import { playClickSound } from '../audio';
import { ScrollReveal } from './ScrollReveal';
import { ArrowRightIcon } from './Icons';

interface CTAProps {
  onOpenDocumentation?: () => void;
}

const CTA: React.FC<CTAProps> = ({ onOpenDocumentation }) => {
  const handleGetStarted = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDocumentation = () => {
      playClickSound();
      if (onOpenDocumentation) {
        onOpenDocumentation();
      } else {
        window.open('#', '_blank');
      }
  };

  return (
    <section className="py-40 relative overflow-hidden bg-black">
      
      {/* Giant Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-800/20 via-black to-black blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <ScrollReveal>
            <div className="max-w-4xl mx-auto">
            <h2 className="text-6xl md:text-9xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                Ship your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600">next idea.</span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-500 mb-16 font-light max-w-2xl mx-auto">
                Join the thousands of developers building the future with Templr.
            </p>
            
            <div className="flex flex-col items-center gap-8">
                <div className="flex justify-center">
                    {/* 
                       ULTRA-PREMIUM GLASS CTA BUTTON 
                       Spec: Dark Mode Glassmorphism, Liquid Smoke, Ethereal Halo
                    */}
                    <button 
                      onClick={handleGetStarted}
                      className="group relative px-14 py-5 rounded-full overflow-hidden transition-all duration-400 hover:scale-105 active:scale-95 bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(255,255,255,0.1)]"
                    >
                      {/* Liquid Gloss Top Reflection */}
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none"></div>

                      {/* Text Content */}
                      <span className="relative z-20 font-sans font-medium text-white text-xl tracking-wide flex items-center justify-center drop-shadow-sm">
                          Get Started
                      </span>
                    </button>
                </div>

                {/* Secondary CTA */}
                <button 
                    onClick={handleDocumentation}
                    className="group flex items-center gap-2 px-6 py-2 rounded-full text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest hover:bg-white/5"
                >
                    <span>Read Documentation</span>
                    <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1 opacity-50 group-hover:opacity-100" />
                </button>
            </div>
            </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default memo(CTA);
