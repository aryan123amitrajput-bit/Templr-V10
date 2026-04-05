
import React, { useState, useEffect, useRef, memo } from 'react';
import { XIcon, LockIcon, RocketIcon, ShieldCheckIcon, LightbulbIcon, CheckCircleIcon, CpuIcon } from './Icons';
import { playClickSound, playSuccessSound, playTypingSound, playNotificationSound } from '../audio';
import { motion, AnimatePresence } from 'framer-motion';
import { isApiConfigured } from '../api';

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const LockAnimated = () => (
    <div className="relative w-24 h-24 flex items-center justify-center mb-6 pointer-events-none">
      <div className="absolute inset-0 rounded-full border border-cyan-500/10 border-t-cyan-400/60 animate-[spin_4s_linear_infinite]"></div>
      <div className="absolute inset-4 rounded-full border border-blue-500/10 border-b-blue-400/60 animate-[spin_3s_linear_infinite_reverse]"></div>
      <div className="relative z-10 flex items-center justify-center w-10 h-10 bg-cyan-950/50 rounded-full shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)] backdrop-blur-sm border border-cyan-500/20">
          <LockIcon className="w-4 h-4 text-cyan-200" />
      </div>
    </div>
);

const PremiumInput = ({ icon: Icon, error, label, id, ...props }: any) => (
    <div className="group relative mb-6">
        <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 cursor-pointer hover:text-white transition-colors">
            {label}
        </label>
        
        <div className="relative">
            <div className={`absolute inset-0 bg-[#030407] rounded-2xl border shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] transition-all duration-300 
                ${error 
                    ? 'border-red-500/50 group-hover:border-red-500/80 group-focus-within:border-red-500' 
                    : 'border-white/10 group-hover:border-white/20 group-focus-within:border-cyan-500/40'
                }
                ${!error && 'group-focus-within:bg-[#05060a]'}
            `}></div>
            <div className="relative z-10 flex items-center">
                <div className={`pl-5 pr-4 py-4 transition-colors duration-300 ${error ? 'text-red-400' : 'text-slate-500 group-focus-within:text-cyan-400'}`}>
                    <Icon className="w-5 h-5 relative z-10" />
                </div>
                <div className={`h-6 w-[1px] transition-colors duration-300 ${error ? 'bg-red-500/20' : 'bg-white/5 group-focus-within:bg-cyan-500/20'}`}></div>
                <input
                    id={id}
                    {...props}
                    className="relative z-50 w-full bg-transparent border-none rounded-2xl py-4 px-4 text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:ring-0"
                />
            </div>
        </div>
        
        <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-5 left-4 z-20"
                >
                     <p className="text-[10px] text-red-400 font-medium tracking-wide flex items-center gap-1">
                        {error}
                     </p>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignup: (email: string, pass: string, name: string) => Promise<any>;
  onOpenSetup?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onSignup, onOpenSetup }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
      email?: string;
      password?: string;
      name?: string;
      global?: string;
  }>({});

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
        setErrors({});
        setSuccess(false);
        setIsLoading(false);
        setEmail('');
        setPassword('');
        setName('');
    }
  }, [isOpen]); 

  const validateForm = () => {
      const newErrors: typeof errors = {};
      let isValid = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
          newErrors.email = "Email is required.";
          isValid = false;
      } else if (!emailRegex.test(email)) {
          newErrors.email = "Please enter a valid email address.";
          isValid = false;
      }
      if (!password) {
          newErrors.password = "Password is required.";
          isValid = false;
      } else if (password.length < 8) {
          newErrors.password = "Must be at least 8 characters.";
          isValid = false;
      }
      if (mode === 'signup' && !name.trim()) {
          newErrors.name = "Please enter your name.";
          isValid = false;
      }
      setErrors(newErrors);
      if (!isValid) playNotificationSound();
      return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[LoginModal] Submit triggered. Mode:", mode);
    playClickSound();
    setErrors({});
    if (!validateForm()) {
        console.log("[LoginModal] Validation failed");
        return;
    }

    setIsLoading(true);
    console.log("[LoginModal] Loading state set to true");
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
        if (mounted.current) {
            console.warn("[LoginModal] Safety timeout triggered (90s)");
            setIsLoading(false);
            setErrors(prev => ({ ...prev, global: "Request is taking longer than expected. Please try again." }));
        }
    }, 90000);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        clearTimeout(safetyTimeout);
        setIsLoading(false);
        setErrors(prev => ({ ...prev, global: "You are offline. Please check your internet connection." }));
        return;
    }

    try {
      if (mode === 'signin') {
          console.log("[LoginModal] Calling onLogin...");
          await onLogin(email, password);
          console.log("[LoginModal] onLogin resolved");
          if (mounted.current) {
              setSuccess(true);
              playSuccessSound();
              setTimeout(onClose, 2500); // Extended for cinematic feel
          }
      } else {
          console.log("[LoginModal] Calling onSignup...");
          const data = await onSignup(email, password, name);
          console.log("[LoginModal] onSignup resolved", data);
          if (mounted.current && data && (data.session || data.user)) {
              if (!data.session) {
                  try {
                      await onLogin(email, password);
                  } catch (ignored) {}
              }
              setSuccess(true);
              playSuccessSound();
              setTimeout(onClose, 2500);
          }
      }
    } catch (err: any) {
      console.error("[LoginModal] Login Error caught:", err);
      playNotificationSound();
      let displayError = err.message || "An unexpected error occurred.";
      const rawMsg = displayError.toLowerCase();

      if (rawMsg.includes('user already registered')) {
          displayError = "This email is already in use. Please sign in instead.";
          setMode('signin'); // Helpfully switch mode
      } else if (rawMsg.includes('fetch') || rawMsg.includes('network') || rawMsg.includes('failed to fetch')) {
          displayError = "Connection Error: Could not reach the database. Please check your internet connection or try again later.";
      } else if (rawMsg.includes('invalid login credentials')) {
          displayError = "Incorrect email or password.";
      } else if (rawMsg.includes('refresh token') || rawMsg.includes('invalid token')) {
          displayError = "Session expired. Please try signing in again.";
      }
      
      if (mounted.current) {
          setErrors(prev => ({ ...prev, global: displayError }));
      }
    } finally {
      console.log("[LoginModal] Finally block reached. Clearing timeout.");
      clearTimeout(safetyTimeout);
      if (mounted.current) {
          setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#02040a]/90 backdrop-blur-sm animate-fade-in perspective-container p-4">
      <button onClick={() => { playClickSound(); onClose(); }} className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all focus:outline-none" aria-label="Close">
        <XIcon className="w-6 h-6" />
      </button>

      <div className="relative z-10 w-full max-w-[420px] mx-auto animate-slide-up transform-gpu" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-[#080a11] border border-white/10 rounded-[40px] shadow-2xl p-8 md:p-10 flex flex-col items-center overflow-hidden">
            {!success ? (
                <>
                    <LockAnimated />
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{mode === 'signin' ? 'Welcome Back' : 'Join Templr'}</h2>
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-8">{mode === 'signin' ? 'Secure Access' : 'Create your account'}</p>

                    <div className="w-full grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/5 rounded-xl mb-8">
                        <button onClick={() => { setMode('signin'); setErrors({}); }} className={`py-3 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'signin' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Sign In</button>
                        <button onClick={() => { setMode('signup'); setErrors({}); }} className={`py-3 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'signup' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Create Account</button>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full">
                        {mode === 'signup' && (
                            <PremiumInput id="signup-name" label="Display Name" icon={UserIcon} type="text" placeholder="e.g. Alex Chen" value={name} onChange={(e: any) => setName(e.target.value)} error={errors.name} />
                        )}
                        <PremiumInput id="email-input" label="Email Address" icon={MailIcon} type="email" placeholder="name@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} error={errors.email} />
                        <PremiumInput id="password-input" label="Password" icon={LockIcon} type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} error={errors.password} />

                        <AnimatePresence>
                            {errors.global && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center overflow-hidden">
                                    <p className="text-red-400 text-[11px] font-bold font-sans leading-tight">{errors.global}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <button type="submit" disabled={isLoading} className={`w-full h-14 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 bg-white hover:bg-slate-200 text-black ${isLoading ? 'opacity-80 cursor-wait' : ''}`}>
                            {isLoading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>}
                            <span>{isLoading ? (mode === 'signin' ? 'Signing in...' : 'Registering...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}</span>
                        </button>

                        <div className="mt-6 relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                        </div>
                    </form>
                </>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    className="py-12 flex flex-col items-center text-center w-full relative"
                >
                    {/* Futuristic Scanning Effect */}
                    <div className="relative w-24 h-24 mb-10 group">
                        <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full animate-pulse"></div>
                        <div className="absolute -inset-4 border border-blue-500/10 rounded-full animate-[spin_8s_linear_infinite]"></div>
                        
                        {/* The Success Icon */}
                        <div className="relative z-10 w-full h-full bg-slate-900 rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(59,130,246,0.6)] overflow-hidden">
                            <CheckCircleIcon className="w-10 h-10 text-blue-400" />
                            {/* Scanning Line */}
                            <motion.div 
                                initial={{ top: "-10%" }}
                                animate={{ top: "110%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] z-20"
                            />
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">Access Granted</h3>
                        <p className="text-slate-500 text-xs font-mono font-bold uppercase tracking-[0.3em] mb-8">Neural Authorization Successful</p>
                    </motion.div>

                    {/* Data Readout Bar */}
                    <div className="w-full max-w-[240px] px-4 space-y-4">
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-blue-400/60 uppercase tracking-widest">
                            <span>Syncing Environment</span>
                            <span className="text-white">100%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                            />
                        </div>
                        
                        {/* Terminal Style Data */}
                        <div className="grid grid-cols-2 gap-2">
                             <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center">
                                 <span className="text-[8px] text-slate-600 font-bold uppercase">Node</span>
                                 <span className="text-[10px] text-slate-300 font-mono">AMS-01</span>
                             </div>
                             <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center">
                                 <span className="text-[8px] text-slate-600 font-bold uppercase">Status</span>
                                 <span className="text-[10px] text-emerald-400 font-mono">Secure</span>
                             </div>
                        </div>
                    </div>

                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
                </motion.div>
            )}
        </div>
      </div>
    </div>
  );
};

export default memo(LoginModal);
