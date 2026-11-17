import React, { useState } from 'react';
import {
  Download, Clipboard, Check, AlertCircle, RefreshCw,
  Sparkles, ShieldCheck, HelpCircle, ChevronDown, ChevronUp,
  Film, Image as ImageIcon, WifiOff, Info, Eye, Clock, User
} from 'lucide-react';
import { resolveMediaUrl, downloadMediaFile, type DownloadResult, type DownloadItem } from '../services/downloaderService';
import './tools.css';

function InstagramIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Instagram URL type detection
type IgMediaType = 'reel' | 'post' | 'igtv' | null;

function detectIgMediaType(url: string): IgMediaType {
  try {
    const path = new URL(url).pathname;
    if (/^\/reel(?:s)?\//.test(path)) return 'reel';
    if (/^\/p\//.test(path)) return 'post';
    if (/^\/tv\//.test(path)) return 'igtv';
  } catch { /* ignore */ }
  return null;
}

function isInstagramUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === 'instagram.com';
  } catch {
    return false;
  }
}

function extractShortcode(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export default function InstagramReelsDownloader() {
  const [inputUrl, setInputUrl]           = useState<string>('');
  const [isLoading, setIsLoading]         = useState<boolean>(false);
  const [result, setResult]               = useState<DownloadResult | null>(null);
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);
  const [errorCode, setErrorCode]         = useState<string | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);
  const [openFaq, setOpenFaq]             = useState<number | null>(null);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text.trim());
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch { /* ignore */ }
  };

  const handleFetchMedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = inputUrl.trim();

    if (!cleanUrl) {
      setErrorMessage('Please enter or paste a valid Instagram Reel link.');
      setErrorCode(null);
      return;
    }
    if (!isInstagramUrl(cleanUrl)) {
      setErrorMessage('Please enter a valid Instagram link (e.g. instagram.com/reel/... or instagram.com/p/...).');
      setErrorCode('INVALID_URL');
      return;
    }
    if (!detectIgMediaType(cleanUrl)) {
      setErrorMessage('Supported URL types: /reel/, /reels/, /p/, /tv/ — please check your link.');
      setErrorCode('INVALID_URL');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(null);
    setResult(null);

    const res = await resolveMediaUrl(cleanUrl);
    setIsLoading(false);

    if (res.ok) {
      setResult(res);
    } else {
      const code = res.error?.code ?? 'UNKNOWN';
      setErrorCode(code);
      const msgMap: Record<string, string> = {
        PROVIDER_UNCONFIGURED: 'Instagram Reels Downloader is temporarily unavailable while we finalize the backend integration. Please try again soon.',
        PRIVATE_ACCOUNT:       'This account is private. Only public Instagram content can be downloaded.',
        PRIVATE_CONTENT:       'This reel or post is from a private account and cannot be downloaded.',
        LOGIN_REQUIRED:        'This content requires Instagram login to view and cannot be downloaded.',
        NOT_FOUND:             'This reel or post was not found. It may have been deleted or made private.',
        RATE_LIMIT:            'Too many requests. Please wait a minute and try again.',
        UNSUPPORTED_DOMAIN:    'Only Instagram links (instagram.com) are supported.',
        INVALID_URL:           'Could not extract a valid shortcode from this Instagram link.',
      };
      setErrorMessage(msgMap[code] ?? (res.error?.message || 'Failed to process this Instagram link. Please verify the URL and try again.'));
    }
  };

  const handleDownload = async (item: DownloadItem, labelPrefix: string) => {
    setDownloadingUrl(item.url);
    const ext       = item.format.toLowerCase();
    const safeTitle = (result?.title || 'instagram_reel')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .substring(0, 40);
    const filename  = `${safeTitle}_${labelPrefix}.${ext}`;

    await downloadMediaFile(item.url, filename, (status) => {
      setDownloadStatus(status);
    });

    setTimeout(() => {
      setDownloadingUrl(null);
      setDownloadStatus('');
    }, 2500);
  };

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  const videoItems  = result?.items?.filter(i => i.type === 'video')  ?? [];
  const imageItems  = result?.items?.filter(i => i.type === 'image')  ?? [];
  const mediaType   = detectIgMediaType(inputUrl);
  const shortcode   = extractShortcode(inputUrl);

  // ─── FAQ DATA ───────────────────────────────────────────────────────────────
  const faqs = [
    {
      q: 'Is this Instagram Reels Downloader free to use?',
      a: 'Yes, ProToolBox Instagram Reels Downloader is 100% free with no sign-up, subscription, or app installation required. Simply paste the reel link and download.'
    },
    {
      q: 'Which Instagram URL formats are supported?',
      a: 'We support: Reels (/reel/ and /reels/), standard posts (/p/), and IGTV (/tv/). Paste the full URL from Instagram\'s share button (e.g. https://www.instagram.com/reel/ABC123/).'
    },
    {
      q: 'Can I download Instagram Reels on iPhone or Android?',
      a: 'Yes! Open Instagram, tap the Share icon (three dots or paper plane) on any reel, select "Copy Link", then paste it into the box above. After downloading, the video will be saved to your device gallery or Downloads folder.'
    },
    {
      q: 'Can I download private account reels or posts?',
      a: 'No. We only process publicly available content. Private account reels, login-required content, and Stories cannot be downloaded to respect privacy guidelines.'
    },
    {
      q: 'Can I also download the reel thumbnail or cover image?',
      a: 'Yes! When a reel is processed, we provide both the video download and the thumbnail/cover image download separately.'
    },
    {
      q: 'What video quality will I get?',
      a: 'We download the highest available quality that Instagram publicly serves — typically 720p or 1080p MP4 depending on the original upload. Quality options are shown after fetching the reel info.'
    },
    {
      q: 'Is it legal to download Instagram Reels?',
      a: 'Downloading Instagram content may violate Instagram\'s Terms of Service unless you have the content creator\'s explicit permission or the content is under a Creative Commons license. Only download reels for personal, offline viewing. Never redistribute, re-upload, or use downloaded content commercially without the creator\'s written consent.'
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Instagram Reels Downloader',
    url: 'https://protoolbox.in/tools/instagram-reels-downloader',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    description: 'Free online Instagram Reels Downloader. Save public Instagram Reels and posts as MP4 video and thumbnail image. No login or sign-up required.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="tool-inner">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

      {/* ── INPUT CARD ── */}
      <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', marginBottom: '2rem' }}>
        <form onSubmit={handleFetchMedia}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="ig-url-input"
              style={{ display: 'block', fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.5rem', fontSize: '1rem' }}
            >
              Paste Instagram Reel or Post Link
            </label>
            <div className="pinterest-input-row">
              <div className="pinterest-input-wrapper">
                <input
                  id="ig-url-input"
                  type="url"
                  className="input"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/ABC123def/ or /p/... or /reels/..."
                  style={{ width: '100%', height: '50px', fontSize: '0.95rem', paddingRight: '90px' }}
                  required
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: pastedFeedback ? 'var(--success-color,#22c55e)' : 'var(--primary-color,#6366f1)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: '5px', fontSize: '0.82rem', fontWeight: 600, transition: 'background 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {pastedFeedback
                    ? <><Check size={14} /> Pasted</>
                    : <><Clipboard size={14} /> Paste</>}
                </button>
              </div>
              <button
                type="submit"
                className="btn btn-primary pinterest-submit-btn"
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '50px', whiteSpace: 'nowrap' }}
              >
                {isLoading
                  ? <><RefreshCw size={16} className="spin-icon" /> Fetching…</>
                  : <><InstagramIcon size={16} /> Fetch Reel</>}
              </button>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 16px', borderRadius: '10px', marginTop: '10px',
                background: errorCode === 'PROVIDER_UNCONFIGURED'
                  ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${errorCode === 'PROVIDER_UNCONFIGURED' ? '#fbbf24' : '#fca5a5'}`,
                color: errorCode === 'PROVIDER_UNCONFIGURED' ? '#92400e' : '#dc2626',
                fontSize: '0.9rem',
              }}
            >
              {errorCode === 'PROVIDER_UNCONFIGURED'
                ? <WifiOff size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                : <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />}
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ width: 140, height: 200, background: '#e2e8f0', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ height: 20, background: '#e2e8f0', borderRadius: 6, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 6, width: '70%', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 6, width: '50%', marginTop: 8, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 36, background: '#e2e8f0', borderRadius: 8, marginTop: 20, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* ── RESULT CARD ── */}
        {result && result.ok && (
          <div style={{ marginTop: '1.75rem' }}>
            {/* Media info row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {result.thumbnail && (
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={result.thumbnail}
                    alt={result.title || 'Instagram reel thumbnail'}
                    style={{
                      width: 'clamp(120px, 20%, 180px)',
                      aspectRatio: '9/16',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color,#e2e8f0)',
                      display: 'block'
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 160 }}>
                {/* Media type badge */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {mediaType && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'linear-gradient(135deg,#f093fb,#f5576c)',
                      color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
                    }}>
                      {mediaType === 'reel' && <Film size={12} />}
                      {mediaType === 'post' && <ImageIcon size={12} />}
                      {mediaType === 'igtv' && <Eye size={12} />}
                      {mediaType.toUpperCase()}
                    </span>
                  )}
                  {videoItems.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                      <Film size={12} /> {videoItems.length} video option{videoItems.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {imageItems.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--primary-bg,#eef2ff)', color: 'var(--primary-color,#6366f1)', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                      <ImageIcon size={12} /> Thumbnail
                    </span>
                  )}
                </div>

                {/* Title / caption */}
                {result.title && (
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-color)', margin: '0 0 8px', lineHeight: 1.5 }}>
                    {result.title.length > 120 ? result.title.substring(0, 120) + '…' : result.title}
                  </p>
                )}

                {/* Shortcode badge */}
                {shortcode && (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 12px' }}>
                    Shortcode: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{shortcode}</code>
                  </p>
                )}

                {/* Primary download button — first video item */}
                {videoItems[0] && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleDownload(videoItems[0], 'video')}
                    disabled={downloadingUrl === videoItems[0].url}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '44px', fontSize: '0.9rem' }}
                  >
                    {downloadingUrl === videoItems[0].url
                      ? <><RefreshCw size={15} className="spin-icon" /> {downloadStatus || 'Downloading…'}</>
                      : <><Download size={15} /> Download Video</>}
                  </button>
                )}
              </div>
            </div>

            {/* All video options */}
            {videoItems.length > 1 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#64748b', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Film size={14} /> All Quality Options
                </p>
                <div className="pinterest-result-grid" style={{ gap: '10px' }}>
                  {videoItems.map((item, idx) => {
                    const isDownloading = downloadingUrl === item.url;
                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-color,#e2e8f0)', borderRadius: '10px',
                          padding: '12px 14px', background: 'var(--card-bg,#fff)',
                          display: 'flex', flexDirection: 'column', gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color)' }}>{item.quality}</span>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 7px', borderRadius: 12, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>
                            {item.format}
                          </span>
                        </div>
                        {item.size && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.size}</span>}
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDownload(item, `${item.quality.replace(/\s+/g, '_')}`)}
                          disabled={isDownloading}
                          style={{ marginTop: '4px', height: '34px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          {isDownloading
                            ? <><RefreshCw size={13} className="spin-icon" /> {downloadStatus || 'Downloading…'}</>
                            : <><Download size={13} /> Download</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thumbnail download */}
            {imageItems.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#64748b', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ImageIcon size={14} /> Thumbnail / Cover Image
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {imageItems.map((item, idx) => {
                    const isDownloading = downloadingUrl === item.url;
                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-color,#e2e8f0)', borderRadius: '10px',
                          padding: '12px 16px', background: 'var(--card-bg,#fff)',
                          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
                        }}
                      >
                        <ImageIcon size={16} color="#6366f1" />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-color)' }}>{item.quality}</span>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 7px', borderRadius: 12, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>
                          {item.format}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDownload(item, `thumbnail_${idx}`)}
                          disabled={isDownloading}
                          style={{ height: '34px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          {isDownloading
                            ? <><RefreshCw size={13} className="spin-icon" /> {downloadStatus || 'Downloading…'}</>
                            : <><Download size={13} /> Download Thumbnail</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No items fallback */}
            {videoItems.length === 0 && imageItems.length === 0 && (
              <div style={{ padding: '16px', background: 'rgba(234,179,8,0.08)', borderRadius: '10px', border: '1px solid #fbbf24', color: '#92400e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} /> No downloadable media found for this post.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FEATURES ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: <Film size={22} color="#6366f1" />,      title: 'HD Reels',          desc: 'Up to 1080p MP4' },
          { icon: <ImageIcon size={22} color="#6366f1" />, title: 'Thumbnail',          desc: 'Cover image download' },
          { icon: <Sparkles size={22} color="#6366f1" />,  title: 'Posts & IGTV',      desc: '/p/ and /tv/ URLs' },
          { icon: <ShieldCheck size={22} color="#6366f1" />, title: 'Public Only',    desc: 'No login required' },
        ].map((f, i) => (
          <div key={i} className="card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flexShrink: 0 }}>{f.icon}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color)' }}>{f.title}</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEO GUIDE ── */}
      <div className="card" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* How to Use */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <InstagramIcon size={22} color="#e1306c" /> How to Download Instagram Reels (Free, No Login)
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem' }}>
            ProToolBox Instagram Reels Downloader lets you save public Instagram Reels, posts, and IGTV videos directly in your browser — no app install, no login, no watermark, completely free. Here's how:
          </p>
          <ol style={{ paddingLeft: '1.5rem', color: '#475569', lineHeight: 1.9, margin: 0 }}>
            <li><strong>Copy the Instagram link</strong> — Open Instagram (app or website), tap the three-dot menu (⋯) on any public reel or post, and select <em>"Copy Link"</em>.</li>
            <li><strong>Paste the link above</strong> — Tap the <em>Paste</em> button or press Ctrl+V to paste the URL into the input box.</li>
            <li><strong>Click "Fetch Reel"</strong> — Our server retrieves the reel metadata and downloadable media streams.</li>
            <li><strong>Download Video &amp; Thumbnail</strong> — Click <em>Download Video</em> for the MP4 file and <em>Download Thumbnail</em> for the cover image.</li>
          </ol>
        </section>

        {/* Supported URL formats */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Supported Instagram URL Formats
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Instagram Reels',       example: 'instagram.com/reel/ABC123def/' },
              { label: 'Reels (alternate URL)', example: 'instagram.com/reels/ABC123def/' },
              { label: 'Standard Posts',        example: 'instagram.com/p/ABC123def/' },
              { label: 'IGTV Videos',           example: 'instagram.com/tv/ABC123def/' },
            ].map((u, i) => (
              <div key={i} style={{ background: 'rgba(225,48,108,0.04)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(225,48,108,0.12)' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.88rem', color: '#e1306c' }}>{u.label}</p>
                <code style={{ fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all' }}>{u.example}</code>
              </div>
            ))}
          </div>
        </section>

        {/* What can't be downloaded */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Content That Cannot Be Downloaded
          </h3>
          <ul style={{ paddingLeft: '1.5rem', color: '#475569', lineHeight: 1.9, margin: 0 }}>
            <li><strong>Private account content</strong> — Any reel or post from a private account requires login and cannot be accessed.</li>
            <li><strong>Stories &amp; Highlights</strong> — Instagram Stories and Highlight reels are session-authenticated and not publicly accessible.</li>
            <li><strong>Live streams</strong> — Active Instagram Live broadcasts cannot be downloaded.</li>
            <li><strong>Paid partnerships / Subscriptions</strong> — Content gated behind Instagram Subscriptions cannot be downloaded.</li>
            <li><strong>DM / Close Friends content</strong> — Restricted audience content is not publicly accessible.</li>
          </ul>
        </section>

        {/* How to get the link on mobile */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            How to Copy a Reel Link on Your Phone
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {[
              {
                platform: '📱 iPhone (iOS)',
                steps: [
                  'Open Instagram app',
                  'Find the Reel you want to save',
                  'Tap the three dots (⋯) or paper plane icon',
                  'Tap "Copy Link"',
                  'Paste in ProToolBox above'
                ]
              },
              {
                platform: '🤖 Android',
                steps: [
                  'Open Instagram app',
                  'Find the Reel you want to save',
                  'Tap the three dots (⋯) or Share icon',
                  'Tap "Copy Link"',
                  'Paste in ProToolBox above'
                ]
              },
            ].map((p, i) => (
              <div key={i} style={{ background: 'rgba(99,102,241,0.04)', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.6rem', color: '#0f172a', fontSize: '0.95rem' }}>{p.platform}</p>
                <ol style={{ paddingLeft: '1.2rem', margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.8 }}>
                  {p.steps.map((s, si) => <li key={si}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & legal */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Privacy, Safety &amp; Legal Notice
          </h3>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem' }}>
            ProToolBox processes your request server-side and immediately discards the data. We do not store any video content, metadata, or downloaded files beyond the duration of your request. No cookies, no tracking, no account required.
          </p>
          <div style={{ background: 'rgba(99,102,241,0.05)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
              <ShieldCheck size={16} /> Responsible Use Guidelines
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
              Always credit the original creator. Do not re-upload downloaded reels to other platforms, claim them as your own, or use them for commercial purposes without written permission from the copyright holder. Instagram content is owned by its creators — download only for personal, offline viewing.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={20} color="#6366f1" /> Frequently Asked Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--border-color,#e2e8f0)', borderRadius: '10px', overflow: 'hidden' }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.98rem', fontWeight: 600,
                      color: 'var(--text-color,#0f172a)', gap: '12px'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen
                      ? <ChevronUp size={18} color="#6366f1" />
                      : <ChevronDown size={18} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 18px', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Related tools */}
        <section style={{ padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Explore Other Downloader &amp; Media Tools
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Save and process media from other platforms:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href="/tools/pinterest-image-downloader" className="btn btn-secondary btn-sm">Pinterest Downloader</a>
            <a href="/tools/youtube-video-downloader" className="btn btn-secondary btn-sm">YouTube Downloader</a>
            <a href="/tools/video-player" className="btn btn-secondary btn-sm">Online Video Player</a>
            <a href="/tools/image-compressor" className="btn btn-secondary btn-sm">Image Compressor</a>
            <a href="/tools/video-metadata-viewer" className="btn btn-secondary btn-sm">Video Metadata Viewer</a>
            <a href="/tools/background-remover" className="btn btn-secondary btn-sm">Background Remover</a>
          </div>
        </section>
      </div>
    </div>
  );
}
