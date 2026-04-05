
import React, { useState, useEffect, useCallback } from 'react';
import TemplateCard from './TemplateCard';
import { Template, getPublicTemplates, isApiConfigured } from '../api';
import { playClickSound } from '../audio';
import { SearchIcon, NoResultsIcon, XIcon, FilterIcon, SortIcon, ArrowRightIcon } from './Icons';
import { ScrollReveal } from './ScrollReveal';
import { BorderBeam } from './ui/BorderBeam';
import { motion, AnimatePresence } from 'framer-motion';

const filters = ['All', 'Popular', 'Newest', 'Portfolio', 'E-commerce', 'SaaS', 'Blog'];

interface TemplateGalleryProps {
  templates: Template[]; 
  initialCategory?: string;
  onMessageCreator: (creatorName: string) => void;
  onView: (template: Template) => void;
  onLike: (templateId: string) => void;
  onFavorite: (templateId: string) => void;
  onCreatorClick?: (creatorName: string) => void;
  isLoading: boolean;
  likedIds: Set<string>; 
  favoriteIds: Set<string>;
  isLoggedIn: boolean; 
}

type SortOption = 'newest' | 'popular' | 'likes';

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
    templates: initialTemplates,
    initialCategory = 'All',
    onMessageCreator, 
    onView, 
    onLike, 
    onFavorite,
    onCreatorClick, 
    isLoading: initialLoading,
    likedIds,
    favoriteIds,
    isLoggedIn
}) => {
  const [activeFilter, setActiveFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isSearching, setIsSearching] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('template-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Real Data State
  const [data, setData] = useState<Template[]>(initialTemplates);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Sync initial templates if provided
  useEffect(() => {
      if (initialTemplates) {
          console.log(`[Gallery] Received ${initialTemplates.length} templates from parent`);
          setData(initialTemplates);
          // If we receive a fresh batch (likely page 0), reset pagination state for consistency
          if (initialTemplates.length <= 6) {
              setPage(0);
          }
      }
  }, [initialTemplates]);

  useEffect(() => {
    setActiveFilter(initialCategory);
  }, [initialCategory]);

  // Debounce Search
  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(searchQuery);
          if(searchQuery !== debouncedSearch) {
              setPage(0); // Reset page on new search
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Logic
  const fetchData = useCallback(async (reset = false, retryCount = 0) => {
      setIsFetching(true);
      const currentPage = reset ? 0 : page;
      
      try {
          const { data: newTemplates, hasMore: more, error } = await getPublicTemplates(
              currentPage, 
              6, // Limit to 6 items per load
              debouncedSearch, 
              activeFilter, 
              sortBy
          );

          const msg = error?.toLowerCase() || '';
          if (error && (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out')) && retryCount < 2) {
              console.warn(`Gallery fetch failed, retrying... (${retryCount + 1})`);
              setTimeout(() => fetchData(reset, retryCount + 1), 1000);
              return;
          }

          if (reset) {
              setData(newTemplates);
          } else {
              setData(prev => {
                  // Filter out duplicates
                  const existingIds = new Set(prev.map(t => t.id));
                  const uniqueNew = newTemplates.filter(t => !existingIds.has(t.id));
                  return [...prev, ...uniqueNew];
              });
          }
          setHasMore(more);
      } catch (e: any) {
          const msg = e.message?.toLowerCase() || '';
          if (retryCount < 2 && (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out'))) {
              console.warn(`Gallery fetch exception, retrying... (${retryCount + 1})`);
              setTimeout(() => fetchData(reset, retryCount + 1), 1000);
          } else {
              if (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out')) {
                  console.warn("Gallery Fetch Error:", e.message);
              } else {
                  console.error("Gallery Fetch Error", e);
              }
          }
      } finally {
          setIsFetching(false);
      }
  }, [page, debouncedSearch, activeFilter, sortBy]);

  // Trigger Fetch on Filter Changes
  useEffect(() => {
      if (activeFilter !== 'All' || debouncedSearch !== '' || sortBy !== 'newest') {
          setPage(0);
          fetchData(true);
      }
  }, [debouncedSearch, activeFilter, sortBy]);

  // Load More Handler
  useEffect(() => {
      if (page > 0) fetchData(false);
  }, [page]);

  const handleLoadMore = useCallback(() => {
      setPage(prev => prev + 1);
  }, []);

  const handleFilterClick = useCallback((filter: string) => {
    playClickSound();
    setActiveFilter(filter);
  }, []);

  // --- STABLE HANDLERS FOR MEMOIZATION ---
  
  const handleLocalLike = useCallback((id: string) => {
      if (!isLoggedIn) {
          onLike(id);
          return;
      }

      // Optimistic update
      const isCurrentlyLiked = likedIds.has(id);
      setData(current => current.map(t => {
          if (t.id === id) {
              return {
                  ...t,
                  likes: isCurrentlyLiked ? Math.max(0, t.likes - 1) : t.likes + 1
              }; 
          }
          return t;
      }));
      
      onLike(id);
  }, [isLoggedIn, onLike, likedIds]); // Added likedIds to deps

  const handleView = useCallback((id: string) => {
      const t = data.find(item => item.id === id);
      if (t) onView(t);
  }, [data, onView]);

  const handleCreatorClick = useCallback((name: string) => {
      if(onCreatorClick) onCreatorClick(name);
  }, [onCreatorClick]);

  return (
    <section id="gallery" className="py-32 relative z-10 bg-black">
      <h2 className="sr-only">Explore UI Templates and Landing Pages</h2>
      <div className="container mx-auto px-6 md:px-12 max-w-[90rem]">
        
        {/* Floating Filter Dock */}
        <ScrollReveal>
            <div className="sticky top-24 z-40 flex justify-center mb-24 px-4 w-full">
                <div className={`
                    relative group transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                    flex flex-col w-full max-w-4xl
                `}>
                    
                    {/* Primary Bar */}
                    <div className={`
                        relative p-2 bg-[#050505]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl 
                        flex flex-col md:flex-row gap-2 w-full
                        shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]
                        ${isFocused ? 'scale-[1.01] border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]' : 'hover:border-white/10'}
                        z-20
                    `}>
                        <BorderBeam size={200} duration={8} delay={0} borderWidth={1} colorFrom="#3b82f6" colorTo="#a855f7" className="opacity-70" />
                        
                        {/* Search Input */}
                        <div className="relative flex-1 group/search">
                            <div className={`
                                relative h-12 flex items-center rounded-xl border transition-all duration-300 overflow-hidden px-4
                                ${isFocused ? 'bg-black border-blue-500/30' : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}
                            `}>
                                <SearchIcon className={`w-5 h-5 mr-3 transition-colors duration-300 ${isFocused ? 'text-blue-400' : 'text-slate-500'}`} />
                                <input 
                                    id="template-search-input"
                                    type="text" 
                                    placeholder="Search templates, tags, creators..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    className="w-full h-full bg-transparent text-sm font-medium text-white placeholder-slate-500 focus:outline-none"
                                />
                                <div className="flex items-center gap-2">
                                    {isFetching && (
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
                                        />
                                    )}
                                    {!searchQuery && !isFocused && (
                                        <div className="hidden md:flex items-center px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-slate-500 font-mono">
                                            /
                                        </div>
                                    )}
                                    {searchQuery && (
                                        <button 
                                            onClick={() => { setSearchQuery(''); playClickSound(); }}
                                            className="p-1 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors animate-fade-in"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Results Count Badge */}
                            <AnimatePresence>
                                {debouncedSearch && !isFetching && data.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="absolute -top-6 right-4 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-tighter"
                                    >
                                        {data.length}{hasMore ? '+' : ''} Results
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Trending Tags Dropdown */}
                            <AnimatePresence>
                                {isFocused && !searchQuery && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                                        className="absolute top-full left-0 right-0 mt-2 p-4 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trending Searches</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Modern Dashboard', 'SaaS Landing', 'Dark Mode', 'Portfolio', 'E-commerce'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent blur
                                                        setSearchQuery(tag);
                                                        playClickSound();
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/10 text-[11px] text-slate-400 hover:text-blue-400 transition-all duration-200"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="block w-[1px] my-3 bg-white/10 mx-1"></div>

                        {/* Quick Filter Toggles */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
                            {filters.slice(0, 4).map((filter) => (
                                <button
                                key={filter}
                                onClick={() => handleFilterClick(filter)}
                                className={`
                                    relative px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden
                                    ${activeFilter === filter
                                    ? 'text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                                `}
                                >
                                    <span className="relative z-10">{filter}</span>
                                    {activeFilter === filter && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-100"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Filter Toggle */}
                        <button 
                            onClick={() => { playClickSound(); setShowFilters(!showFilters); }}
                            className={`
                                relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center
                                ${showFilters ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}
                            `}
                        >
                             <FilterIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Expanded Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.3, ease: 'circOut' }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 p-6 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block flex items-center gap-2">
                                                <SortIcon className="w-3 h-3" /> Sort By
                                            </label>
                                            {(sortBy !== 'newest' || activeFilter !== 'All' || searchQuery) && (
                                                <button 
                                                    onClick={() => {
                                                        setSortBy('newest');
                                                        setActiveFilter('All');
                                                        setSearchQuery('');
                                                        playClickSound();
                                                    }}
                                                    className="text-[9px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    Reset All
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {(['newest', 'popular', 'likes'] as SortOption[]).map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => { playClickSound(); setSortBy(option); }}
                                                    className={`
                                                        px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all
                                                        ${sortBy === option 
                                                            ? 'bg-white text-black border-white' 
                                                            : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}
                                                    `}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2 pt-6 border-t border-white/5">
                                         <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
                                            Categories
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {filters.map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => handleFilterClick(filter)}
                                                    className={`
                                                        px-3 py-1.5 rounded-full text-[11px] font-medium transition-all
                                                        ${activeFilter === filter
                                                            ? 'bg-white/10 text-white shadow-inner'
                                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                                                    `}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ScrollReveal>

        {/* Grid */}
        {data.length === 0 && !isFetching && !initialLoading ? (
            <ScrollReveal>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center border border-white/5 rounded-[2rem] bg-gradient-to-b from-white/[0.02] to-transparent p-12">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500 border border-white/5 shadow-inner">
                        <NoResultsIcon className="w-8 h-8 opacity-50" />
                    </div>
                    
                    {!isApiConfigured ? (
                        <>
                            <h4 className="text-xl font-bold text-white mb-2 tracking-tight">Database Not Connected</h4>
                            <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
                                Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.
                            </p>
                        </>
                    ) : (searchQuery || activeFilter !== 'All') ? (
                        <>
                            <h4 className="text-xl font-bold text-white mb-2 tracking-tight">No results found</h4>
                            <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
                                We couldn't find any templates matching "{searchQuery}" with filter "{activeFilter}".
                            </p>
                            <button 
                                onClick={() => { setSearchQuery(''); setActiveFilter('All'); playClickSound(); }}
                                className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Clear Filters
                            </button>
                        </>
                    ) : (
                        <>
                            <h4 className="text-xl font-bold text-white mb-2 tracking-tight">No templates yet</h4>
                            <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
                                Be the first to upload a template to the community!
                            </p>
                            {isLoggedIn && (
                                <button 
                                    onClick={() => { 
                                        const uploadBtn = document.querySelector('[data-upload-trigger="true"]') as HTMLElement;
                                        if(uploadBtn) uploadBtn.click();
                                        // Fallback if trigger not found
                                        const event = new CustomEvent('templr-open-upload');
                                        window.dispatchEvent(event);
                                    }}
                                    className="px-8 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                >
                                    Upload Template
                                </button>
                            )}
                        </>
                    )}
                </div>
            </ScrollReveal>
        ) : (
            <div className="flex flex-col items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12 w-full">
                {(isFetching && page === 0) || initialLoading ? (
                    // Initial Loading Skeletons
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="w-full aspect-[4/3] rounded-[24px] bg-[#050505] border border-white/5 animate-pulse"></div>
                    ))
                ) : (
                    data.map((template, index) => (
                        <TemplateCard 
                            key={template.id} 
                            id={template.id}
                            title={template.title}
                            author={template.author}
                            authorAvatar={template.authorAvatar}
                            imageUrl={template.imageUrl}
                            bannerUrl={template.bannerUrl}
                            likes={template.likes}
                            views={template.views}
                            category={template.category}
                            price={template.price}
                            fileUrl={template.fileUrl}
                            sourceCode={template.sourceCode}
                            fileType={template.fileType}
                            videoUrl={template.videoUrl}
                            index={index}
                            isLiked={likedIds.has(template.id)}
                            isFavorited={favoriteIds.has(template.id)}
                            onMessageCreator={onMessageCreator}
                            onView={handleView}
                            onLike={handleLocalLike}
                            onFavorite={onFavorite}
                            onCreatorClick={handleCreatorClick}
                        />
                    ))
                )}
                </div>

                {/* Load More */}
                {hasMore && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-20"
                    >
                        <div className={`button-container ${isFetching ? 'is-loading' : ''}`}>
                            <div className="glow-effect"></div>
                            <button 
                                className="obsidian-btn"
                                onClick={handleLoadMore}
                                disabled={isFetching}
                            >
                                <span className="btn-text">
                                    {isFetching ? 'Loading...' : 'Load More'}
                                </span>
                                <div className="obsidian-spinner"></div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(TemplateGallery);
