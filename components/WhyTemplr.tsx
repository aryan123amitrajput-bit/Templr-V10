
import React from 'react';
import { ScrollReveal } from './ScrollReveal';

const WhyTemplr: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-black relative overflow-hidden">
      
      {/* Deep Ambient Background */}
      <div className="absolute inset-0 bg-[#000000]">
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 max-w-[90rem] relative z-10">
        
        {/* Header */}
        <ScrollReveal>
            <div className="flex flex-col items-center text-center mb-16 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">The Ecosystem</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                    Why Builders <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Choose Templr.</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl font-light">
                    We've reimagined the marketplace experience. No bloat, no outdated code. Just pure, production-ready design engineering.
                </p>
            </div>
        </ScrollReveal>

      </div>
    </section>
  );
};

export default WhyTemplr;
