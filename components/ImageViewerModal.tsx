
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, HeartIcon, EyeIcon, LockIcon, CheckCircleIcon, GlobeIcon, ArrowRightIcon, UploadIcon, ArrowLeftIcon, FileCodeIcon, LinkIcon, LayersIcon, RocketIcon } from './Icons';
import { Template } from '../api';
import { playClickSound, playSuccessSound, playNotificationSound } from '../audio';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onUsageAttempt: () => boolean; 
  onOpenSubscription: () => void;
  usageCount: number;
  isSubscribed: boolean;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ 
    isOpen, 
    onClose, 
    template, 
    onUsageAttempt, 
    onOpenSubscription,
    usageCount, 
    isSubscribed 
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [imageError, setImageError] = useState(false);
  const [signedImage, setSignedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (template) {
        setActiveTab('preview');
        setImageError(false);
    }
  }, [template]);

  const displayImage = template?.bannerUrl || template?.imageUrl;

  useEffect(() => {
      setImageError(false);
      setSignedImage(null);
  }, [displayImage]);

  // STRICT LIMIT CHECK
  const actionsLeft = Math.max(0, 3 - usageCount);
  const isLimitReached = !isSubscribed && (usageCount >= 3 || actionsLeft === 0);

  const handleVisitLive = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // UI GUARD: First Line of Defense
      if (isLimitReached) {
          playNotificationSound();
          onOpenSubscription();
          return;
      }

      // STORAGE GUARD: Second Line of Defense
      const canProceed = onUsageAttempt();
      if (!canProceed) return; 

      if (template?.fileUrl && template.fileUrl !== '#') {
          playClickSound();
          let url = template.fileUrl;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
          }
          window.open(url, '_blank');
      }
  };

  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (isLimitReached) {
          playNotificationSound();
          onOpenSubscription();
          return;
      }

      const canProceed = onUsageAttempt();
      if (!canProceed) return;

      playClickSound();
      playSuccessSound();
      
      if (template?.fileType === 'zip' && template.fileUrl) {
          const link = document.createElement('a');
          link.href = template.fileUrl;
          link.download = template.fileName || 'project-files.zip';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } 
      else if (template?.sourceCode) {
          const blob = new Blob([template.sourceCode], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const cleanTitle = template.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
          link.download = `${cleanTitle}.tsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (isLimitReached) {
          playNotificationSound();
          onOpenSubscription();
          return;
      }

      if (!onUsageAttempt()) return;
      
      if (template?.sourceCode) {
          navigator.clipboard.writeText(template.sourceCode);
          playSuccessSound();
      }
  };
  
  if (!template) return null;

  const rawCode = template.sourceCode || '';
  const isZip = template.fileType === 'zip';
  const hasCode = (rawCode.trim().length > 0) || isZip;
  const rawUrl = template.fileUrl || '';
  const hasLink = !!rawUrl && rawUrl.trim() !== '' && rawUrl !== '#' && !isZip;

  const handleImageError = async () => {
      if (signedImage) {
          setImageError(true);
          return;
      }

      if (displayImage && displayImage.includes('/storage/v1/object/public/')) {
          try {
              const pathParts = displayImage.split('/storage/v1/object/public/')[1].split('/');
              const bucket = pathParts[0];
              const path = pathParts.slice(1).join('/');
              if (bucket && path) {
                  const api = await import('../api');
                  const { data } = await api.supabase.storage.from(bucket).createSignedUrl(path, 31536000);
                  if (data?.signedUrl) {
                      console.log("Using signed URL fallback for modal:", template.title);
                      setSignedImage(data.signedUrl);
                      return;
                  } else {
                      // Try download as last resort
                      const { data: blobData } = await api.supabase.storage.from(bucket).download(path);
                      if (blobData) {
                          // Fix for "application/octet-stream" issues on old uploads
                          let mimeType = blobData.type;
                          if (!mimeType || mimeType === 'application/octet-stream') {
                              const ext = path.split('.').pop()?.toLowerCase();
                              if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                              else if (ext === 'png') mimeType = 'image/png';
                              else if (ext === 'webp') mimeType = 'image/webp';
                              else if (ext === 'gif') mimeType = 'image/gif';
                          }
                          
                          const correctedBlob = blobData.slice(0, blobData.size, mimeType);
                          const objectUrl = URL.createObjectURL(correctedBlob);
                          setSignedImage(objectUrl);
                          return;
                      }
                  }
              }
          } catch (e) {
              console.warn("Signed URL fallback failed:", e);
          }
      }
      
      setImageError(true);
  };
  
  return (
    <AnimatePresence>
    {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-0 md:p-6" onClick={onClose}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#000]/95 backdrop-blur-md" />
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[110]" />

            <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onClick={onClose} className="fixed top-6 left-6 z-[100] px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white transition-all flex items-center gap-2 group active:scale-90">
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back</span>
            </motion.button>

            {/* --- VISIBLE HEADER BADGE (REDUNDANCY) --- */}
            {!isSubscribed ? (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-6 right-6 z-[120] px-4 py-2 bg-black/80 border border-cyan-500/30 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                >
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-1 h-3 rounded-full ${i <= actionsLeft ? 'bg-cyan-400' : 'bg-slate-700'}`}></div>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{actionsLeft}/3 FREE</span>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-6 right-6 z-[120] px-4 py-2 bg-black/80 border border-yellow-500/30 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                >
                    <RocketIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">UNLIMITED</span>
                </motion.div>
            )}

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }}
                transition={{ type: "spring", duration: 0.6, bounce: 0 }}
                className="relative w-full max-w-[95rem] h-full md:h-[90vh] bg-[#050505] border border-white/10 rounded-none md:rounded-[32px] overflow-hidden flex flex-col lg:flex-row group/modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* --- LEFT: PREVIEW AREA --- */}
                <div className="relative flex-1 h-[45vh] lg:h-full bg-[#020203] flex flex-col overflow-hidden">
                    
                    {hasCode && (
                        <div className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
                            <div className="flex bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-1 pointer-events-auto">
                                <button onClick={() => setActiveTab('preview')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>Preview</button>
                                <button onClick={() => setActiveTab('code')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>
                                    Code
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 lg:p-20">
                        <AnimatePresence mode="wait">
                            {activeTab === 'preview' ? (
                                <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full h-full flex items-center justify-center">
                                    {template.videoUrl && template.videoUrl.trim() !== '' ? (
                                        <div className="relative w-full h-full max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl bg-black">
                                            <video 
                                                src={template.videoUrl} 
                                                className="w-full h-full object-contain" 
                                                controls 
                                                autoPlay 
                                                muted 
                                                loop 
                                                controlsList="nodownload"
                                                poster={signedImage || displayImage || undefined}
                                            />
                                        </div>
                                    ) : (
                                        (signedImage || displayImage) && !imageError ? (
                                            <img 
                                                src={signedImage || displayImage} 
                                                alt={`${template.title} - ${template.category} Landing Page Template Preview`} 
                                                onError={handleImageError}
                                                className="w-auto h-auto max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-600">
                                                <LayersIcon className="w-16 h-16 mb-4 opacity-20" />
                                                <p className="text-sm font-medium opacity-40">Preview Image Unavailable</p>
                                            </div>
                                        )
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="code" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full max-w-5xl bg-[#0A0A0A] rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                                    <div className="h-12 bg-[#111] border-b border-white/5 flex items-center px-4 gap-4">
                                        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/50"></div><div className="w-3 h-3 rounded-full bg-yellow-500/50"></div><div className="w-3 h-3 rounded-full bg-green-500/50"></div></div>
                                        <span className="text-slate-500 text-xs font-mono">source_code_snapshot.tsx</span>
                                        <div className="ml-auto flex gap-2">
                                            <button 
                                                onClick={handleCopyCode} 
                                                className={`text-[10px] flex items-center gap-1 bg-white/5 px-2 py-1 rounded transition-colors ${isLimitReached ? 'text-zinc-600 hover:text-zinc-500' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                {isLimitReached ? <LockIcon className="w-3 h-3" /> : null}
                                                {isLimitReached ? 'Unlock to Copy' : 'Copy Code'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto p-6 font-mono text-xs text-slate-300 custom-scrollbar whitespace-pre-wrap leading-relaxed bg-[#050505] relative">
                                        {isLimitReached ? (
                                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-sm">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                                                    <LockIcon className="w-6 h-6 text-slate-500" />
                                                </div>
                                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Source Code Locked</p>
                                                <button onClick={() => onOpenSubscription()} className="px-6 py-2 bg-white text-black text-xs font-bold uppercase rounded-full hover:bg-slate-200 transition-colors">
                                                    Unlock with Pro
                                                </button>
                                            </div>
                                        ) : (
                                            template.sourceCode || "// No source code provided."
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- RIGHT: INFO AREA --- */}
                <div className="w-full lg:w-[420px] h-[55vh] lg:h-full bg-[#09090b] border-l border-white/10 flex flex-col z-30 shadow-2xl">
                    <div className="p-6 md:p-8 pb-4 border-b border-white/5 bg-[#09090b]">
                        <div className="flex justify-between mb-4">
                            <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{template.category}</span>
                            <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold uppercase"><CheckCircleIcon className="w-3 h-3" /> Verified</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4 line-clamp-2">{template.title}</h1>
                        <div className="flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=${template.author}&background=333&color=fff`} alt={`${template.author} avatar`} className="w-8 h-8 rounded-full" />
                            <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold uppercase">Creator</span><span className="text-sm font-bold text-white">{template.author}</span></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 pb-40">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                <HeartIcon className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                                <span className="text-lg font-bold text-white block">{template.likes}</span>
                                <span className="text-[10px] text-slate-500 uppercase">Likes</span>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                <EyeIcon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <span className="text-lg font-bold text-white block">{template.views}</span>
                                <span className="text-[10px] text-slate-500 uppercase">Views</span>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest border-b border-white/5 pb-1">Description</h2>
                            <p className="text-sm text-slate-300 leading-relaxed font-light">{template.description}</p>
                        </div>

                        {hasLink && (
                            <div>
                                <h2 className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest border-b border-white/5 pb-1">External Links</h2>
                                <div className="space-y-2">
                                     <button 
                                        onClick={handleVisitLive}
                                        className={`
                                            w-full flex items-center justify-between p-3 rounded-xl border transition-all group relative overflow-hidden
                                            ${isLimitReached 
                                                ? 'bg-zinc-900/50 border-zinc-800 opacity-80 hover:bg-zinc-900 hover:border-zinc-700 cursor-not-allowed' 
                                                : 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40 cursor-pointer'}
                                        `}
                                     >
                                        <div className="flex items-center gap-3 relative z-10">
                                            {isLimitReached ? <LockIcon className="w-4 h-4 text-zinc-500" /> : <GlobeIcon className="w-4 h-4 text-blue-400" />}
                                            <span className={`text-sm font-medium truncate max-w-[200px] ${isLimitReached ? 'text-zinc-500' : 'text-slate-200'}`}>
                                                {isSubscribed ? rawUrl : (isLimitReached ? 'Link Locked (Upgrade)' : 'Protected Link')}
                                            </span>
                                        </div>
                                        <ArrowRightIcon className={`w-4 h-4 transition-transform relative z-10 ${isLimitReached ? 'text-zinc-600' : 'text-blue-500 group-hover:translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {template.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded bg-white/5 text-[10px] text-slate-400">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* --- ACTION BAR --- */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#09090b] border-t border-white/10 z-40 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-end items-end mb-4">
                            {!isSubscribed && (
                                <div className="flex flex-col items-end">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Actions Left</p>
                                    
                                    {/* --- 3 GIANT BARS --- */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3].map(i => (
                                                <div 
                                                    key={i} 
                                                    className={`
                                                        w-2.5 h-8 rounded-sm transition-all duration-300
                                                        ${i <= actionsLeft 
                                                            ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]' 
                                                            : 'bg-white/5 border border-white/5'
                                                        }
                                                    `}
                                                />
                                            ))}
                                        </div>
                                        <span className={`text-lg font-mono font-bold tracking-tight ${isLimitReached ? 'text-red-500' : 'text-cyan-400'}`}>
                                            {actionsLeft}/3
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                {hasLink && (
                                    <button 
                                        onClick={handleVisitLive}
                                        className={`h-14 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all border group relative overflow-hidden
                                        ${hasCode ? 'flex-1' : 'w-full'}
                                        ${isLimitReached 
                                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800' 
                                            : 'bg-white text-black hover:bg-slate-200 border-transparent'}`}
                                    >
                                        {isLimitReached ? <LockIcon className="w-4 h-4" /> : <GlobeIcon className="w-4 h-4" />}
                                        <span className="flex flex-col leading-none items-start">
                                            <span>Live Preview {isSubscribed ? '' : `(${actionsLeft})`}</span>
                                        </span>
                                        {isLimitReached && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>}
                                    </button>
                                )}

                                {hasCode && (
                                    <button 
                                        onClick={handleDownload} 
                                        className={`h-14 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all border group relative overflow-hidden
                                        ${hasLink ? 'flex-1' : 'w-full'}
                                        ${isLimitReached 
                                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800' 
                                            : 'bg-white text-black hover:bg-slate-200 border-transparent'}`}
                                    >
                                        {isLimitReached ? <LockIcon className="w-4 h-4" /> : <UploadIcon className="w-4 h-4 rotate-180" />}
                                        <span className="flex flex-col leading-none items-start">
                                            <span>Download {isSubscribed ? '' : `(${actionsLeft})`}</span>
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )}
    </AnimatePresence>
  );
};

export default React.memo(ImageViewerModal);
