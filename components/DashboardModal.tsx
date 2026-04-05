
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, LayersIcon, ShieldCheckIcon, CpuIcon, UploadIcon, LightbulbIcon } from './Icons';
import { Template, listenForUserTemplates, deleteTemplate } from '../api';
import { playClickSound, playSuccessSound, playNotificationSound } from '../audio';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | undefined;
  onEdit?: (template: Template) => void;
}

// --- CONSTANTS ---
const MAX_STORAGE_MB = 10000; 

// --- UTILS ---
const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
};

// --- COMPONENTS ---

const UsageRing = ({ current, label }: { current: number, label: string }) => {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-4 border-blue-500/20 flex items-center justify-center">
                    <LayersIcon className="w-6 h-6 text-blue-400" />
                </div>
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white font-mono text-2xl font-bold">
                    {current}
                </p>
            </div>
        </div>
    );
};

const StorageBar = ({ used, max }: { used: number, max: number }) => {
    const percentage = Math.min((used / (max * 1024 * 1024)) * 100, 100);
    const isCrit = percentage > 90;

    return (
        <div className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
             <div className="flex justify-between items-end mb-2">
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cloud Storage</p>
                 <p className="text-[10px] text-slate-400 font-mono">
                     {formatSize(used)} <span className="text-slate-600">/</span> {max/1000} GB
                 </p>
             </div>
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isCrit ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                 />
             </div>
        </div>
    );
};

const CapacityProjection = ({ usedBytes, templateCount }: { usedBytes: number, templateCount: number }) => {
    const avgSizeBytes = templateCount > 0 ? usedBytes / templateCount : 5 * 1024 * 1024;
    const totalCapacityBytes = MAX_STORAGE_MB * 1024 * 1024;
    const remainingBytes = totalCapacityBytes - usedBytes;
    const estimatedRemaining = Math.max(0, Math.floor(remainingBytes / avgSizeBytes));

    return (
        <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent border border-blue-500/20 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20"><CpuIcon className="w-8 h-8 text-blue-400" /></div>
            
            <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <LightbulbIcon className="w-3 h-3" /> Projection
            </p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">~{estimatedRemaining}</span>
                <span className="text-[10px] text-slate-400">{estimatedRemaining === 1 ? 'more upload' : 'more uploads'}</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Based on your avg size of {formatSize(avgSizeBytes)}</p>
        </div>
    );
};

const DashboardTemplateCard: React.FC<{ template: Template, onDelete: () => void, onEdit?: () => void }> = ({ template, onDelete, onEdit }) => {
    const [imageError, setImageError] = useState(false);
    const [signedBanner, setSignedBanner] = useState<string | null>(null);
    
    useEffect(() => {
        setImageError(false);
        setSignedBanner(null);
    }, [template.bannerUrl]);

    const handleImageError = async () => {
        if (signedBanner) {
            setImageError(true);
            return;
        }

        if (template.bannerUrl && template.bannerUrl.includes('/storage/v1/object/public/')) {
            try {
                const pathParts = template.bannerUrl.split('/storage/v1/object/public/')[1].split('/');
                const bucket = pathParts[0];
                const path = pathParts.slice(1).join('/');
                if (bucket && path) {
                    const api = await import('../api');
                    const { data } = await api.supabase.storage.from(bucket).createSignedUrl(path, 31536000);
                    if (data?.signedUrl) {
                        setSignedBanner(data.signedUrl);
                        return;
                    } else {
                        const { data: blobData } = await api.supabase.storage.from(bucket).download(path);
                        if (blobData) {
                            const objectUrl = URL.createObjectURL(blobData);
                            setSignedBanner(objectUrl);
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
    
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'pending_review': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Live';
            case 'pending_review': return 'In Review';
            case 'rejected': return 'Changes Requested';
            default: return status;
        }
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
        >
            <div className="flex p-4 gap-4">
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                    {!imageError ? (
                        <img 
                            src={signedBanner || template.bannerUrl} 
                            onError={handleImageError}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        />
                    ) : (
                        <LayersIcon className="w-8 h-8 text-white/10" />
                    )}
                    {template.status === 'approved' && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                             <h4 className="text-white font-bold text-sm truncate pr-4">{template.title}</h4>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                                className="text-slate-600 hover:text-red-400 transition-colors z-30"
                                title="Delete Asset"
                             >
                                 <XIcon className="w-4 h-4" />
                             </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{template.category}</p>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                        <div className="flex gap-3">
                             <div className="flex flex-col">
                                 <span className="text-[9px] text-slate-600 uppercase font-bold">Views</span>
                                 <span className="text-xs text-slate-300 font-mono">{template.views}</span>
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-[9px] text-slate-600 uppercase font-bold">Likes</span>
                                 <span className="text-xs text-slate-300 font-mono">{template.likes}</span>
                             </div>
                        </div>
                        <div className={`
                            px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border
                            ${getStatusStyle(template.status)}
                        `}>
                            {getStatusLabel(template.status)}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Quick Actions overlay */}
            <div className="absolute inset-0 z-20 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                    className="px-5 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wide rounded-lg transform scale-95 group-hover:scale-100 transition-all hover:bg-slate-200 shadow-lg"
                >
                    Edit
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="px-5 py-2.5 bg-red-500/20 text-red-200 border border-red-500/30 text-xs font-bold uppercase tracking-wide rounded-lg transform scale-95 group-hover:scale-100 transition-all hover:bg-red-500 hover:text-white shadow-lg flex items-center gap-2"
                >
                    <ShieldCheckIcon className="w-3 h-3" /> Delete
                </button>
            </div>
        </motion.div>
    );
};

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose, userEmail, onEdit }) => {
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isOpen && userEmail) {
        setIsLoading(true);
        unsubscribe = listenForUserTemplates(userEmail, (data) => {
            setMyTemplates(data);
            setIsLoading(false);
        }).unsubscribe;
    }
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [isOpen, userEmail]);

  const confirmDelete = (id: string) => {
      const template = myTemplates.find(t => t.id === id);
      if (template) {
          playClickSound();
          setTemplateToDelete(template);
          setDeleteError(null);
      }
  };

  const executeDelete = async () => {
      if (templateToDelete) {
          playClickSound();
          setIsProcessing(true);
          try {
              setMyTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
              await deleteTemplate(templateToDelete.id);
              setTemplateToDelete(null);
              playSuccessSound();
          } catch (e: any) {
              playNotificationSound();
              setDeleteError(e.message || "Could not delete asset. Ensure you have ownership permissions.");
          } finally {
              setIsProcessing(false);
          }
      }
  };

  const handleEdit = (template: Template) => {
      playClickSound();
      if(onEdit) onEdit(template);
  };

  const storageUsed = myTemplates.reduce((acc, t) => acc + (t.fileSize || 0), 0);

  return (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-6" onClick={onClose}>
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                    className="relative w-full max-w-5xl h-full md:h-[85vh] bg-[#030304] border border-white/10 rounded-none md:rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* CONFIRMATION */}
                    <AnimatePresence>
                        {templateToDelete && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                                onClick={() => !isProcessing && setTemplateToDelete(null)}
                            >
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-[#0F1115] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500 border border-red-500/20">
                                        <ShieldCheckIcon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Delete Asset?</h3>
                                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                        This will permanently delete <br/><span className="text-white font-bold">‘{templateToDelete.title}’</span>.
                                    </p>
                                    
                                    {deleteError && (
                                        <p className="text-[10px] text-red-400 mb-4 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 w-full text-center font-bold">
                                            {deleteError}
                                        </p>
                                    )}

                                    <div className="flex gap-3 w-full">
                                        <button 
                                            onClick={() => setTemplateToDelete(null)}
                                            disabled={isProcessing}
                                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeDelete}
                                            disabled={isProcessing}
                                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="flex-shrink-0 p-6 md:p-8 border-b border-white/5 bg-[#030304] flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Creator Dashboard</h2>
                            <p className="text-slate-400 text-sm">Manage assets & monitor cloud capacity.</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <XIcon className="w-4 h-4"/>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 p-6 md:p-8 bg-[#050505] border-b border-white/5">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex flex-col sm:flex-row gap-4 flex-[2]">
                                <UsageRing current={myTemplates.length} label={myTemplates.length === 1 ? "Total Asset" : "Total Assets"} />
                                <StorageBar used={storageUsed} max={MAX_STORAGE_MB} />
                                <CapacityProjection usedBytes={storageUsed} templateCount={myTemplates.length} />
                            </div>
                            
                            <div className="flex flex-col justify-center border-l border-white/5 pl-0 lg:pl-6 w-full lg:w-auto">
                                <button 
                                    onClick={() => { onClose(); }}
                                    className={`
                                        h-14 lg:h-full px-8 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full lg:w-auto
                                        bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.15)]
                                    `}
                                >
                                    <UploadIcon className="w-4 h-4" />
                                    <span>Upload New</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-[#030304]">
                         {isLoading ? (
                             <div className="flex items-center justify-center h-40">
                                 <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                             </div>
                         ) : myTemplates.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                     <LayersIcon className="w-8 h-8 text-slate-500" />
                                 </div>
                                 <h3 className="text-white font-bold text-lg mb-2">No templates yet</h3>
                                 <p className="text-slate-500 text-sm max-w-xs mx-auto">Upload your first design to start earning.</p>
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {myTemplates.map(t => (
                                     <DashboardTemplateCard 
                                        key={t.id} 
                                        template={t} 
                                        onDelete={() => confirmDelete(t.id)} 
                                        onEdit={() => handleEdit(t)}
                                     />
                                 ))}
                             </div>
                         )}
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#050505] flex justify-between items-center text-[10px] text-slate-600 font-mono">
                        <span>TEMPLR STUDIO v6.0</span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Systems Normal</span>
                        </div>
                    </div>

                </motion.div>
            </div>
        )}
    </AnimatePresence>
  );
};

export default DashboardModal;
