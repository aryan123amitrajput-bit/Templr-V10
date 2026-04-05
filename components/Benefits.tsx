
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LayersIcon, SmartphoneIcon, EyeIcon, CursorClickIcon, ShieldCheckIcon, ArrowRightIcon } from './Icons';
import { ScrollReveal } from './ScrollReveal';

const benefits = [
  {
    title: "All Templates in One Place",
    description: "A unified ecosystem for your entire design workflow. Access everything from a single dashboard.",
    icon: LayersIcon,
  },
  {
    title: "Instant Preview",
    description: "Experience interactions live. Test animations, responsive behavior, and states before you download.",
    icon: EyeIcon,
  },
  {
    title: "Optimized for Mobile",
    description: "Responsive architectures that scale perfectly from 4K desktops down to the smallest handheld devices.",
    icon: SmartphoneIcon,
  },
  {
    title: "Trusted Creators",
    description: "Every asset is manually verified by our QA team to ensure code quality and design fidelity.",
    icon: ShieldCheckIcon,
  },
  {
    title: "One-Click Deploy",
    description: "Seamless integration with Vercel and Netlify. Go from marketplace to production in seconds.",
    icon: CursorClickIcon,
  }
];

// --- SPOTLIGHT CARD COMPONENT ---
interface SpotlightCardProps {
  children?: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard = ({ 
  children, 
  className = "", 
  spotlightColor = "rgba(56, 189, 248, 0.2)" 
}: SpotlightCardProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-[24px] border border-slate-800/60 bg-[#0B1121] overflow-hidden group shadow-2xl transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] hover:border-slate-700/60 ${className}`}
    >
      {/* 1. Mouse Spotlight Bloom (Interactive) */}
      <div
        className="pointer-events-none absolute -inset-px transition duration-500 opacity-0 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      
      {/* 2. Mouse Border Reveal (Interactive) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition duration-500 opacity-0 group-hover:opacity-100"
        style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.15), transparent 40%)`,
            maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px'
        }}
      />

      {/* 3. Static Directional Lighting (The "Blue Ray") */}
      {/* Top-Right Light Source */}
      <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500"></div>
      
      {/* Surface Gradient (Simulates light hitting glass from TR) */}
      <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/[0.05] via-transparent to-transparent pointer-events-none"></div>

      {/* Deep Shadow (Bottom-Left) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-[#020408]/40 to-transparent pointer-events-none"></div>

      {/* Edge Highlight (Top & Right Borders) */}
      <div className="absolute inset-0 rounded-[24px] shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.05)] pointer-events-none"></div>

      {/* Content Container */}
      <div className="relative h-full z-20">
        {children}
      </div>
    </div>
  );
};

const Benefits: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const yBlue = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const yPurple = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={sectionRef} className="py-32 bg-[#020408] relative overflow-hidden">
      
      {/* --- ATMOSPHERE --- */}
      {/* Deep Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020408] via-[#0B1121] to-[#020408]"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Global Ambient Glows (Parallax) */}
      <motion.div 
        style={{ y: yBlue }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none"
      ></motion.div>
      <motion.div 
        style={{ y: yPurple }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none"
      ></motion.div>

      <div className="container mx-auto px-6 md:px-12 max-w-7xl relative z-10">
        
        {/* HEADER */}
        <ScrollReveal>
            <div className="mb-20 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-8 bg-blue-500/50"></div>
                    <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-widest">Why Templr?</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
                    Constructed for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400">maximum velocity.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed border-l-2 border-slate-800 pl-6">
                    We've stripped away the complexity of traditional marketplaces. 
                    What remains is a pure, high-performance engine for design delivery.
                </p>
            </div>
        </ScrollReveal>

        {/* --- SPOTLIGHT GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {benefits.map((item, index) => (
                <ScrollReveal key={index} staggerIndex={index}>
                    <SpotlightCard className="h-full">
                        <div className="p-8 h-full flex flex-col relative">
                             {/* Grain Texture Overlay */}
                             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>

                             {/* Icon Container with Glass Effect */}
                             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center mb-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] group-hover:scale-105 group-hover:border-blue-500/30 group-hover:shadow-[0_4px_20px_-5px_rgba(59,130,246,0.3)] transition-all duration-300">
                                 <item.icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors drop-shadow-md" />
                             </div>

                             {/* Text */}
                             <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-50 transition-colors drop-shadow-sm">{item.title}</h3>
                             <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                 {item.description}
                             </p>

                             {/* Subtle Decor Line at Bottom */}
                             <div className="mt-auto pt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <span className="h-[1px] w-full bg-gradient-to-r from-blue-500/50 to-transparent"></span>
                             </div>
                        </div>
                    </SpotlightCard>
                </ScrollReveal>
            ))}

            {/* --- CTA CARD (6th Item) --- */}
            <ScrollReveal staggerIndex={5}>
                <SpotlightCard className="h-full group/cta" spotlightColor="rgba(168, 85, 247, 0.3)">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 opacity-60 transition-opacity group-hover/cta:opacity-100"></div>
                    
                    <div className="p-8 h-full flex flex-col items-center justify-center text-center relative z-20">
                         {/* Animated Ring */}
                         <div className="relative mb-6">
                             <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse"></div>
                             <div className="relative w-16 h-16 rounded-full border border-white/20 bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover/cta:border-white/40 group-hover/cta:bg-white/20 transition-all duration-300 shadow-2xl">
                                 <span className="text-3xl text-white font-light group-hover/cta:scale-110 transition-transform duration-300 pb-1">＋</span>
                             </div>
                         </div>
                         
                         <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Join the Ecosystem</h3>
                         <p className="text-sm text-slate-300 mb-8 max-w-[200px] leading-relaxed">Unlock full access to 1,000+ premium assets.</p>
                         
                         <button className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white border border-white/20 rounded-full px-6 py-3 hover:bg-white hover:text-black hover:border-white transition-all duration-300 group-hover/cta:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                             <span>Get Started</span>
                             <ArrowRightIcon className="w-4 h-4" />
                         </button>
                    </div>
                </SpotlightCard>
            </ScrollReveal>

        </div>

      </div>
    </section>
  );
};

export default Benefits;
