
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import TemplateGallery from './components/TemplateGallery';
import FeaturedCreators from './components/FeaturedCreators';
import CTA from './components/CTA';
import Footer from './components/Footer';
import UploadModal from './components/UploadModal';
import ImageViewerModal from './components/ImageViewerModal';
import DashboardModal from './components/DashboardModal';
import LoginModal from './components/LoginModal';
import CreatorProfileModal from './components/CreatorProfileModal';
import SetupGuideModal from './components/SetupGuideModal';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import SubscriptionModal from './components/SubscriptionModal';
import DocumentationModal from './components/DocumentationModal';
import Notification, { NotificationType } from './components/Notification';
import ContactFloat from './components/ContactFloat';
import * as api from './api';
import { playOpenModalSound, playCloseModalSound, playSuccessSound, setSoundEnabled, getSoundEnabled, playNotificationSound, playClickSound } from './audio';
import type { Session, Template, NewTemplateData } from './api';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';

import { useSEO } from './hooks/useSEO';

// NUCLEAR KEY ROTATION - V12 STRICT
// Double-lock enforcement: UI Guard + Storage Guard.
const LIMIT_MAX = 3;
const USAGE_KEY = 'templr_usage_v12_strict'; 
const PRO_KEY = 'templr_pro_v12_strict';

const LazySection: React.FC<{ children: React.ReactNode; minHeight?: string }> = ({ children, minHeight = "800px" }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [hasRendered, setHasRendered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setHasRendered(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRendered(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [isDesktop]);

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} style={{ minHeight: hasRendered ? 'auto' : minHeight }}>
      {hasRendered ? children : null}
    </div>
  );
};

const App: React.FC = () => {
  // --- UI STATE ---
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDashboardOpen, setDashboardOpen] = useState(false); 
  const [isLoginModalOpen, setLoginModalOpen] = useState(false); 
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [isSetupOpen, setSetupOpen] = useState(false);
  const [isProfileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [isDocumentationOpen, setDocumentationOpen] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [viewingCreator, setViewingCreator] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(false);

  // --- DATA STATE ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  
  // --- SUBSCRIPTION STATE ---
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // --- BOOT STATE ---
  const [showSplash, setShowSplash] = useState(true);

  // --- PERSISTENT STATE ---
  const [likedTemplateIds, setLikedTemplateIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('templr_liked_ids');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) { return new Set(); }
  });

  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('templr_favorites');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) { return new Set(); }
  });

  const [viewedTemplateIds, setViewedTemplateIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('templr_viewed_ids');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) { return new Set(); }
  });

  const [usageCount, setUsageCount] = useState<number>(0);
  const [initialRouteHandled, setInitialRouteHandled] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>('All');

  // SEO for Homepage vs Template Page
  const currentSEO = useMemo(() => {
    if (viewingTemplate) {
      const displayImage = viewingTemplate.bannerUrl || viewingTemplate.imageUrl;
      return {
        title: `${viewingTemplate.title} - ${viewingTemplate.category} Landing Page Template`,
        description: `Download the ${viewingTemplate.title} ${viewingTemplate.category} template by ${viewingTemplate.author}. Explore real landing page designs and UI templates on Templr.`,
        url: `https://templr-v9.vercel.app/templates/${viewingTemplate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${viewingTemplate.id}`,
        image: displayImage,
        type: 'article',
        schema: {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": viewingTemplate.title,
          "author": {
            "@type": "Person",
            "name": viewingTemplate.author
          },
          "image": displayImage,
          "description": viewingTemplate.description || `Download the ${viewingTemplate.title} ${viewingTemplate.category} template by ${viewingTemplate.author}.`
        }
      };
    }

    return {
      title: 'Templr - Download Real Landing Page Templates',
      description: 'Discover, explore, and download real landing page templates. Templr is the platform for designers and developers to find high-quality UI templates for SaaS, startups, and portfolios.',
      url: 'https://templr-v9.vercel.app/',
      type: 'website',
      schema: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Templr",
        "url": "https://templr-v9.vercel.app/",
        "description": "Discover, explore, and download real landing page templates.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://templr-v9.vercel.app/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    };
  }, [viewingTemplate]);

  useSEO(currentSEO);

  const loadTemplates = useCallback(async (retryCount = 0) => {
    setIsLoading(true);
    try {
      const { data, error } = await api.getPublicTemplates(0, 6);
      const msg = error?.toLowerCase() || '';
      if (error && (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out')) && retryCount < 2) {
          console.warn(`Initial load failed, retrying... (${retryCount + 1})`);
          setTimeout(() => loadTemplates(retryCount + 1), 1500);
          return;
      }
      setTemplates(data);
    } catch (e: any) {
      const msg = e.message?.toLowerCase() || '';
      if (retryCount < 2 && (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out'))) {
          console.warn(`Initial load failed, retrying... (${retryCount + 1})`);
          setTimeout(() => loadTemplates(retryCount + 1), 1500);
      } else {
          if (msg.includes('fetch') || msg.includes('timeout') || msg.includes('timed out')) {
              console.warn("Error loading templates:", e.message);
          } else {
              console.error("Error loading templates:", e);
          }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync state to storage
  useEffect(() => {
      try {
          localStorage.setItem(USAGE_KEY, usageCount.toString());
      } catch(e) {}
  }, [usageCount]);

  // --- INITIALIZATION ---
  useEffect(() => {
    let mounted = true;

    try {
        const currentPro = localStorage.getItem(PRO_KEY) === 'true';
        if (mounted) setIsSubscribed(currentPro);
    } catch(e) {}

    const splashTimer = setTimeout(() => {
        if (mounted) setShowSplash(false);
    }, 1800);

    setSoundEnabledState(getSoundEnabled());

    const initAuth = async () => {
        try {
            const subscription = api.onAuthStateChange((_event, session) => {
                if (mounted) setSession(session);
            });
            return subscription;
        } catch (e) {
            return null;
        }
    };

    const initData = async () => {
        if (mounted) await loadTemplates();
    };

    window.addEventListener('templr-data-update', (e: any) => {
        if (e.detail?.type === 'delete') {
            setTemplates(prev => prev.filter(t => t.id !== e.detail.id));
        }
    });

    window.addEventListener('templr-open-upload', () => {
        setUploadModalOpen(true);
        setEditingTemplate(null);
    });

    const authSubPromise = initAuth();
    initData();

    return () => {
        mounted = false;
        clearTimeout(splashTimer);
        authSubPromise.then(sub => sub?.unsubscribe());
    };
  }, []);

  // Handle URL Routing
  useEffect(() => {
    if (initialRouteHandled || templates.length === 0) return;

    const path = window.location.pathname;
    
    // Handle category URLs
    const categoryMatch = path.match(/^\/([a-z0-9-]+)-templates\/?$/i);
    if (categoryMatch) {
      const catSlug = categoryMatch[1].toLowerCase();
      const catMap: Record<string, string> = {
        'saas': 'SaaS',
        'startup': 'Startup', // Assuming 'Startup' is a category, but filters are ['All', 'Popular', 'Newest', 'Portfolio', 'E-commerce', 'SaaS', 'Blog']
        'portfolio': 'Portfolio',
        'e-commerce': 'E-commerce',
        'blog': 'Blog',
        'ai-landing-page': 'AI', // Map as needed
        'dark-ui': 'Dark UI'
      };
      if (catMap[catSlug]) {
        setInitialCategory(catMap[catSlug]);
      }
    }

    // Handle template URLs
    if (path.startsWith('/templates/')) {
      const parts = path.split('/');
      const slugId = parts[2]; // e.g., saas-landing-page-123
      if (slugId) {
        const idMatch = slugId.match(/-([a-f0-9-]+)$/i);
        const id = idMatch ? idMatch[1] : slugId;
        
        const template = templates.find(t => t.id === id);
        if (template) {
          setViewingTemplate(template);
          setViewerOpen(true);
        } else {
          api.getTemplateById(id).then(t => {
            if (t) {
              setViewingTemplate(t);
              setViewerOpen(true);
            }
          });
        }
      }
    }
    
    setInitialRouteHandled(true);
  }, [templates, initialRouteHandled]);

  // Session Sync Logic
  useEffect(() => {
    if (session) {
        // STRICT SOURCE OF TRUTH: If logged in, the Cloud Session is the ONLY truth.
        // We ignore localStorage 'true' if the cloud says 'false'.
        // This prevents stale Pro state from persisting across accounts.
        const cloudPro = session.user.user_metadata?.is_pro === true;
        
        setIsSubscribed(cloudPro);
        
        if (cloudPro) {
            localStorage.setItem(PRO_KEY, 'true');
        } else {
            localStorage.removeItem(PRO_KEY);
        }

        const remoteUsage = session.user.user_metadata?.usage_count;
        const localUsage = parseInt(localStorage.getItem(USAGE_KEY) || '0');
        const maxUsage = Math.max(
            typeof remoteUsage === 'number' ? remoteUsage : 0, 
            !isNaN(localUsage) ? localUsage : 0
        );
        if (maxUsage > usageCount) {
            setUsageCount(maxUsage);
        }
    } else {
        // If logged out, we trust local storage (for anonymous pro users, if any)
        const localPro = localStorage.getItem(PRO_KEY);
        setIsSubscribed(localPro === 'true');
    }
  }, [session]);

  const handleUsageAttempt = (): boolean => {
      // 1. Pro Users bypass everything
      if (isSubscribed) return true;

      try {
          // 2. Read latest value directly from storage (Critical for high-speed clicking)
          const stored = parseInt(localStorage.getItem(USAGE_KEY) || '0');
          const current = isNaN(stored) ? 0 : stored;
          
          // 3. Strict Check
          // Count 0, 1, 2 = OK. 
          // Count 3 = STOP.
          if (current >= LIMIT_MAX) {
              playNotificationSound();
              // Force opening logic
              setSubscriptionModalOpen(true);
              return false;
          }

          // 4. Increment & Save
          const newCount = current + 1;
          localStorage.setItem(USAGE_KEY, newCount.toString());
          setUsageCount(newCount); 
          
          // 5. Sync to Cloud if logged in
          if (session) {
              api.updateUserUsage(newCount);
          }
          
          return true;
      } catch (e) {
          console.error(e);
          return true;
      }
  };

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
      setNotification({ message, type });
  }, []);

  const handleUpgradeConfirm = useCallback(() => {
      setIsSubscribed(true);
      localStorage.setItem(PRO_KEY, 'true');
      if (session) api.setProStatus(true);
      showNotification("Pro unlocked!", 'success');
  }, [session, showNotification]);

  const handleToggleSound = useCallback((enabled: boolean) => {
      setSoundEnabledState(enabled);
      setSoundEnabled(enabled);
      if (enabled) showNotification("Sound enabled", 'info');
  }, [showNotification]);

  const handleOpenUpload = useCallback(() => { playOpenModalSound(); setUploadModalOpen(true); setEditingTemplate(null); }, []);
  const handleCloseUpload = useCallback(() => { playCloseModalSound(); setUploadModalOpen(false); setEditingTemplate(null); }, []);
  const handleOpenDashboard = useCallback(() => { playOpenModalSound(); setDashboardOpen(true); }, []);
  const handleCloseDashboard = useCallback(() => { playCloseModalSound(); setDashboardOpen(false); }, []);
  const handleOpenLogin = useCallback(() => { playOpenModalSound(); setLoginModalOpen(true); }, []);
  const handleCloseLogin = useCallback(() => { playCloseModalSound(); setLoginModalOpen(false); }, []);
  const handleOpenSetup = useCallback(() => { playOpenModalSound(); setSetupOpen(true); }, []);
  const handleCloseSetup = useCallback(() => { playCloseModalSound(); setSetupOpen(false); }, []);
  const handleOpenSettings = useCallback(() => { playOpenModalSound(); setProfileSettingsOpen(true); }, []);
  const handleCloseSettings = useCallback(() => { playCloseModalSound(); setProfileSettingsOpen(false); }, []);
  const handleOpenCreator = useCallback((name: string) => { playOpenModalSound(); setViewingCreator(name); }, []);
  const handleCloseCreator = useCallback(() => { playCloseModalSound(); setViewingCreator(null); }, []);
  const handleOpenDocumentation = useCallback(() => { playOpenModalSound(); setDocumentationOpen(true); }, []);
  const handleCloseDocumentation = useCallback(() => { playCloseModalSound(); setDocumentationOpen(false); }, []);

  const handleCloseSubscription = useCallback(() => setSubscriptionModalOpen(false), []);
  const handleCloseNotification = useCallback(() => setNotification(null), []);
  const handleLogin = useCallback(async (e: string, p: string) => { 
      const data = await api.signInWithEmail(e, p); 
      if (data.session) setSession(data.session);
  }, []);
  const handleSignup = useCallback(async (e: string, p: string, n: string) => { 
      const data = await api.signUpWithEmail(e, p, n); 
      if (data.session) setSession(data.session);
      return data;
  }, []);

  const handleSignOut = useCallback(async () => { 
      await api.signOut(); 
      setSession(null);
      setIsSubscribed(false);
      localStorage.removeItem(PRO_KEY); 
      showNotification("Signed out", 'info');
  }, [showNotification]);

  const handleAddOrUpdateTemplate = useCallback(async (data: NewTemplateData) => {
    if (editingTemplate && session?.user.email) {
        await api.updateTemplateData(editingTemplate.id, data, session.user.email);
        await loadTemplates();
    } else {
        const newTemplate = await api.addTemplate(data, session?.user);
        setTemplates(prev => [newTemplate, ...prev]);
    }
  }, [editingTemplate, session, loadTemplates]);

  const handleEditTemplate = useCallback((template: Template) => {
      setEditingTemplate(template);
      setDashboardOpen(false);
      setUploadModalOpen(true);
  }, []);

  const handleViewClick = useCallback((template: Template) => {
    // LOGIN GATE: "When click arrow button without sign in, we can't sign in and go to sign in page instead"
    // Requirement: Redirect anonymous users to Login immediately upon clicking View.
    if (!session) {
        playOpenModalSound();
        setLoginModalOpen(true);
        return;
    }

    if (template.title) {
        playOpenModalSound();
        if (!viewedTemplateIds.has(template.id)) {
            api.updateTemplate(template.id, { views: (template.views || 0) + 1 });
            const newSet = new Set(viewedTemplateIds).add(template.id);
            setViewedTemplateIds(newSet);
            localStorage.setItem('templr_viewed_ids', JSON.stringify(Array.from(newSet)));
        }
        setViewingTemplate(template);
        setViewerOpen(true);
        
        // Update URL for SEO
        const slug = template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        window.history.pushState({}, '', `/templates/${slug}-${template.id}`);
    }
  }, [session, viewedTemplateIds]);

  const handleCloseViewer = useCallback(() => {
    playCloseModalSound();
    setViewerOpen(false);
    setTimeout(() => setViewingTemplate(null), 300);
    
    // Restore URL
    if (window.location.pathname.startsWith('/templates/')) {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleLikeClick = useCallback((templateId: string) => {
    if (!session) {
        playOpenModalSound();
        setLoginModalOpen(true);
        return;
    }
    const isCurrentlyLiked = likedTemplateIds.has(templateId);
    const newSet = new Set(likedTemplateIds);
    isCurrentlyLiked ? newSet.delete(templateId) : newSet.add(templateId);
    setLikedTemplateIds(newSet);
    localStorage.setItem('templr_liked_ids', JSON.stringify(Array.from(newSet)));
    const template = templates.find(t => t.id === templateId);
    if (template) {
        const newLikes = Math.max(0, isCurrentlyLiked ? template.likes - 1 : template.likes + 1);
        api.updateTemplate(templateId, { likes: newLikes });
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, likes: newLikes } : t));
    }
  }, [session, likedTemplateIds, templates]);

  const handleFavoriteClick = useCallback((templateId: string) => {
      if (!session) {
          playOpenModalSound();
          setLoginModalOpen(true);
          return;
      }
      playClickSound();
      const isFavorited = favoriteTemplateIds.has(templateId);
      const newSet = new Set(favoriteTemplateIds);
      isFavorited ? newSet.delete(templateId) : newSet.add(templateId);
      setFavoriteTemplateIds(newSet);
      localStorage.setItem('templr_favorites', JSON.stringify(Array.from(newSet)));
      if (!isFavorited) showNotification("Added to favorites", 'success');
  }, [session, favoriteTemplateIds, showNotification]);

  const handleMessageCreator = useCallback((creatorName: string) => {
      playClickSound();
      showNotification(`Messaging ${creatorName} is coming soon!`, 'info');
  }, [showNotification]);

  const creditsRemaining = Math.max(0, LIMIT_MAX - usageCount);

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center pointer-events-auto cursor-wait"
          >
             <div className="flex flex-col items-center gap-8">
                 <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)] relative overflow-hidden">
                      <div className="w-5 h-5 bg-black rounded-sm z-10 animate-spin-slow"></div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent animate-shimmer"></div>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                     <p className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-[0.3em]">
                        Templr v12.0
                     </p>
                     <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full bg-white"
                        />
                     </div>
                 </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header 
        session={session}
        onUploadClick={handleOpenUpload} 
        onLoginClick={handleOpenLogin}
        onSignOut={handleSignOut}
        onDashboardClick={handleOpenDashboard}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSetup={handleOpenSetup}
        onOpenSettings={handleOpenSettings}
        isSubscribed={isSubscribed}
        creditsLeft={isSubscribed ? undefined : creditsRemaining} 
      />
      
      <main>
        <LazySection minHeight="800px">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Hero onUploadClick={handleOpenUpload} />
          </motion.div>
        </LazySection>
        
        <LazySection minHeight="1200px">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <TemplateGallery 
              templates={templates}
              isLoading={isLoading}
              initialCategory={initialCategory}
              onMessageCreator={handleMessageCreator} 
              onLike={handleLikeClick}
              onFavorite={handleFavoriteClick}
              onView={handleViewClick}
              onCreatorClick={handleOpenCreator}
              likedIds={likedTemplateIds}
              favoriteIds={favoriteTemplateIds}
              isLoggedIn={!!session}
            />
          </motion.div>
        </LazySection>
        
        <LazySection minHeight="600px">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <FeaturedCreators onCreatorClick={handleOpenCreator} />
          </motion.div>
        </LazySection>
        
        <LazySection minHeight="400px">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <CTA onOpenDocumentation={handleOpenDocumentation} />
          </motion.div>
        </LazySection>
      </main>
      
      <LazySection minHeight="300px">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Footer onShowNotification={(msg) => showNotification(msg, 'info')} />
        </motion.div>
      </LazySection>
      
      <ContactFloat />

      {/* --- MODALS --- */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={handleCloseUpload}
        onAddTemplate={handleAddOrUpdateTemplate}
        onDashboardClick={() => { handleCloseUpload(); handleOpenDashboard(); }}
        isLoggedIn={!!session}
        onLoginRequest={handleOpenLogin}
        userEmail={session?.user.email}
        onShowNotification={showNotification}
        initialData={editingTemplate}
        isEditing={!!editingTemplate}
      />
      <ImageViewerModal 
        isOpen={isViewerOpen} 
        onClose={handleCloseViewer} 
        template={viewingTemplate} 
        onUsageAttempt={handleUsageAttempt}
        onOpenSubscription={() => setSubscriptionModalOpen(true)}
        usageCount={usageCount}
        isSubscribed={isSubscribed}
      />
      <CreatorProfileModal 
        isOpen={!!viewingCreator}
        onClose={handleCloseCreator}
        creatorName={viewingCreator}
        templates={templates}
        onView={handleViewClick}
        onLike={handleLikeClick}
        onFavorite={handleFavoriteClick}
        likedIds={likedTemplateIds}
        favoriteIds={favoriteTemplateIds}
      />
      <DashboardModal 
        isOpen={isDashboardOpen} 
        onClose={handleCloseDashboard} 
        userEmail={session?.user.email}
        onEdit={handleEditTemplate}
      />
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={handleCloseLogin}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onOpenSetup={handleOpenSetup}
      />
      <ProfileSettingsModal 
        isOpen={isProfileSettingsOpen}
        onClose={handleCloseSettings}
        session={session}
        onShowNotification={showNotification}
      />
      <SetupGuideModal isOpen={isSetupOpen} onClose={handleCloseSetup} />
      <DocumentationModal isOpen={isDocumentationOpen} onClose={handleCloseDocumentation} />
      
      {/* 
          SUBSCRIPTION MODAL 
          Must be absolutely last to be on top. 
      */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={handleCloseSubscription}
        onUpgradeConfirm={handleUpgradeConfirm}
      />
      
      {notification && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={handleCloseNotification}
        />
      )}
      <Analytics />
    </div>
  );
};

export default App;
