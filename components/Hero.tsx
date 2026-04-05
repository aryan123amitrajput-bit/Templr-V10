
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowRightIcon, UploadIcon, ArrowLeftIcon } from './Icons';
import { playClickSound } from '../audio';
import { motion, AnimatePresence } from 'framer-motion';
import Galaxy from './Galaxy';
import { ShinyButton } from './ui/shiny-button';

interface HeroProps {
  onUploadClick: () => void;
}

// --- Particle Text Component ---
const ParticleText: React.FC<{ 
  text: string; 
  className: string;
  colors: string;
}> = ({ 
  text, 
  className,
  colors,
}) => {
  
  const containerVariants = {
    hidden: { 
      opacity: 0,
      transition: { staggerChildren: 0.05 } 
    },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      } 
    },
    exit: {
      opacity: 0,
      transition: { 
        staggerChildren: 0.02, 
        staggerDirection: -1,
        when: "afterChildren"
      }
    }
  };

  const charVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      filter: 'blur(8px)',
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150
      }
    },
    exit: {
      opacity: 0,
      y: -50, 
      filter: 'blur(8px)',
      scale: 0.5,
      transition: { 
        duration: 0.4
      }
    }
  };

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ display: 'flex', flexDirection: 'column', width: '100%', pointerEvents: 'none' }}
    >
      {text.split('\n').map((line, lineIdx) => (
        <div key={`line-${lineIdx}`} className="flex flex-wrap justify-center overflow-visible">
          {line.split(' ').map((word, wordIdx) => (
            <div key={`word-${lineIdx}-${wordIdx}`} className="flex whitespace-nowrap mr-[0.25em] last:mr-0">
              {word.split('').map((char, charIdx) => (
                <motion.span
                  key={`char-${lineIdx}-${wordIdx}-${charIdx}`}
                  variants={charVariants}
                  className={`inline-block ${colors}`}
                  style={{ willChange: 'transform, opacity, filter' }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
};

const Hero: React.FC<HeroProps> = ({ onUploadClick }) => {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const headlines = useMemo(() => [
    {
        id: 1,
        text: "Design the\nExtraordinary",
        className: "text-6xl md:text-8xl lg:text-9xl pb-4 font-display font-bold tracking-tight [filter:drop-shadow(0_0_100px_rgba(255,255,255,0.8))_drop-shadow(0_0_250px_rgba(255,255,255,0.4))]",
        colors: "bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent pb-6"
    },
    {
        id: 2,
        text: "Optimized for phone",
        className: "text-6xl md:text-8xl lg:text-9xl pb-4 font-display font-bold tracking-tight [filter:drop-shadow(0_0_100px_rgba(59,130,246,0.8))_drop-shadow(0_0_250px_rgba(59,130,246,0.4))]",
        colors: "bg-gradient-to-b from-blue-100 via-blue-400 to-blue-800 bg-clip-text text-transparent pb-6"
    },
    {
        id: 3,
        text: "The simplest\nTemplate library",
        className: "text-5xl md:text-7xl lg:text-8xl pb-4 font-display font-bold tracking-tight [filter:brightness(1.25)_drop-shadow(0_0_100px_rgba(255,100,0,0.8))_drop-shadow(0_0_250px_rgba(255,100,0,0.4))]",
        colors: "bg-gradient-to-b from-amber-300 via-orange-600 to-red-900 bg-clip-text text-transparent pb-6"
    }
  ], []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
        setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 4000); 

    return () => clearInterval(interval);
  }, [headlines.length, isPaused]);

  const nextHeadline = useCallback(() => {
    playClickSound();
    setHeadlineIndex((prev) => (prev + 1) % headlines.length);
  }, [headlines.length]);

  const prevHeadline = useCallback(() => {
    playClickSound();
    setHeadlineIndex((prev) => (prev - 1 + headlines.length) % headlines.length);
  }, [headlines.length]);

  const goToHeadline = useCallback((index: number) => {
      playClickSound();
      setHeadlineIndex(index);
  }, []);

  const scrollToGallery = useCallback(() => {
    playClickSound();
    const gallery = document.getElementById('gallery');
    if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const currentHeadline = headlines[headlineIndex];

  return (
    <section 
        className="relative h-screen min-h-[800px] w-full flex flex-col items-center justify-center overflow-hidden"
    >
      <h1 className="sr-only">Templr - Download Real Landing Page Templates for SaaS, Startups, and Portfolios</h1>
      
      {/* --- GALAXY BACKGROUND (Z-[-2]) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-black">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-[#050505] to-black z-0"></div>
         <Galaxy density={3} mouseInteraction={true} />
      </div>

      {/* --- MAIN CONTENT (Z-10) --- */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-7xl mx-auto px-6 -mt-[10vh] w-full">
        
        {/* Release Pill */}
        <motion.div 
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 relative group"
        >
            <div className="relative inline-flex overflow-hidden rounded-full p-[1.5px]">
                <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#0000_75%,#3b82f6_100%)]" />
                <div className="relative inline-flex items-center gap-3 rounded-full bg-slate-950/80 px-6 py-2 text-sm font-medium text-white backdrop-blur-3xl transition-colors hover:bg-slate-900/80">
                    <div className="flex items-center gap-1.5">
                         <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                         </span>
                         <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase shadow-black drop-shadow-md">Templr v3.0</span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/20 mx-1"></div>
                    <span className="text-[11px] text-slate-300 font-medium tracking-wide group-hover:text-white transition-colors">
                         The Future of Design
                    </span>
                </div>
            </div>
        </motion.div>

        {/* --- CAROUSEL CONTAINER --- */}
        <div 
            className="relative w-full flex flex-col items-center group/carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Cinematic Headline */}
            <div className="relative h-[350px] md:h-[550px] w-full flex items-center justify-center mb-2 perspective-container z-20">
                <button 
                    onClick={prevHeadline}
                    className="flex absolute left-0 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-4 group-hover/carousel:translate-x-0"
                    aria-label="Previous Headline"
                >
                    <ArrowLeftIcon className="w-8 h-8" />
                </button>
                
                <button 
                    onClick={nextHeadline}
                    className="flex absolute right-0 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-4 group-hover/carousel:translate-x-0"
                    aria-label="Next Headline"
                >
                    <ArrowRightIcon className="w-8 h-8" />
                </button>

                <AnimatePresence mode="popLayout" initial={false}>
                     <ParticleText 
                        key={currentHeadline.id}
                        text={currentHeadline.text} 
                        className={`absolute inset-0 flex items-center justify-center ${currentHeadline.className}`}
                        colors={currentHeadline.colors}
                     />
                </AnimatePresence>
            </div>

            {/* Carousel Indicators */}
            <div className="flex items-center gap-3 z-30 mb-8">
                {headlines.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goToHeadline(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === headlineIndex 
                                ? 'w-8 bg-white shadow-[0_0_10px_white]' 
                                : 'w-1.5 bg-white/20 hover:bg-white/40'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>

        {/* Subtext */}
        <motion.p 
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-2xl text-slate-300 font-light max-w-2xl mx-auto mb-12 leading-relaxed tracking-wide mix-blend-plus-lighter will-change-[transform,opacity] drop-shadow-md"
        >
            The curated marketplace for high-fidelity digital assets. <br className="hidden md:block"/>
            <span className="text-slate-400">Built for the obsessive.</span>
        </motion.p>

        {/* Premium Action Stack */}
        <motion.div 
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center gap-8 w-full justify-center"
        >
            
            {/* Primary Button: Explore Collection */}
            <motion.button 
                onClick={scrollToGallery}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="group relative h-[56px] px-8 min-w-[240px] rounded-full bg-gradient-to-b from-[#ffffff] to-[#e0e0e0] text-black overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                
                <span className="relative z-10 flex items-center justify-center gap-2 font-semibold text-[16px]">
                    Explore Collection
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
            </motion.button>

            {/* Secondary Button: Submit Work - SHINY BUTTON INTEGRATION */}
            <ShinyButton 
                onClick={() => { playClickSound(); onUploadClick(); }}
                className="min-w-[220px] h-[60px] font-bold uppercase tracking-[0.15em] text-sm text-white"
            >
                <UploadIcon className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
                <span>Submit Work</span>
            </ShinyButton>

        </motion.div>
      </div>
      
      {/* --- BOTTOM FADE --- */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none"></div>

    </section>
  );
};

export default React.memo(Hero);
