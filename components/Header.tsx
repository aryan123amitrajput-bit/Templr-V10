
import React, { useState, useEffect, useRef } from 'react';
import { UploadIcon, SpeakerWaveIcon, SpeakerXMarkIcon, CpuIcon, CogIcon, CheckCircleIcon, RocketIcon } from './Icons';
import { playClickSound } from '../audio';
import type { Session } from '../api';
import { BorderBeam } from './ui/BorderBeam';
import { isApiConfigured } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  session: Session | null;
  onUploadClick: () => void;
  onLoginClick: () => void;
  onSignOut: () => void;
  onDashboardClick: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenSetup: () => void;
  onOpenSettings?: () => void;
  isSubscribed?: boolean;
  creditsLeft?: number; // New prop
}

const Header: React.FC<HeaderProps> = ({ 
    session, 
    onUploadClick, 
    onLoginClick, 
    onSignOut, 
    onDashboardClick, 
    soundEnabled, 
    onToggleSound, 
    onOpenSetup, 
    onOpenSettings,
    isSubscribed = false,
    creditsLeft
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-6 px-6 pointer-events-none">
        {/* 
            ULTRA-FROSTED TITANIUM BAR 
            Thinner, sharper, with specific rim lighting
        */}
        <header 
            className="pointer-events-auto bg-[#050505]/60 backdrop-blur-3xl border border-white/[0.08] h-12 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center gap-6 px-5 animate-slide-up [animation-delay:200ms] relative overflow-visible group"
        >
            {/* Top Shine */}
            <div className="absolute -top-[1px] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>

            {/* Logo */}
            <div 
                className="flex items-center gap-3 cursor-pointer select-none group/logo" 
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
                <div className="w-5 h-5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-[6px] flex items-center justify-center shadow-[0_2px_10px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transform transition-transform group-hover/logo:scale-105">
                    <span className="text-white font-bold text-[11px] leading-none tracking-tighter" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>T</span>
                </div>
                <span className="font-display font-bold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)] transition-all">Templr</span>
                
                {/* Status Indicator */}
                {isApiConfigured ? (
                    <div className="hidden sm:flex items-center gap-1.5 ml-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                         <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                         <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-wide">Online</span>
                    </div>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenSetup(); }}
                        className="hidden sm:flex items-center gap-1.5 ml-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                    >
                         <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                         <span className="text-[9px] font-bold uppercase text-red-400 tracking-wide">Connect Backend</span>
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pl-2">
                
                {/* PRO LABEL - Visible if Subscribed */}
                {isSubscribed ? (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                        <CheckCircleIcon className="w-3 h-3 text-black" />
                        <span className="text-[10px] font-bold uppercase text-black tracking-widest">PRO</span>
                    </div>
                ) : (
                    session && creditsLeft !== undefined && (
                        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border ${creditsLeft === 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                            <RocketIcon className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{creditsLeft} Credits</span>
                        </div>
                    )
                )}

                {/* Sound Toggle */}
                <button 
                    onClick={() => { playClickSound(); onToggleSound(!soundEnabled); }}
                    className={`
                        w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300
                        ${soundEnabled ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300'}
                    `}
                    title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
                >
                    {soundEnabled ? (
                        <SpeakerWaveIcon className="w-3.5 h-3.5" />
                    ) : (
                        <SpeakerXMarkIcon className="w-3.5 h-3.5" />
                    )}
                </button>

                {session ? (
                    <>
                        {/* 
                            UPDATED BUTTON: CLEAN SOLID (No Gradient Stroke)
                            Removed the gradient mesh and colored border for a pure, solid look.
                        */}
                        <motion.button 
                            onClick={() => { playClickSound(); onUploadClick(); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative hidden sm:inline-flex items-center gap-2 px-6 py-2 rounded-full bg-zinc-900/50 border border-white/10 hover:border-white/30 transition-all duration-300 shadow-[0_0_0_0_rgba(255,255,255,0.0)] hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] overflow-hidden"
                        >
                            {/* Moving Sheen - Subtle White */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>

                            <UploadIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" strokeWidth={2} />
                            <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                                Upload
                            </span>
                        </motion.button>
                        
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="block rounded-full focus:outline-none active:scale-95 transition-transform ml-1">
                                <div className="w-7 h-7 rounded-full p-[1px] bg-gradient-to-b from-white/20 to-transparent">
                                    <img 
                                        src={session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email || 'U')}&background=333&color=fff`} 
                                        alt="User" 
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </button>
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 400, 
                                            damping: 25, 
                                            mass: 0.8,
                                            staggerChildren: 0.05,
                                            delayChildren: 0.05
                                        }}
                                        className="absolute right-0 mt-4 w-48 bg-[#050505] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden backdrop-blur-3xl ring-1 ring-white/5 origin-top-right"
                                    >
                                        <motion.button 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            onClick={() => { onDashboardClick(); setIsUserMenuOpen(false); }} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2"
                                        >
                                            <CpuIcon className="w-3 h-3" /> Dashboard
                                        </motion.button>
                                        
                                        {/* Settings Button */}
                                        <motion.button 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            onClick={() => { if(onOpenSettings) onOpenSettings(); setIsUserMenuOpen(false); }} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2"
                                        >
                                            <CogIcon className="w-3 h-3" /> Settings
                                        </motion.button>

                                        <motion.button 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            onClick={onSignOut} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                                        >
                                            Sign Out
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <button 
                        onClick={() => { playClickSound(); onLoginClick(); }}
                        className="relative overflow-hidden px-5 py-1.5 rounded-full group"
                    >
                        {/* Custom Button Background */}
                        <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-full group-hover:bg-white/20 transition-colors"></div>
                        <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-white">Sign In</span>
                        
                        {/* Micro Beam */}
                        <BorderBeam size={20} duration={3} delay={0} colorFrom="#ffffff" colorTo="#ffffff" borderWidth={1} className="opacity-40" />
                    </button>
                )}
            </div>
        </header>
    </div>
  );
};

export default React.memo(Header);
