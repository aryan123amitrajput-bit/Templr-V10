
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CameraIcon, CheckCircleIcon } from './Icons';
import { playClickSound, playSuccessSound, playNotificationSound } from '../audio';
import { updateUserProfile, uploadFile, Session } from '../api';
import { NotificationType } from './Notification';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  onShowNotification: (msg: string, type: NotificationType) => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    session, 
    onShowNotification 
}) => {
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initial Load
  useEffect(() => {
      if (isOpen && session) {
          setFullName(session.user.user_metadata?.full_name || '');
          setAvatarPreview(session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session.user.email}&background=333&color=fff`);
          setBannerPreview(session.user.user_metadata?.banner_url || null);
          setAvatarFile(null);
          setBannerFile(null);
      }
  }, [isOpen, session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              onShowNotification("Image size too large (Max 5MB)", 'error');
              return;
          }
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
          playClickSound();
      }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              onShowNotification("Image size too large (Max 5MB)", 'error');
              return;
          }
          setBannerFile(file);
          setBannerPreview(URL.createObjectURL(file));
          playClickSound();
      }
  };

  const handleSave = async () => {
      if (!session) return;
      setIsLoading(true);
      playClickSound();

      try {
          let avatarUrl = session.user.user_metadata?.avatar_url;
          let bannerUrl = session.user.user_metadata?.banner_url;

          // 1. Upload new avatar if selected
          if (avatarFile) {
              const path = `avatars/${session.user.id}_${Date.now()}.png`;
              avatarUrl = await uploadFile(avatarFile, path);
          }

          // 2. Upload new banner if selected
          if (bannerFile) {
              const path = `avatars/${session.user.id}_banner_${Date.now()}.png`;
              bannerUrl = await uploadFile(bannerFile, path);
          }

          // 3. Update Profile
          await updateUserProfile({
              full_name: fullName,
              avatar_url: avatarUrl,
              banner_url: bannerUrl
          });

          playSuccessSound();
          onShowNotification("Profile updated successfully!", 'success');
          
          // Force a reload after short delay to refresh all UI components with new avatar
          setTimeout(() => {
              window.location.reload();
          }, 1000);
          
          onClose();
      } catch (e: any) {
          playNotificationSound();
          onShowNotification(e.message || "Failed to update profile", 'error');
      } finally {
          setIsLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
        />

        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            {/* Header Close Button */}
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => { playClickSound(); onClose(); }} className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white rounded-full transition-all">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Banner Section */}
            <div className="relative w-full h-48 sm:h-56 bg-zinc-900 group cursor-pointer overflow-hidden" onClick={() => bannerInputRef.current?.click()}>
                {bannerPreview ? (
                    <img 
                        src={bannerPreview} 
                        alt="Banner" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent blur-2xl"></div>
                    </div>
                )}
                
                {/* Banner Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <CameraIcon className="w-4 h-4" />
                        <span>Change Cover</span>
                    </div>
                </div>
                
                <input 
                    ref={bannerInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleBannerChange}
                />
            </div>

            {/* Content Section */}
            <div className="px-6 sm:px-8 pb-8 pt-0 relative flex-1 flex flex-col">
                
                {/* Avatar Section (Overlapping) */}
                <div className="relative -mt-16 sm:-mt-20 mb-6 flex justify-between items-end">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-32 h-32 sm:w-40 sm:h-40 rounded-full cursor-pointer shadow-2xl border-4 border-[#0a0a0a] bg-zinc-800 overflow-hidden"
                    >
                        {avatarPreview ? (
                            <img 
                                src={avatarPreview} 
                                alt="Avatar" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <CameraIcon className="w-8 h-8" />
                            </div>
                        )}
                        
                        {/* Avatar Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                            <CameraIcon className="w-8 h-8 text-white transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                        </div>
                        
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6 flex-1">
                    <div>
                        <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">Profile Details</h2>
                        <p className="text-sm text-zinc-400">Personalize how you appear to others.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Display Name</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="mt-8 pt-6 border-t border-white/5 flex gap-3 justify-end">
                    <button 
                        onClick={() => { playClickSound(); onClose(); }}
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className={`
                            px-8 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg
                            ${isLoading ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-white text-black hover:bg-zinc-200 hover:scale-[0.98] active:scale-[0.95]'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>

            </div>
        </motion.div>
    </div>
  );
};

export default React.memo(ProfileSettingsModal);
