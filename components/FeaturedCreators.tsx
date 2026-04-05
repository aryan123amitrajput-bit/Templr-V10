
import React, { useEffect, useState, useCallback } from 'react';
import { playClickSound } from '../audio';
import { ScrollReveal } from './ScrollReveal';
import { CheckCircleIcon, RocketIcon } from './Icons';
import { getFeaturedCreators, CreatorStats } from '../api';

interface FeaturedCreatorsProps {
  onCreatorClick?: (creatorName: string) => void;
}

const FeaturedCreators: React.FC<FeaturedCreatorsProps> = ({ onCreatorClick }) => {
  const [creators, setCreators] = useState<CreatorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async (retryCount = 0) => {
        try {
            const data = await getFeaturedCreators();
            setCreators(data);
        } catch (e: any) {
            const msg = e.message?.toLowerCase() || '';
            if (retryCount < 2 && (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out'))) {
                console.warn(`Featured creators fetch failed, retrying... (${retryCount + 1})`);
                setTimeout(() => fetchCreators(retryCount + 1), 1500);
            } else {
                if (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out')) {
                    console.warn("Featured creators fetch failed:", e.message);
                } else {
                    console.error(e);
                }
            }
        } finally {
            setLoading(false);
        }
    };
    fetchCreators();
  }, []);

  const handleCardClick = useCallback((name: string) => {
    if (onCreatorClick) {
        playClickSound();
        onCreatorClick(name);
    }
  }, [onCreatorClick]);

  if (!loading && creators.length === 0) {
      // Don't show section if no data
      return null;
  }

  return (
    <section className="py-32 bg-[#000] border-t border-white/[0.05] relative overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[500px] bg-white/[0.02] blur-[150px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 max-w-[90rem] relative z-10">
        
        <ScrollReveal>
            <div className="flex flex-col items-center text-center mb-24">
                <span className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
                    Verified Talent
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">Featured Creators</h2>
                <p className="text-slate-400 max-w-lg mx-auto text-lg font-light leading-relaxed">
                    Top performing architects of the digital future.
                </p>
            </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
              // Skeletons
              Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="h-[420px] rounded-[32px] bg-[#050505] border border-white/5 animate-pulse"></div>
              ))
          ) : (
              creators.map((creator, index) => (
                <ScrollReveal key={creator.email || `${creator.name}-${index}`} staggerIndex={index}>
                    <div 
                        onClick={() => handleCardClick(creator.name)}
                        className="group relative h-[420px] rounded-[32px] cursor-pointer transition-transform duration-500 hover:-translate-y-2"
                    >
                        {/* Container & Border */}
                        <div className="absolute inset-0 rounded-[32px] p-[1px] bg-gradient-to-b from-white/30 via-white/5 to-transparent shadow-[0_0_25px_-5px_rgba(255,255,255,0.07)] group-hover:shadow-[0_0_35px_-5px_rgba(255,255,255,0.15)] transition-shadow duration-500">
                            
                            {/* Inner Background */}
                            <div className="relative h-full w-full bg-[#000] rounded-[31px] overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#3a3a3a_0%,#000000_60%)] group-hover:bg-[radial-gradient(circle_at_50%_0%,#4a4a4a_0%,#000000_65%)] transition-all duration-700"></div>
                                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-90"></div>

                                {/* Content */}
                                <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                                    
                                    {/* Avatar */}
                                    <div className="relative w-24 h-24 mb-6 group-hover:scale-105 transition-transform duration-500">
                                        <div className="absolute inset-0 rounded-full border border-white/10 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]"></div>
                                        <img 
                                            src={creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=333&color=fff`} 
                                            alt={creator.name} 
                                            onError={(e) => { 
                                                const target = e.target as HTMLImageElement;
                                                if (!target.src.includes('ui-avatars.com')) {
                                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=333&color=fff`; 
                                                }
                                            }}
                                            className="w-full h-full rounded-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
                                         />
                                        <div className="absolute bottom-0 right-0 bg-[#1a1a1a] rounded-full p-1 border border-white/10 shadow-lg">
                                            <CheckCircleIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-slate-200 transition-colors">{creator.name}</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-8">{creator.role}</p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-8 border-t border-white/5 pt-6 w-full justify-center relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-white font-mono drop-shadow-sm">{creator.totalLikes}</span>
                                            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Likes</span>
                                        </div>
                                        
                                        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-white font-mono drop-shadow-sm">{creator.templateCount}</span>
                                            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Assets</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
              ))
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(FeaturedCreators);
