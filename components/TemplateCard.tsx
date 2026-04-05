
import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, EyeIcon, ArrowRightIcon, LockIcon, LayersIcon, GlobeIcon, FileCodeIcon, SmartphoneIcon, BookmarkIcon } from './Icons';
import { playClickSound, playLikeSound } from '../audio';

interface TemplateCardProps {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  imageUrl: string; 
  bannerUrl: string; 
  likes: number;
  views: number;
  isLiked: boolean;
  isFavorited: boolean;
  category: string;
  price?: string;
  
  fileUrl?: string;
  sourceCode?: string;
  fileType?: string;
  videoUrl?: string; 
  index: number; 

  onMessageCreator: (authorName: string) => void;
  onView: (id: string) => void;
  onLike: (id: string) => void;
  onFavorite: (id: string) => void;
  onCreatorClick?: (authorName: string) => void;
}

// --- VIDEO CONCURRENCY CONTROLLER ---
// Singleton manager to ensure only 3 videos play at once globally
class VideoController {
    private playing = new Set<string>();
    private listeners = new Map<string, (play: boolean) => void>();
    private max = 3;

    register(id: string, listener: (play: boolean) => void) {
        this.listeners.set(id, listener);
    }

    unregister(id: string) {
        this.listeners.delete(id);
        this.playing.delete(id);
    }

    requestPlay(id: string) {
        // If already playing, ignore
        if (this.playing.has(id)) return;

        // Add to active set
        this.playing.add(id);
        
        // Notify component to play
        this.listeners.get(id)?.(true);

        // Enforce Limit: Remove the oldest (FIFO)
        if (this.playing.size > this.max) {
            const oldestId = this.playing.values().next().value;
            if (oldestId && oldestId !== id) {
                this.playing.delete(oldestId);
                this.listeners.get(oldestId)?.(false); // Force pause
            }
        }
    }

    notifyHidden(id: string) {
        if (this.playing.has(id)) {
            this.playing.delete(id);
            this.listeners.get(id)?.(false); // Pause when hidden
        }
    }
}

const videoManager = new VideoController();


// Helper to downscale Unsplash images for thumbnails (huge performance win)
const getOptimizedImageUrl = (url: string | undefined | null, width = 600) => {
    if (!url) return null;
    if (url.includes('images.unsplash.com')) {
        if (url.includes('w=')) {
            return url.replace(/w=\d+/, `w=${width}`);
        }
        return `${url}&w=${width}`;
    }
    return url;
};

const gradients = [
    "from-blue-600 to-indigo-900",
    "from-emerald-600 to-teal-900",
    "from-purple-600 to-fuchsia-900",
    "from-rose-600 to-red-900",
    "from-amber-600 to-orange-900",
    "from-cyan-600 to-sky-900",
    "from-indigo-600 to-violet-900",
    "from-fuchsia-600 to-pink-900",
];

const getGradient = (str: string) => {
    const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
};

// Internal component for the heavy UI
const CardContent: React.FC<TemplateCardProps> = ({ 
  id,
  title, 
  author, 
  authorAvatar,
  imageUrl,
  bannerUrl, 
  likes, 
  views, 
  isLiked, 
  isFavorited,
  category, 
  price = 'Free', 
  fileUrl,
  sourceCode,
  fileType,
  videoUrl,
  index,
  onView, 
  onLike,
  onFavorite,
  onCreatorClick
}) => {
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [signedBanner, setSignedBanner] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null); // Lottie ref

  const isZip = fileType === 'zip';
  const hasCode = (sourceCode && sourceCode.trim().length > 0) || isZip;
  const hasLink = fileUrl && fileUrl.trim() !== '' && fileUrl !== '#' && !isZip;

  // Lottie Animation Logic
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
        if (isLiked) {
            player.setDirection(1);
            player.play();
        } else {
            player.setDirection(-1);
            player.play();
        }
    }
  }, [isLiked]);

  // Video Manager Registration
  useEffect(() => {
    videoManager.register(id, (shouldPlay) => {
        if (videoRef.current) {
            if (shouldPlay) {
                const promise = videoRef.current.play();
                if (promise !== undefined) {
                    promise.catch(() => {
                        // Autoplay prevented or aborted
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    });
    return () => videoManager.unregister(id);
  }, [id]);

  // Visibility Observer for Video Playback
  useEffect(() => {
    if (!videoRef.current || !videoUrl || videoError || !videoReady) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    videoManager.requestPlay(id);
                } else {
                    videoManager.notifyHidden(id);
                }
            });
        },
        { 
            threshold: 0.2,
            rootMargin: '50px 0px 50px 0px' // Slight pre-roll buffer
        } 
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [videoUrl, videoError, id, videoReady]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) playLikeSound();
    else playClickSound();
    onLike(id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation();
      playClickSound();
      onFavorite(id);
  };

  const handleViewButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    onView(id);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCreatorClick) {
          playClickSound();
          onCreatorClick(author);
      }
  };

  const rawBanner = bannerUrl || imageUrl;
  const displayBanner = getOptimizedImageUrl(rawBanner);
  const displayAvatar = authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=000&color=fff`;

  // Reset error state if the image URL changes (e.g., component reused)
  useEffect(() => {
      setImageError(false);
      setSignedBanner(null);
  }, [displayBanner]);

  const handleImageError = async () => {
      if (signedBanner) {
          // Already tried signed URL, give up
          setImageError(true);
          return;
      }

      // console.warn(`[TemplateCard] Image load failed for ${title}:`, displayBanner);

      if (displayBanner && displayBanner.includes('/storage/v1/object/public/')) {
          try {
              const pathParts = displayBanner.split('/storage/v1/object/public/')[1].split('/');
              const bucket = pathParts[0];
              const path = pathParts.slice(1).join('/');
              if (bucket && path) {
                  // Dynamically import api to avoid circular dependencies if any
                  const api = await import('../api');
                  const { data, error } = await api.supabase.storage.from(bucket).createSignedUrl(path, 31536000);
                  if (data?.signedUrl) {
                      // console.log("[TemplateCard] Attempting signed URL fallback for:", title);
                      setSignedBanner(data.signedUrl);
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
                          setSignedBanner(objectUrl);
                          return;
                      }
                  }
              }
          } catch (e) {
              // console.warn("[TemplateCard] Signed URL fallback failed:", e);
          }
      }
      
      setImageError(true);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.4, ease: "easeOut" } 
    },
    hover: { y: -8, transition: { type: "spring", stiffness: 400, damping: 25 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group relative w-full h-full bg-[#050505] cursor-default isolate overflow-hidden backface-hidden"
    >
        <div className="absolute inset-0 rounded-[24px] shadow-[0_0_0_1px_rgba(255,255,255,0.05)] z-0 pointer-events-none"></div>

        <div className="absolute inset-0 z-0 bg-[#111]">
            {/* Background Image (Always present as fallback/base) */}
            <div className="absolute inset-0 z-0 bg-zinc-900">
                {(signedBanner || displayBanner) && !imageError ? (
                    <img 
                        src={signedBanner || displayBanner!} 
                        alt={`${title} - ${category} Landing Page Template Preview`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            // Silently retry to avoid console spam
                            handleImageError();
                        }}
                        onLoad={() => console.log(`[TemplateCard] Loaded image for ${title}:`, signedBanner || displayBanner)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    // Fallback Gradient - Only if no image
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <div className="text-center p-4 opacity-10">
                            <LayersIcon className="w-12 h-12 text-white mx-auto mb-2" />
                        </div>
                    </div>
                )}
            </div>

            {/* Video Layer - Only show if valid AND ready */}
            {videoUrl && videoUrl.trim() !== '' && !videoError && (
                <div className={`absolute inset-0 z-10 bg-black transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <video 
                        ref={videoRef}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                        poster={signedBanner || displayBanner || undefined}
                        muted
                        loop
                        playsInline
                        preload="auto"
                        onLoadedData={() => {
                            console.log(`[TemplateCard] Video loaded for ${title}`);
                            setVideoReady(true);
                        }}
                        onError={(e) => {
                            console.error(`[TemplateCard] Video error for ${title}:`, videoUrl, e);
                            setVideoError(true);
                        }}
                    >
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 opacity-80 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none z-20"></div>
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 pointer-events-none">
             <div className="flex gap-2 pointer-events-auto">
                 <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
                    {category}
                 </div>
             </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 z-30 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none">
            <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-white font-bold text-xl leading-none truncate mb-2 group-hover:text-cyan-200 transition-colors drop-shadow-lg">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 pointer-events-auto cursor-pointer group/author w-fit" onClick={handleCreatorClick}>
                         <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/20">
                             <img 
                                src={displayAvatar} 
                                className="w-full h-full object-cover" 
                                alt={author} 
                                onError={(e) => { 
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('ui-avatars.com')) {
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=000&color=fff`; 
                                    }
                                }}
                             />
                         </div>
                         <p className="text-xs text-slate-300 font-medium tracking-wide group-hover/author:text-white">{author}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                     <button 
                        onClick={handleLike} 
                        className="group/btn w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all overflow-hidden"
                     >
                        <div 
                            className={`w-full h-full flex items-center justify-center p-[2px] transition-[filter] duration-300 ${
                                isLiked ? '' : 'grayscale brightness-150 opacity-70 group-hover/btn:opacity-100'
                            }`}
                        >
                            {/* @ts-ignore */}
                            <dotlottie-player
                                ref={playerRef}
                                src="https://lottie.host/c3e224ed-42e1-4283-96aa-2994ab046363/gMYruNTRma.lottie"
                                background="transparent"
                                speed="1"
                                loop={false} 
                                playMode="normal"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                     </button>
                     <button onClick={handleViewButton} className="group/btn w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:bg-slate-200 transition-all">
                         <ArrowRightIcon className="w-5 h-5" />
                     </button>
                </div>
            </div>
            
            <div className="mt-4 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
            
            <div className="flex justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <EyeIcon className="w-3 h-3" />
                        <span className="text-[10px] font-mono">{views >= 1000 ? (views/1000).toFixed(1) + 'k' : views}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <HeartIcon className="w-3 h-3" />
                        <span className="text-[10px] font-mono">{likes}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {hasCode && <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest flex items-center gap-1"><FileCodeIcon className="w-3 h-3" /> <span className="hidden sm:inline">Code</span></span>}
                    {hasLink && <span className="text-[10px] font-mono text-blue-400/80 uppercase tracking-widest flex items-center gap-1"><GlobeIcon className="w-3 h-3" /> <span className="hidden sm:inline">Live</span></span>}
                </div>
            </div>
        </div>
    </motion.div>
  );
};

// Main Component with Intersection Observer for Virtualization
// Optimized for "Instant Rendering" by mounting aggressively (800px buffer)
const TemplateCard: React.FC<TemplateCardProps> = (props) => {
    const [inView, setInView] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Buffer increased to 800px to ensure card mounts long before scrolling into view
                if (entry.isIntersecting) {
                    setInView(true);
                }
            },
            {
                root: null, // viewport
                rootMargin: '800px 0px 800px 0px', // Large mounting buffer
                threshold: 0
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="w-full aspect-[4/3] min-h-[280px] rounded-[24px] relative bg-[#050505] border border-white/5 overflow-hidden"
            style={{ contain: 'content' }} // Performance optimization hint
        >
            <CardContent {...props} />
        </div>
    );
};

export default memo(TemplateCard);
