
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ClipboardIcon, CheckCircleIcon, CpuIcon, ShieldCheckIcon, RocketIcon } from './Icons';
import { playClickSound, playSuccessSound, playNotificationSound } from '../audio';
import { supabase, Session } from '../api';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCRIPT = `-- 1. TABLE STRUCTURE (Safe)
create table if not exists public.templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  category text,
  tags text[] default '{}'::text[],
  price text default 'Free',
  author_name text,
  author_email text,
  author_avatar text,
  image_url text,
  banner_url text,
  video_url text,
  gallery_images text[] default '{}'::text[],
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  source_code text,
  status text default 'approved',
  views bigint default 0,
  likes bigint default 0,
  sales bigint default 0,
  earnings bigint default 0
);

-- 2. ENSURE COLUMNS EXIST
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='templates' and column_name='video_url') then
    alter table public.templates add column video_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='templates' and column_name='source_code') then
    alter table public.templates add column source_code text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='templates' and column_name='tags') then
    alter table public.templates add column tags text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name='templates' and column_name='author_avatar') then
    alter table public.templates add column author_avatar text;
  end if;
end $$;

-- 3. NUCLEAR POLICY RESET (Fixes Error 42710)
-- This block dynamically finds and drops ALL policies on the templates table.
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'templates'
  loop
    execute format('drop policy if exists %I on public.templates', pol.policyname);
  end loop;
end $$;

alter table public.templates enable row level security;

-- 4. CREATE FRESH POLICIES
-- NOTE: We allow public inserts for now to ensure the "Publish" feature works even if 
-- the backend is using the Anon Key. For production, use the Service Role Key on the backend.
create policy "templr_read_all" on public.templates for select using (true);
create policy "templr_insert_all" on public.templates for insert with check (true);
create policy "templr_update_own" on public.templates for update using (auth.jwt() ->> 'email' = author_email);
create policy "templr_delete_own" on public.templates for delete using (auth.jwt() ->> 'email' = author_email);

-- 5. STORAGE SETUP
insert into storage.buckets (id, name, public) values ('assets', 'assets', true) on conflict (id) do nothing;

-- Storage Policy Reset (Safe for shared projects)
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'objects' and schemaname = 'storage'
  loop
    if pol.policyname like 'templr_%' or pol.policyname in ('Public Access', 'Auth Upload', 'Public Storage Read') then
        execute format('drop policy if exists %I on storage.objects', pol.policyname);
    end if;
  end loop;
end $$;

create policy "templr_storage_read" on storage.objects for select using (bucket_id = 'assets');
create policy "templr_storage_insert" on storage.objects for insert with check (bucket_id = 'assets' and auth.role() = 'authenticated');
`;

const ENV_EXAMPLE = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxh... (your anon key)`;

const CopyBlock = ({ label, content }: { label: string, content: string }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        playSuccessSound();
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${copied ? 'text-green-400 bg-green-500/10' : 'text-blue-400 hover:text-white'}`}
                >
                    {copied ? <CheckCircleIcon className="w-3 h-3" /> : <ClipboardIcon className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-sm group-hover:bg-blue-500/10 transition-colors"></div>
                <pre className="relative bg-[#080808] border border-white/10 rounded-xl p-4 overflow-x-auto custom-scrollbar text-[11px] font-mono text-slate-300 leading-relaxed max-h-[300px]">
                    {content}
                </pre>
            </div>
        </div>
    );
};

const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'env' | 'db'>('db'); 
  
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if(isOpen) {
        setUrlInput(localStorage.getItem('templr_project_url') || '');
        setKeyInput(localStorage.getItem('templr_anon_key') || '');
        setIsSaved(false);

        supabase.auth.getSession().then(({ data }) => {
            const mapped = data.session ? {
                user: {
                    id: data.session.user.id,
                    email: data.session.user.email,
                    user_metadata: {
                        full_name: data.session.user.user_metadata.full_name,
                        avatar_url: data.session.user.user_metadata.avatar_url
                    }
                }
            } : null;
            setSession(mapped);
        });
    }
  }, [isOpen]);

  const handleSaveKeys = () => {
      if (urlInput.trim() && keyInput.trim()) {
          localStorage.setItem('templr_project_url', urlInput.trim());
          localStorage.setItem('templr_anon_key', keyInput.trim());
          setIsSaved(true);
          playSuccessSound();
          setTimeout(() => { window.location.reload(); }, 800);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                        <CpuIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">System Configuration</h2>
                        <p className="text-xs text-slate-500">Sync your backend for full functionality</p>
                    </div>
                </div>
                <button onClick={() => { playClickSound(); onClose(); }} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex border-b border-white/5 bg-[#0a0a0a] overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('db')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 min-w-[100px] ${activeTab === 'db' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    SQL (Run First)
                </button>
                <button onClick={() => setActiveTab('quick')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 min-w-[100px] ${activeTab === 'quick' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    Connect
                </button>
                <button onClick={() => setActiveTab('env')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 min-w-[100px] ${activeTab === 'env' ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    .env
                </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#050505] flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'db' ? (
                        <motion.div key="db" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-blue-900/10 border border-blue-500/20">
                                <ShieldCheckIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-blue-300 uppercase mb-1 font-display">Nuclear SQL Fix (v4)</p>
                                    <p className="text-xs text-blue-200/70 leading-relaxed">
                                        This script performs a deep clean of your database policies. It drops <strong>ALL</strong> existing policies on the `templates` table to guarantee no conflicts (Error 42710).
                                    </p>
                                </div>
                            </div>
                            <CopyBlock label="Robust SQL Script" content={SQL_SCRIPT} />
                        </motion.div>
                    ) : activeTab === 'quick' ? (
                        <motion.div key="quick" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4 items-start">
                                <RocketIcon className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Quick Connect</h4>
                                    <p className="text-xs text-blue-200/70 leading-relaxed">Securely store your project credentials in your browser's local storage.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Project URL</label>
                                    <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://your-project.supabase.co" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder-slate-700 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Anon Public Key</label>
                                    <input type="text" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="eyJxh..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder-slate-700 font-mono" />
                                </div>
                            </div>
                            <button onClick={handleSaveKeys} disabled={!urlInput || !keyInput || isSaved} className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-slate-200 shadow-xl'}`}>
                                {isSaved ? <span>Connected!</span> : <span>Save & Connect</span>}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="env" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                             <ol className="list-decimal list-inside space-y-4 text-sm text-slate-300">
                                <li>Create a free project at <a href="https://supabase.com" target="_blank" className="text-blue-400 hover:underline">Supabase.com</a></li>
                                <li>Navigate to <strong>Settings &rarr; API</strong></li>
                                <li>Create a <code>.env</code> file in your project root:</li>
                            </ol>
                            <div className="mt-6">
                                <CopyBlock label=".env File Content" content={ENV_EXAMPLE} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-end">
                <button onClick={onClose} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                    Close Guide
                </button>
            </div>
        </motion.div>
    </div>
  );
};

export default React.memo(SetupGuideModal);
