
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircleIcon, RocketIcon, LockIcon } from './Icons';
import { playClickSound } from '../audio';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeConfirm?: () => void; 
}

const PAYMENT_URL = "https://checkout.dodopayments.com/buy/pdt_0NXcWUrrXKYkJIO2mR8D9?quantity=1&redirect_url=https://Templr-v9.vercel.app";

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onUpgradeConfirm }) => {
  const handleUpgrade = () => {
    playClickSound();
    
    // REDIRECT ONLY: Do not confirm upgrade yet. 
    // Pro status should only be granted after a successful payment verification.
    window.location.href = PAYMENT_URL;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 2147483647 }} // Absolute maximum Z-Index
        >
          
          {/* Backdrop */}
          <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#000]/95 backdrop-blur-xl"
              onClick={onClose}
          />

          {/* Modal */}
          <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#050505] border border-yellow-500/20 rounded-3xl overflow-hidden shadow-[0_0_100px_-20px_rgba(234,179,8,0.3)] z-50"
              onClick={(e) => e.stopPropagation()}
          >
              {/* Premium Gold Glow */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent shadow-[0_0_20px_2px_rgba(234,179,8,0.5)]"></div>
              <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors z-20"
              >
                  <XIcon className="w-5 h-5" />
              </button>

              <div className="p-8 flex flex-col items-center text-center relative z-10">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30 flex items-center justify-center mb-6 shadow-2xl relative group">
                      <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse"></div>
                      <LockIcon className="w-8 h-8 text-yellow-400 relative z-10" />
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Limit Reached</h2>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-[280px]">
                      You've used your <span className="text-white font-bold">3 free actions</span>. Upgrade to Templr Pro for unlimited access.
                  </p>

                  {/* Pricing Badge */}
                  <div className="mb-8 flex flex-col items-center">
                      <div className="px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold uppercase tracking-widest mb-2">
                          One-Time Payment
                      </div>
                      <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-white tracking-tighter">$10</span>
                          <span className="text-slate-500 text-sm font-medium">/ lifetime</span>
                      </div>
                  </div>

                  <div className="w-full space-y-3 mb-8">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <CheckCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300">Unlimited Source Code Downloads</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <CheckCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300">Access to Premium Assets</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <CheckCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300">Commercial License Included</span>
                      </div>
                  </div>

                  <button 
                      onClick={handleUpgrade}
                      className="group relative w-full h-14 rounded-xl overflow-hidden shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_-5px_rgba(234,179,8,0.6)] transition-all duration-300"
                  >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-500"></div>
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
                      <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-black uppercase tracking-widest text-xs h-full">
                          <RocketIcon className="w-4 h-4" />
                          Upgrade Now
                      </span>
                  </button>
                  
                  <p className="mt-4 text-[10px] text-slate-500">
                      Secure payment via Dodo Payments.
                  </p>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(SubscriptionModal);
