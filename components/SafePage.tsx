import React from 'react';
import { motion } from 'framer-motion';

interface SafePageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const SafePage: React.FC<SafePageProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Mobile Background Image */}
      <div className="block md:hidden absolute inset-0 z-0">
        <img 
          src="https://i.ibb.co/G4b0j4FM/1773488950133-019cec2d-33f7-7f07-8fec-cfb7474cd0d1.png" 
          alt="Network Error" 
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* PC Background Image */}
      <div className="hidden md:block absolute inset-0 z-0">
        <img 
          src="https://i.ibb.co/39cPTf3X/1773488596042.png" 
          alt="Network Error" 
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Interactive Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full w-full pb-24 md:pb-32 px-6">
        {/* We add a subtle gradient at the bottom to ensure the button is visible if the image is bright */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent -z-10 pointer-events-none" />
        
        {error && (
          <p className="text-white/50 text-sm mb-6 max-w-md text-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
            {error.message || "An unexpected error occurred."}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (resetErrorBoundary) {
              resetErrorBoundary();
            } else {
              window.location.href = '/';
            }
          }}
          className="px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-full font-bold tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all"
        >
          {resetErrorBoundary ? "Try Again" : "Return Home"}
        </motion.button>
      </div>
    </div>
  );
};

export default SafePage;
