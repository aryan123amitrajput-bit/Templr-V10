
import React, { useEffect, useState } from 'react';
import { XIcon, CheckCircleIcon, ShieldCheckIcon, LightbulbIcon } from './Icons';
import { playNotificationSound, playClickSound } from '../audio';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type?: NotificationType;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'info', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    playNotificationSound();

    // AUTO DISMISS RULES:
    // Success: Dismiss after 5s
    // Error: NEVER dismiss (User must acknowledge)
    // Info: Dismiss after 8s
    
    let timer: ReturnType<typeof setTimeout>;
    
    if (type === 'success') {
        timer = setTimeout(() => handleClose(), 5000);
    } else if (type === 'info') {
        timer = setTimeout(() => handleClose(), 8000);
    }

    return () => clearTimeout(timer);
  }, [type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow animation to finish
  };

  const styles = {
      success: "from-emerald-900/90 to-emerald-950/90 border-emerald-500/30 text-emerald-200",
      error: "from-red-900/90 to-red-950/90 border-red-500/30 text-red-200",
      info: "from-blue-900/90 to-blue-950/90 border-blue-500/30 text-blue-200"
  };

  const icons = {
      success: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
      error: <ShieldCheckIcon className="w-5 h-5 text-red-400" />,
      info: <LightbulbIcon className="w-5 h-5 text-blue-400" />
  };

  return (
    <div 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[120] w-full max-w-md px-4 transition-all duration-500 ease-spring ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
    >
      <div 
        className={`relative rounded-2xl p-[1px] bg-gradient-to-br ${type === 'error' ? 'from-red-500/40 to-transparent' : type === 'success' ? 'from-emerald-500/40 to-transparent' : 'from-blue-500/40 to-transparent'} shadow-2xl backdrop-blur-xl`}
      >
        <div className={`
            flex items-center gap-4 bg-gradient-to-b ${styles[type]} 
            rounded-2xl px-5 py-3 border border-t-[1px] shadow-inner
        `}>
          <div className="flex-shrink-0">
             {icons[type]}
          </div>
          
          <p className="flex-1 text-sm font-medium leading-snug drop-shadow-md">
            {message}
          </p>
          
          <button
            onClick={() => { playClickSound(); handleClose(); }}
            className="p-2 -mr-2 rounded-full hover:bg-black/20 text-white/40 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Notification);
