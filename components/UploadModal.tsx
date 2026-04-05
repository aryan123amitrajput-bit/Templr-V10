
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, UploadIcon, ZipIcon, ShieldCheckIcon, CheckCircleIcon, FileCodeIcon, LinkIcon, GlobeIcon, LockIcon, LayersIcon, SmartphoneIcon } from './Icons';
import { playClickSound, playSuccessSound, playNotificationSound, playTypingSound } from '../audio';
import { uploadFile, NewTemplateData, Template } from '../api';
import { NotificationType } from './Notification';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (templateData: NewTemplateData) => Promise<void>;
  onDashboardClick: () => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  userEmail?: string;
  onShowNotification: (msg: string, type: NotificationType) => void;
  // Edit Props
  initialData?: Template | null;
  isEditing?: boolean;
}

const CATEGORY_OPTIONS = ['Portfolio', 'SaaS', 'E-commerce', 'Blog', 'Dashboard', 'Mobile', 'Landing Page', 'Admin', 'Social', 'Crypto'];
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Reliable fallback for background when video is processing or fails
const DEFAULT_VIDEO_THUMB = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const SectionLabel = ({ children, required, optional }: { children?: React.ReactNode, required?: boolean, optional?: boolean }) => (
  <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
    {children} 
    {required && <span className="text-red-400/80">*</span>}
    {optional && <span className="text-zinc-600 text-[10px] font-normal uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Optional</span>}
  </label>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) => (
  <input
    {...props}
    className={`w-full bg-[#18181b] border ${props.error ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700 focus:border-blue-500/50'} rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-sm`}
  />
);

const StyledTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) => (
  <textarea
    {...props}
    className={`w-full bg-[#18181b] border ${props.error ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700 focus:border-blue-500/50'} rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-sm resize-none`}
  />
);

const TagInput = ({ value, onChange, placeholder, maxTags = 5 }: { value: string[], onChange: (tags: string[]) => void, placeholder: string, maxTags?: number }) => {
    const [input, setInput] = useState('');
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            if (value.length < maxTags && !value.includes(input.trim())) {
                onChange([...value, input.trim()]);
                setInput('');
                playTypingSound();
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3 py-2 flex flex-wrap gap-2 focus-within:border-blue-500/50 transition-colors min-h-[42px]">
            {value.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-xs font-medium text-zinc-200 border border-zinc-700">
                    {tag}
                    <button onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-red-400"><XIcon className="w-3 h-3" /></button>
                </span>
            ))}
            <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ''}
                className="bg-transparent outline-none text-sm text-zinc-100 flex-1 min-w-[80px]"
            />
        </div>
    );
};

const PreviewUploader = ({ file, onSelect, error, type, initialUrl, isUploading }: { file: File | null, onSelect: (f: File) => void, error?: boolean, type: 'image' | 'video', initialUrl?: string, isUploading?: boolean }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            onSelect(selectedFile);
        }
    };

    const hasContent = !!file || !!initialUrl;
    const previewSrc = file ? URL.createObjectURL(file) : (initialUrl || null);

    return (
        <div 
            onClick={() => !isUploading && !file && !initialUrl && inputRef.current?.click()}
            className={`
                group relative w-full aspect-video bg-[#121214] rounded-2xl border-2 border-dashed 
                ${error ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800 hover:border-blue-500/40 hover:bg-[#18181b]'} 
                flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300
                ${isUploading ? 'cursor-not-allowed' : ''}
            `}
        >
            <input 
                ref={inputRef} 
                type="file" 
                accept={type === 'image' ? "image/*" : "video/mp4,video/webm"} 
                className="hidden" 
                onChange={handleFileChange} 
                disabled={isUploading}
            />
            
            {hasContent ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {type === 'image' ? (
                        <img 
                            key={previewSrc || 'empty'}
                            src={previewSrc || undefined} 
                            alt="Preview" 
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_VIDEO_THUMB; }}
                            className="w-full h-full object-contain" 
                        />
                    ) : (
                        <video 
                            key={previewSrc || 'empty'}
                            src={previewSrc || undefined} 
                            className="w-full h-full object-contain" 
                            loop 
                            controls={!isUploading}
                            playsInline
                        />
                    )}
                    
                    {/* Overlay Loading State */}
                    {isUploading && (
                        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest animate-pulse">Uploading Media...</p>
                        </div>
                    )}

                    {/* Change Button (Only when not uploading) */}
                    {!isUploading && (
                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                                className="px-4 py-2 bg-black/60 backdrop-blur border border-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-colors shadow-lg"
                             >
                                Replace
                             </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center p-6 relative z-10" onClick={() => !isUploading && inputRef.current?.click()}>
                    <div className="w-16 h-16 rounded-full bg-zinc-900/80 flex items-center justify-center mx-auto mb-4 border border-zinc-800 text-zinc-500 group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:scale-110 transition-all duration-300 shadow-xl">
                        {type === 'image' ? <LayersIcon className="w-7 h-7" /> : <UploadIcon className="w-7 h-7" />}
                    </div>
                    <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors uppercase tracking-wide">
                        Drop {type === 'image' ? 'Image' : 'Video'} Here
                    </p>
                    <p className="text-xs text-zinc-500 mt-2 font-mono">
                        {type === 'image' ? 'JPG, PNG • 1920x1080' : 'MP4, WebM • Max 20MB'}
                    </p>
                </div>
            )}
            
            {!hasContent && <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.4)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>}
        </div>
    );
};

const FileCard = ({ file, onRemove, isUploading }: { file: File, onRemove: () => void, isUploading?: boolean }) => (
    <div className="relative group flex items-center justify-between p-3 bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isUploading ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {isUploading ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <ZipIcon className="w-5 h-5" />
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${isUploading ? 'text-blue-400' : 'text-zinc-200'}`}>{file.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    {formatBytes(file.size)}
                    {isUploading && <span className="text-blue-500 font-bold">• Uploading...</span>}
                </p>
            </div>
        </div>
        
        {!isUploading && (
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-red-400 transition-colors"
                title="Remove File"
            >
                <XIcon className="w-4 h-4" />
            </button>
        )}
        
        {/* Progress Bar Animation (Simulated) */}
        {isUploading && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-900/30">
                <div className="h-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite] w-2/3"></div>
            </div>
        )}
    </div>
);

const UploadModal: React.FC<UploadModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddTemplate, 
    onDashboardClick,
    isLoggedIn, 
    onLoginRequest, 
    onShowNotification,
    initialData,
    isEditing = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [existingVideoUrl, setExistingVideoUrl] = useState('');

  const [codeMode, setCodeMode] = useState<'zip' | 'paste'>('zip');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [sourceCode, setSourceCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // "Uploading Video...", "Saving..."
  const [errors, setErrors] = useState<any>({});
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isOpen) {
          if (isEditing && initialData) {
              setTitle(initialData.title);
              setDescription(initialData.description || '');
              setCategory(initialData.category);
              setTags(initialData.tags || []);
              setLink(initialData.fileUrl && !initialData.fileUrl.endsWith('.zip') ? initialData.fileUrl : '');
              setExistingImageUrl(initialData.bannerUrl || '');
              setExistingVideoUrl(initialData.videoUrl || '');
              setPreviewType(initialData.videoUrl ? 'video' : 'image');
              setSourceCode(initialData.sourceCode || '');
              setCodeMode(initialData.sourceCode ? 'paste' : 'zip');
              setVisibility(initialData.status === 'approved' ? 'public' : 'private');
          } else {
              setTitle(''); setDescription(''); setCategory(''); setTags([]); 
              setLink(''); setVisibility('public'); 
              setPreviewType('image'); setPreviewFile(null); 
              setExistingImageUrl(''); setExistingVideoUrl('');
              setCodeMode('zip'); setZipFile(null); setSourceCode('');
          }
          setErrors({}); setIsSubmitting(false); setUploadStatus('');
      }
  }, [isOpen, isEditing, initialData]);

  const togglePreviewType = (type: 'image' | 'video') => {
      if (type !== previewType) {
          setPreviewType(type);
          setPreviewFile(null);
          playClickSound();
      }
  };

  const handleSubmit = async () => {
      if (!isLoggedIn) {
          return onLoginRequest();
      }

      const newErrors: any = {};
      if (!title.trim() || title.trim().length < 3) newErrors.title = true;
      if (!category) newErrors.category = true;
      
      if (!previewFile && !existingImageUrl && !existingVideoUrl) {
          newErrors.preview = true;
          onShowNotification("A preview is required.", 'error');
      }

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          playNotificationSound();
          return;
      }

      // Trigger instant navigation and notification
      onShowNotification("Uploading Template...", 'info');
      onDashboardClick();

      // Continue upload in background
      try {
          let imageUrl = existingImageUrl;
          let videoUrl = existingVideoUrl;

          if (previewFile) {
              if (previewType === 'video') {
                  const safeName = previewFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                  videoUrl = await uploadFile(previewFile, `videos/${Date.now()}_${safeName}`);
                  if (!imageUrl) imageUrl = DEFAULT_VIDEO_THUMB;
              } else {
                  const safeName = previewFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                  imageUrl = await uploadFile(previewFile, `images/${Date.now()}_${safeName}`);
                  videoUrl = ''; 
              }
          }

          let zipUrl = '';
          if (zipFile) {
              const safeName = zipFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              zipUrl = await uploadFile(zipFile, `templates/${Date.now()}_${safeName}`);
          } else if (isEditing && initialData?.fileUrl?.endsWith('.zip')) {
              zipUrl = initialData.fileUrl;
          }

          await onAddTemplate({
              title,
              description,
              category,
              tags: tags || [],
              externalLink: link,
              imageUrl,
              videoUrl,
              bannerUrl: imageUrl,
              galleryImages: [imageUrl],
              price: 'Free', 
              fileUrl: zipUrl, 
              sourceCode: codeMode === 'paste' ? sourceCode : '',
              fileName: zipFile?.name || (isEditing ? initialData?.fileName : 'design-assets'),
              fileType: zipUrl ? 'zip' : (sourceCode ? 'code' : (link ? 'link' : 'image')),
              fileSize: zipFile?.size || 0,
              initialStatus: visibility === 'public' ? 'approved' : 'draft'
          });

          playSuccessSound();
          onShowNotification(isEditing ? "Updated successfully!" : "Published successfully!", 'success');
          onClose(); // Close modal only after upload is finished
      } catch (e: any) {
          playNotificationSound();
          onShowNotification(e.message || "Operation failed", 'error');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={isSubmitting ? undefined : onClose}>
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        />

        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl bg-[#09090b] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-[#09090b] flex-shrink-0">
                <h2 className="text-2xl font-bold text-white tracking-tight">{isEditing ? 'Edit Asset' : 'Submit Work'}</h2>
                <p className="text-sm text-zinc-500 mt-1">{isEditing ? 'Update details and files.' : 'Share your design with the world.'}</p>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors" disabled={isSubmitting}>
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-8 bg-[#09090b]">
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <SectionLabel required>Preview Media</SectionLabel>
                        <div className="flex bg-[#121214] rounded-lg p-1 border border-zinc-800">
                            <button onClick={() => !isSubmitting && togglePreviewType('image')} disabled={isSubmitting} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${previewType === 'image' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Image</button>
                            <button onClick={() => !isSubmitting && togglePreviewType('video')} disabled={isSubmitting} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${previewType === 'video' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Video</button>
                        </div>
                    </div>
                    
                    <PreviewUploader 
                        type={previewType}
                        file={previewFile} 
                        initialUrl={previewType === 'image' ? existingImageUrl : existingVideoUrl}
                        onSelect={(f) => { setPreviewFile(f); playClickSound(); }} 
                        error={errors.preview}
                        isUploading={isSubmitting && !!previewFile}
                    />
                </section>

                <section className="space-y-5">
                    <div>
                        <SectionLabel required>Title</SectionLabel>
                        <StyledInput value={title} onChange={e => setTitle(e.target.value)} error={errors.title} disabled={isSubmitting} />
                    </div>
                    <div>
                        <SectionLabel optional>Description</SectionLabel>
                        <StyledTextarea rows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <SectionLabel required>Category</SectionLabel>
                            <div className="relative">
                                <select className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100" value={category} onChange={e => setCategory(e.target.value)} disabled={isSubmitting}>
                                    <option value="" disabled>Select</option>
                                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <SectionLabel optional>Tags</SectionLabel>
                            <TagInput value={tags} onChange={setTags} placeholder="Add..." />
                        </div>
                    </div>
                </section>

                <section className="p-5 rounded-xl bg-[#121214] border border-white/5">
                    <SectionLabel optional>Live Demo Link</SectionLabel>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <StyledInput style={{ paddingLeft: '2.5rem' }} value={link} onChange={e => setLink(e.target.value)} disabled={isSubmitting} />
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <SectionLabel optional>Source Code</SectionLabel>
                        <div className="flex bg-[#121214] rounded-lg p-1 border border-zinc-800">
                            <button onClick={() => setCodeMode('zip')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${codeMode === 'zip' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Zip</button>
                            <button onClick={() => setCodeMode('paste')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${codeMode === 'paste' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Paste</button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 overflow-hidden">
                        {codeMode === 'zip' ? (
                            <>
                                {zipFile ? (
                                    <FileCard 
                                        file={zipFile} 
                                        onRemove={() => { setZipFile(null); playClickSound(); }} 
                                        isUploading={isSubmitting && !!zipFile}
                                    />
                                ) : (
                                    <div onClick={() => !isSubmitting && zipInputRef.current?.click()} className={`h-32 bg-[#121214] flex flex-col items-center justify-center cursor-pointer hover:bg-[#18181b] transition-colors border border-dashed border-transparent hover:border-zinc-700 m-1 rounded-lg ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}>
                                        <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={e => { setZipFile(e.target.files?.[0] || null); playClickSound(); }} disabled={isSubmitting} />
                                        <div className="text-center">
                                            <UploadIcon className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                                            <p className="text-zinc-400 text-xs font-bold uppercase">Upload Zip File</p>
                                            {isEditing && initialData?.fileUrl?.endsWith('.zip') && <p className="text-[10px] text-zinc-600 mt-1">(Existing file will be kept if empty)</p>}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <textarea value={sourceCode} onChange={e => setSourceCode(e.target.value)} className="w-full h-32 bg-[#0c0c0e] p-4 font-mono text-xs text-zinc-300 outline-none resize-none" placeholder="Paste code here..." disabled={isSubmitting} />
                        )}
                    </div>
                </section>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#09090b] flex justify-end gap-3">
                <button onClick={handleSubmit} disabled={isSubmitting} className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg ${isSubmitting ? 'opacity-90 cursor-wait' : ''}`}>
                    {isSubmitting && <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>}
                    {uploadStatus || (isEditing ? 'Update Asset' : 'Publish Asset')}
                </button>
            </div>
        </motion.div>
    </div>
  );
};

export default React.memo(UploadModal);
