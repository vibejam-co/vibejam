
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useRef } from 'react';
import { jamLocalStore, slugify, JamPublished } from '../lib/jamLocalStore';
import StartJamPreviewOverlay from './StartJamPreviewOverlay';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../lib/backend';
import { supabase } from '../lib/supabaseClient';
import { JamStatus, JamMedia } from '../types';

interface LaunchpadProps {
  onClose: () => void;
  onOpenJam?: (jam: JamPublished) => void;
  onPublishSuccess?: () => void;
  initialJam?: any;
}

interface JamDraft {
  id: string;
  name: string;
  description: string;
  category: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  stack: string[];
  vibeTools: string[];
  mrr: string;
  isRevenuePublic: boolean;
  makerType: 'Solo Founder' | 'Team' | 'Not Specified';
  sourceUrl: string;
  proofUrl: string;
}

const ALLOWED_CATEGORIES = [
  "AI", "Dev Tools", "Design Tools", "Productivity", "Creator Economy",
  "Marketing", "Sales", "Analytics", "Finance", "Education", "Lifestyle",
  "Health & Fitness", "Music", "Video", "Photography", "Writing",
  "Community", "Social", "E-commerce", "Gaming", "Travel", "SaaS", "Utilities"
];

const ALLOWED_VIBE_TOOLS = ["Cursor", "Claude", "Gemini", "v0", "Replit", "Linear", "Lovable", "Bolt", "Windsurf"];

const ALLOWED_TECH_STACK = [
  // Frontend
  "React", "Next.js", "Vue", "Svelte", "Remix", "Astro", "Nuxt", "Vite", "Angular",
  // CSS/UI
  "Tailwind CSS", "shadcn/ui", "Radix", "Chakra UI", "MUI", "Framer Motion", "Styled Components",
  // Backend/API
  "Node.js", "Express", "FastAPI", "Django", "Rails", "Laravel", "NestJS", "Go", ".NET",
  // Database
  "Supabase", "Postgres", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "PlanetScale", "Neon",
  // Auth/Payments
  "Stripe", "Clerk", "Auth0", "Firebase Auth", "NextAuth", "Lemon Squeezy", "Paddle", "PayPal",
  // AI/LLM
  "OpenAI", "Anthropic", "Hugging Face", "Replicate", "LangChain",
  // Analytics/Infra
  "PostHog", "Mixpanel", "Segment", "GA4", "Vercel", "Netlify", "AWS", "GCP", "Cloudflare", "Render", "Docker",
  // Mobile
  "React Native", "Flutter", "SwiftUI", "Kotlin"
];

const ALLOWED_REVENUE_RANGES = [
  "Prefer not to say",
  "$0 (Pre-revenue)",
  "$1–$500",
  "$500–$2k",
  "$2k–$10k",
  "$10k–$50k",
  "$50k–$100k",
  "$100k–$250k",
  "$250k–$500k",
  "$500k–$1M",
  "$1M+"
];

const Launchpad: React.FC<LaunchpadProps> = ({ onClose, onOpenJam, onPublishSuccess, initialJam }) => {
  const { user, profile, signInWithGoogle } = useAuth();
  const [step, setStep] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'loading' | 'degraded' | 'success'>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishedJam, setPublishedJam] = useState<JamPublished | null>(null);
  const [isFirstJamPreview, setIsFirstJamPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Ref for aborting handled via component unmount logic if needed, but keeping simple for CF call

  const isEditing = !!initialJam?.id;

  const [formData, setFormData] = useState<JamDraft>(() => {
    const saved = localStorage.getItem('vj_draft_jam');
    return saved ? JSON.parse(saved) : {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      category: 'SaaS',
      mediaType: 'image',
      mediaUrl: '',
      stack: [],
      vibeTools: [],
      mrr: 'Prefer not to say',
      isRevenuePublic: true,
      makerType: 'Not Specified',
      sourceUrl: '',
      proofUrl: ''
    };
  });

  useEffect(() => {
    if (isEditing && initialJam) {
      const media = initialJam.media || {};
      const mediaUrl = media.heroImageUrl || initialJam.media_url || initialJam.mediaUrl || '';
      setFormData(prev => ({
        ...prev,
        id: initialJam.id || prev.id,
        name: initialJam.name || '',
        description: initialJam.tagline || initialJam.description || '',
        category: initialJam.category || 'SaaS',
        mediaUrl,
        stack: initialJam.tech_stack || initialJam.techStack || [],
        vibeTools: initialJam.vibe_tools || initialJam.vibeTools || [],
        mrr: initialJam.mrr_bucket || initialJam.mrrBucket || 'Prefer not to say',
        isRevenuePublic: (initialJam.mrr_visibility || initialJam.mrrVisibility) === 'public',
        makerType: (initialJam.team_type === 'team' || initialJam.teamType === 'team') ? 'Team' : 'Solo Founder',
        sourceUrl: initialJam.website_url || initialJam.websiteUrl || '',
        proofUrl: initialJam.socials?.proof_url || initialJam.socials?.proofUrl || ''
      }));
      setHeroImageUrl(mediaUrl);
      setStep(1);
      return;
    }
    // 1. Try to hydrate from Backend (Supabase or Local Fallback)
    const loadDraft = async () => {
      try {
        const result = await backend.getMyLatestDraft();
        if (result.jam && result.jam.status === 'draft') {
          const d = result.jam;
          setFormData(prev => ({
            ...prev,
            id: d.id,
            name: d.name || '',
            description: d.description || d.tagline || '',
            category: d.category || 'SaaS',
            mediaUrl: d.media?.heroImageUrl || '',
            stack: d.techStack || [],
            vibeTools: d.vibeTools || [],
            mrr: d.mrrBucket || 'Prefer not to say',
            isRevenuePublic: d.mrrVisibility === 'public',
            makerType: (d.teamType === 'team' ? 'Team' : 'Solo Founder') as any,
            sourceUrl: d.websiteUrl || ''
          }));
          // Persist the ID we found
          localStorage.setItem('vj_last_draft_id', d.id);
        }
      } catch (e) {
        console.warn('VJ: Failed to hydrate draft', e);
      }
    };
    loadDraft();
  }, [isEditing, initialJam]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('vj_draft_jam', JSON.stringify(formData));
    }
  }, [formData]);

  // Dirty tracking to prevent overwrite
  const dirtyFields = useRef<Set<string>>(new Set());

  // Mark fields as dirty on user edit
  const updateField = (field: keyof JamDraft, value: any) => {
    dirtyFields.current.add(field);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutoDraft = async (url: string) => {
    if (!url) return;

    setIsScraping(true);
    setScrapeStatus('loading');
    setError(null);

    let finalUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const urlObj = new URL(finalUrl);
      const hostname = urlObj.hostname.replace('www.', '').split('.')[0];
      const fallbackTitle = hostname.charAt(0).toUpperCase() + hostname.slice(1);

      // 1. Create/Upsert Draft (Fail-open)
      const draft = await backend.upsertDraft({
        jamId: formData.id,
        websiteUrl: finalUrl,
        source: 'manual',
        name: formData.name || fallbackTitle
      });

      if (draft.id && draft.id !== formData.id) {
        setFormData(prev => ({ ...prev, id: draft.id }));
      }

      setStep(1);

      // 2. Scrape (Background)
      const { extraction: scrapeData, error: scrapeErr, code: scrapeCode } = await backend.scrapeUrl(finalUrl, formData.id);

      if (scrapeErr) {
        console.warn("VJ: Scrape minor error:", scrapeCode);
        // Don't fail the flow, just alert visually if needed or stay silent
        if (scrapeCode === 'HTTP_403' || scrapeCode === 'HTTP_404') {
          setScrapeStatus('degraded');
        }
      }

      setFormData(prev => {
        // Only merge if NOT dirty
        const next = { ...prev };
        if (!dirtyFields.current.has('name') && scrapeData.name) next.name = scrapeData.name;
        if (!dirtyFields.current.has('description') && scrapeData.tagline) next.description = scrapeData.tagline;
        if (!dirtyFields.current.has('mediaUrl') && scrapeData.media?.heroImageUrl) next.mediaUrl = scrapeData.media.heroImageUrl;

        // Merge arrays (safe append)
        if (scrapeData.vibeTools) next.vibeTools = [...new Set([...prev.vibeTools, ...scrapeData.vibeTools])].filter(t => ALLOWED_VIBE_TOOLS.includes(t));
        if (scrapeData.techStack) next.stack = [...new Set([...prev.stack, ...scrapeData.techStack])].filter(t => ALLOWED_TECH_STACK.includes(t));

        next.sourceUrl = finalUrl;
        return next;
      });

      setScrapeStatus('success');

    } catch (err: any) {
      console.warn(`VJ: Scrape/Draft critical fail.`, err);
      setScrapeStatus('degraded');
      setStep(1);

      // Auto-fill fallback if empty
      if (!formData.name && !dirtyFields.current.has('name')) {
        const simpleName = finalUrl.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '').split('.')[0];
        setFormData(prev => ({
          ...prev,
          name: simpleName.charAt(0).toUpperCase() + simpleName.slice(1),
          sourceUrl: finalUrl
        }));
      }
    } finally {
      setIsScraping(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.name) {
      setError("Name is required to launch.");
      return;
    }

    setIsPublishing(true);
    let isFirstJam = false;
    if (!isEditing) {
      const count = await backend.getMyPublishedJamCount();
      isFirstJam = count.ok ? count.count === 0 : false;
      setIsFirstJamPreview(isFirstJam);
    }

    // Prepare payload
    const patchPayload: any = {
      name: formData.name,
      tagline: formData.description,
      category: formData.category,
      teamType: formData.makerType === 'Solo Founder' ? 'solo' : 'team',
      vibeTools: formData.vibeTools || [],
      tech_stack: formData.stack || [], // Match DB field name or adapter expectation
      mrr_bucket: formData.mrr,
      mrr_visibility: formData.isRevenuePublic ? 'public' : 'hidden',
      website_url: formData.sourceUrl,
      socials: formData.proofUrl ? { proof_url: formData.proofUrl } : undefined,
      media: {
        heroImageUrl: formData.mediaUrl,
        imageUrls: [],
        videoEmbedUrl: undefined,
        faviconUrl: undefined,
        ogImageUrl: undefined,
        screenshotUrl: undefined
      }
    };
    if (isEditing && (initialJam?.published_at || initialJam?.publishedAt)) {
      patchPayload.published_at = initialJam.published_at || initialJam.publishedAt;
    }

    try {
      if (!user) {
        setError("Please sign in to publish your Jam.");
        await signInWithGoogle();
        return;
      }
      const result = await backend.publishJam({
        jamId: formData.id,
        patch: patchPayload
      });

      if (!result.success || !result.data) {
        // Map backend errors to UI
        if (result.error === 'INCOMPLETE_METADATA') {
          throw new Error("Missing required fields: Name.");
        }
        if (result.error === 'BACKEND_OFFLINE') {
          throw new Error("Connection lost. Check your internet.");
        }
        if (result.error && /invalid jwt|unauthorized|no_session|session_refresh_failed/i.test(result.error)) {
          await supabase.auth.signOut();
          throw new Error("Session expired. Please sign in again and retry.");
        }
        throw new Error(result.error || 'PUBLISH_FAILED');
      }

      const finalJam = result.data;

      const resolvedMrr = finalJam.mrrBucket || finalJam.mrr_bucket || formData.mrr;
      const resolvedVisibility = finalJam.mrrVisibility || finalJam.mrr_visibility || (formData.isRevenuePublic ? 'public' : 'hidden');
      const previewJam: JamPublished = {
        id: finalJam.id,
        slug: (finalJam as any).slug || `${slugify(formData.name)}-${finalJam.id}`,
        status: 'published',
        publishedAt: Date.now(),
        name: finalJam.name,
        description: finalJam.description || '',
        websiteUrl: finalJam.websiteUrl || finalJam.website_url || formData.sourceUrl,
        category: finalJam.category,
        proofUrl: formData.proofUrl,
        mediaType: 'image',
        screenshot: finalJam.media?.heroImageUrl || '',
        thumbnailUrl: finalJam.media?.heroImageUrl || '',
        icon: finalJam.media?.faviconUrl || '✨',
        stats: {
          revenue: resolvedMrr || '$0',
          isRevenuePublic: resolvedVisibility === 'public',
          growth: '+0%', rank: 99, upvotes: 0, daysLive: 0, views: 0, bookmarks: 0
        },
        creator: {
          name: profile?.display_name || user?.name || 'Maker',
          avatar: profile?.avatar_url || user?.avatar || '',
          handle: profile?.username || user?.handle || '',
          type: (finalJam.teamType === 'team' ? 'Team' : 'Solo Founder') as any,
          color: '#3b82f6',
          badges: []
        },
        stack: finalJam.techStack || finalJam.tech_stack || formData.stack || [],
        vibeTools: finalJam.vibeTools || finalJam.vibe_tools || formData.vibeTools || []
      } as any;

      setPublishedJam(previewJam);
      setPreviewOpen(true);
      if (!isEditing) {
        localStorage.removeItem('vj_draft_jam');
      }
      onPublishSuccess?.();

    } catch (e: any) {
      console.error("VJ: Publish failed critical.", e);
      // Show specific message if available, else generic
      setError(e.message || "Publishing failed temporarily. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" onClick={onClose} />

        <div className="relative w-full max-w-5xl h-full md:h-auto md:max-h-[85vh] bg-white md:rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

          <div className="flex-1 overflow-y-auto p-8 md:p-16 scrollbar-hide">
            <button onClick={() => (step === 0 || (isEditing && step === 1)) ? onClose() : setStep(s => s - 1)} className="mb-8 text-gray-400 hover:text-gray-900 flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {!isEditing && step === 0 && (
              <div className="max-w-md animate-in slide-in-from-left-4 duration-500">
                <h2 className="text-4xl font-bold text-gray-900 tracking-tighter mb-4">Start your Jam.</h2>
                <p className="text-gray-500 mb-8 font-medium">Launch your build to the community.</p>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="Paste your URL"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAutoDraft(urlInput)}
                      className="w-full h-16 pl-6 pr-24 rounded-2xl border border-gray-100 focus:border-blue-500 outline-none font-medium shadow-sm"
                    />
                    <button
                      onClick={() => handleAutoDraft(urlInput)}
                      disabled={!urlInput || isScraping}
                      className="absolute right-2 top-2 h-12 px-6 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-gray-800"
                    >
                      {isScraping ? '...' : 'MAGIC →'}
                    </button>
                  </div>
                  <button onClick={() => setStep(1)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:border-gray-200 transition-colors">Start manual draft</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="max-w-md animate-in slide-in-from-right-4 duration-500">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 block">STEP 01</span>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">{isEditing ? 'Edit details.' : 'Details.'}</h2>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label>
                    <input type="text" placeholder="App Name" className="w-full text-xl font-bold border-b border-gray-100 focus:border-blue-500 pb-2 outline-none bg-transparent" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">One-liner</label>
                    <input type="text" placeholder="Tagline" className="w-full text-lg border-b border-gray-100 focus:border-blue-500 pb-2 outline-none bg-transparent" value={formData.description} onChange={e => updateField('description', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full bg-white text-sm font-bold border-b border-gray-100 focus:border-blue-500 pb-2 outline-none" value={formData.category} onChange={e => updateField('category', e.target.value)}>
                      {ALLOWED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Proof (GitHub or Loom)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/… or https://loom.com/…"
                      className="w-full text-sm text-gray-900 placeholder:text-gray-300 border-b border-gray-100 focus:border-blue-500 pb-2 outline-none bg-transparent"
                      value={formData.proofUrl}
                      onChange={e => updateField('proofUrl', e.target.value)}
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-3 pt-4">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">App Image</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-800 transition-all">
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 500 * 1024) {
                                setError('Image too large. Max size is 500KB.');
                                return;
                              }
                              try {
                                setIsUploadingImage(true);
                                setError(null);
                                const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
                                const contentType = file.type || 'image/png';
                                const signRes = await backend.signMediaUpload({
                                  bucket: 'jam-media',
                                  kind: 'jam_hero',
                                  jamId: formData.id,
                                  contentType,
                                  ext
                                });
                                if (!signRes.ok || !signRes.path || !signRes.token) {
                                  throw new Error(signRes.error || 'UPLOAD_SIGN_FAILED');
                                }

                                const { error: uploadError } = await supabase.storage
                                  .from('jam-media')
                                  .uploadToSignedUrl(signRes.path, signRes.token, file, {
                                    contentType,
                                    upsert: true
                                  });
                                if (uploadError) throw uploadError;

                                const finalize = await backend.finalizeMediaUpload({
                                  bucket: 'jam-media',
                                  path: signRes.path || '',
                                  jamId: formData.id,
                                  slot: 'hero'
                                });

                                const finalUrl = finalize.url || signRes.publicUrl || '';
                                if (!finalUrl) throw new Error('UPLOAD_FINALIZE_FAILED');

                                setHeroImageUrl(finalUrl);
                                updateField('mediaUrl', finalUrl);
                              } catch (err: any) {
                                setError(err?.message || 'Image upload failed');
                              } finally {
                                setIsUploadingImage(false);
                              }
                            }}
                          />
                        </label>
                        {isUploadingImage && <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Uploading…</span>}
                      </div>
                      <input
                        type="url"
                        placeholder="https://example.com/screenshot.png"
                        className="w-full text-sm text-gray-900 placeholder:text-gray-300 border-b border-gray-100 focus:border-blue-500 pb-2 outline-none bg-transparent"
                        value={heroImageUrl}
                        onChange={(e) => {
                          setHeroImageUrl(e.target.value);
                          updateField('mediaUrl', e.target.value);
                        }}
                      />
                      {(heroImageUrl || formData.mediaUrl) && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100">
                          <img
                            src={heroImageUrl || formData.mediaUrl}
                            alt="App preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EImage failed to load%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <button
                            onClick={() => {
                              setHeroImageUrl('');
                              updateField('mediaUrl', '');
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xs transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <p className="text-[9px] text-gray-400 font-medium">Paste an image URL or let scraping auto-detect it</p>
                    </div>
                  </div>
                </div>
                {scrapeStatus === 'degraded' && <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic opacity-60">Metadata extraction unavailable. Please enter details manually.</p>}
                <button onClick={() => setStep(2)} className="mt-12 w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-xs tracking-widest uppercase hover:bg-gray-800 active:scale-[0.98] transition-all">Continue →</button>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-md animate-in slide-in-from-right-4 duration-500">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 block">STEP 02</span>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Stack & Revenue.</h2>
                <div className="space-y-10">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Vibe Tools</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_VIBE_TOOLS.map(tool => (
                        <button key={tool} onClick={() => setFormData(prev => ({ ...prev, vibeTools: prev.vibeTools.includes(tool) ? prev.vibeTools.filter(t => t !== tool) : [...prev.vibeTools, tool] }))} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.vibeTools.includes(tool) ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>{tool}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tech Stack</label>
                    <div className="relative">
                      <div className="max-h-[160px] overflow-y-auto pr-2 scrollbar-hide py-1 flex flex-wrap gap-2 [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]">
                        {ALLOWED_TECH_STACK.map(tech => (
                          <button
                            key={tech}
                            onClick={() => setFormData(prev => ({ ...prev, stack: prev.stack.includes(tech) ? prev.stack.filter(t => t !== tech) : [...prev.stack, tech] }))}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.stack.includes(tech) ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Revenue Range</label>
                    <select className="w-full bg-white text-sm font-bold border-b border-gray-100 focus:border-blue-500 pb-2 outline-none cursor-pointer" value={formData.mrr} onChange={e => setFormData({ ...formData, mrr: e.target.value })}>
                      {ALLOWED_REVENUE_RANGES.map(range => <option key={range} value={range}>{range}</option>)}
                    </select>
                  </div>
                </div>

                {error && <p className="mt-4 text-xs font-bold text-red-500">{error}</p>}

                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="mt-12 w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isPublishing ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update Jam →' : 'Launch Jam →')}
                </button>
              </div>
            )}
          </div>

          <div className="hidden md:flex w-[340px] bg-gray-50/50 p-12 border-l border-gray-100 items-center justify-center shrink-0">
            <div className="w-full bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 mb-4 flex items-center justify-center text-xl">
                {formData.name ? '✨' : '🚀'}
              </div>
              <h3 className="font-bold text-gray-900 truncate mb-1 min-h-[1.5rem]">{formData.name || 'Your App'}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-6 min-h-[2.5rem]">{formData.description || 'Describe your vibe...'}</p>
              <div className="h-2 w-full bg-gray-50 rounded-full mb-6 overflow-hidden">
                <div className={`h-full bg-blue-500 transition-all duration-1000 ${step === 0 ? 'w-0' : step === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{formData.mrr !== 'Prefer not to say' ? formData.mrr : 'PRIVATE'}</span>
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <StartJamPreviewOverlay
        open={previewOpen}
        jam={publishedJam}
        onClose={() => { setPreviewOpen(false); onClose(); }}
        onOpenJam={onOpenJam}
        isFirstJamPreview={isFirstJamPreview}
        isLoggedIn={!!user}
      />
    </>
  );
};

export default Launchpad;
