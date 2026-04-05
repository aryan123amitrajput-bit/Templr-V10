
import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircleIcon, MapPinIcon, LinkIcon } from './Icons';
import TemplateCard from './TemplateCard';
import { Template, fixUrl } from '../api';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string | null;
  templates: Template[];
  onView: (template: Template) => void;
  onLike: (templateId: string) => void;
  onFavorite: (templateId: string) => void;
  likedIds: Set<string>;
  favoriteIds: Set<string>;
}

const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  creatorName, 
  templates,
  onView,
  onLike,
  onFavorite,
  likedIds,
  favoriteIds
}) => {
  
  const creatorTemplates = useMemo(() => {
    if (!creatorName) return [];
    return templates.filter(t => t.author === creatorName);
  }, [creatorName, templates]);

  // Try to find the real avatar from one of the templates
  const avatar_url = useMemo(() => {
      const raw = creatorTemplates.find(t => t.authorAvatar)?.authorAvatar;
      return raw ? fixUrl(raw) : null;
  }, [creatorTemplates]);

  // Try to find the real banner from one of the templates
  const banner_url = useMemo(() => {
      const raw = creatorTemplates.find(t => t.authorBanner)?.authorBanner;
      return raw ? fixUrl(raw) : null;
  }, [creatorTemplates]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !creatorName) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-6" onClick={onClose}>
        
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#000]/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0 }}
            className="relative w-full max-w-[80rem] h-full md:h-[90vh] bg-[#050505] border border-white/10 rounded-none md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            
            {/* --- HEADER SECTION --- */}
            <div className="relative h-64 md:h-80 flex-shrink-0 overflow-hidden">
                {/* Banner Image */}
                {banner_url && (
                    <div className="absolute inset-0">
                        <img 
                            src={banner_url} 
                            alt={`${creatorName} banner`}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]"></div>
                    </div>
                )}

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Profile Info Container */}
                <div className="absolute bottom-0 inset-x-0 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    
                    <div className="flex items-end gap-6">
                        {/* Avatar */}
                        <div className="relative group">
                             <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                             <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1">
                                {avatar_url ? (
                                    <img 
                                        src={avatar_url} 
                                        alt={creatorName}
                                        className="w-full h-full rounded-full object-cover border border-white/10"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center border border-white/10">
                                        <span className="text-2xl font-bold text-zinc-700">{creatorName.charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                             </div>
                             <div className="absolute bottom-1 right-1 bg-black rounded-full p-1">
                                 <CheckCircleIcon className="w-6 h-6 text-blue-400" />
                             </div>
                        </div>

                        {/* Text Info */}
                        <div className="mb-2">
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">{creatorName}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-medium">
                                <span className="text-white bg-white/10 px-3 py-1 rounded-full border border-white/5">Verified Creator</span>
                                <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> Global</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats removed as requested */}

                </div>
            </div>

            {/* --- BODY CONTENT --- */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row border-t border-white/5 bg-[#050505]">
                
                {/* Sidebar (Bio & Links) */}
                <div className="w-full md:w-80 p-8 border-r border-white/5 bg-[#080808]/50 flex-shrink-0 overflow-y-auto">
                    <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">About</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-light">
                            Digital creator on Templr. Check out my portfolio of templates below.
                        </p>
                    </div>

                    {/* Follow button removed as requested */}
                </div>

                {/* Main Grid (Templates) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#020202]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white">Portfolio <span className="text-slate-500 ml-2 text-sm font-normal">({creatorTemplates.length})</span></h3>
                        
                        {/* Simple Sort/Filter Mock */}
                        <div className="flex gap-2">
                             <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white border border-white/10">All</span>
                             <span className="px-3 py-1 rounded-full bg-transparent text-[10px] font-bold text-slate-500 border border-white/5 hover:border-white/20 cursor-pointer">Popular</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {creatorTemplates.map((template, idx) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <TemplateCard 
                                    {...template}
                                    index={idx}
                                    isLiked={likedIds.has(template.id)}
                                    isFavorited={favoriteIds.has(template.id)}
                                    onMessageCreator={() => {}} // No chat inside profile
                                    onView={() => onView(template)}
                                    onLike={() => onLike(template.id)}
                                    onFavorite={() => onFavorite(template.id)}
                                    // Disable recursion
                                    onCreatorClick={() => {}}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(CreatorProfileModal);
