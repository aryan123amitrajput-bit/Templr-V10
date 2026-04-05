import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon, LayoutIcon, MousePointerClickIcon, RocketIcon, UsersIcon, SparklesIcon } from './Icons';
import { playCloseModalSound } from '../audio';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { playCloseModalSound(); onClose(); }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Templr Documentation</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Learn how to discover, use, and launch landing page templates faster with Templr.</p>
                </div>
              </div>
              <button
                onClick={() => { playCloseModalSound(); onClose(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-16">
              
              {/* Hero Section */}
              <section className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
                  Templr Documentation
                </h1>
                <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                  Learn how to discover, use, and launch landing page templates faster with Templr.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <SparklesIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Dribbble is for inspiration. Templr is for real templates.</span>
                </div>
              </section>

              {/* What is Templr */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <LayoutIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">What is Templr</h3>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-slate-300 leading-relaxed">
                    Templr is a platform where users can discover and use ready-made landing page templates instead of starting from a blank page. We bridge the gap between design inspiration and usable code, providing a curated gallery of high-quality, modern SaaS designs that you can immediately apply to your projects.
                  </p>
                </div>
              </section>

              {/* How Templr Works */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <MousePointerClickIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">How Templr Works</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { step: '1', title: 'Browse templates', desc: 'Explore our curated gallery of high-quality designs.' },
                    { step: '2', title: 'Choose a design', desc: 'Find the perfect layout that matches your vision.' },
                    { step: '3', title: 'Customize and launch', desc: 'Adapt the structure and content to your needs.' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-6xl text-white pointer-events-none">
                        {item.step}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm mb-4">
                        {item.step}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* What You Can Find */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">What You Can Find on Templr</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Landing page templates',
                    'Modern SaaS designs',
                    'Ready UI layouts',
                    'Inspiration + usable templates'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span className="text-slate-300 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* How to Use a Template */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <LayoutIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">How to Use a Template</h3>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <ol className="space-y-4">
                    {[
                      'Open a template from the gallery.',
                      'View the design details and structure.',
                      'Copy the structure or recreate it in your project.',
                      'Customize text, colors, and content to match your brand.'
                    ].map((step, idx) => (
                      <li key={idx} className="flex gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 mt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* Who Templr is For */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Who Templr is For</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    'Indie hackers',
                    'Startup founders',
                    'Developers',
                    'UI/UX designers',
                    'Builders launching products'
                  ].map((user, idx) => (
                    <div key={idx} className="px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 text-sm font-medium">
                      {user}
                    </div>
                  ))}
                </div>
              </section>

              {/* Why Use Templr */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <RocketIcon className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Why Use Templr</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Skip the blank page problem',
                    'Save hours of design work',
                    'Launch projects faster',
                    'Discover modern UI patterns'
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="mt-1 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                      </div>
                      <span className="text-slate-300 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(DocumentationModal);
