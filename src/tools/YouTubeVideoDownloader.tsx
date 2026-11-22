import React, { useState } from 'react';
import {
  Download, PlayCircle, Clipboard, Check, AlertCircle, RefreshCw,
  Sparkles, ShieldCheck, HelpCircle, ChevronDown, ChevronUp,
  Music, Film, Clock, Eye, WifiOff, Info
} from 'lucide-react';
import { resolveMediaUrl, downloadMediaFile, type DownloadResult, type DownloadItem } from '../services/downloaderService';
import './tools.css';

// YouTube URL validation
function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    return host === 'youtube.com' || host === 'youtu.be';
  } catch {
    return false;
  }
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null;
    if (host === 'youtube.com') {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1]?.split('?')[0] || null;
      return u.searchParams.get('v') || null;
    }
  } catch { /* ignore */ }
  return null;
}

function isShorts(url: string): boolean {
  try { return new URL(url).pathname.startsWith('/shorts/'); } catch { return false; }
}

export default function YouTubeVideoDownloader() {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);

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
      setErrorMessage('Please enter or paste a valid YouTube link.');
      setErrorCode(null);
      return;
    }
    if (!isYouTubeUrl(cleanUrl)) {
      setErrorMessage('Please enter a valid YouTube link (e.g. youtube.com/watch?v=... or youtu.be/... or youtube.com/shorts/...).');
      setErrorCode('INVALID_URL');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(null);
    setResult(null);
    setSelectedQuality(null);

    const res = await resolveMediaUrl(cleanUrl);
    setIsLoading(false);

    if (res.ok) {
      setResult(res);
      // Auto-select first video item
      const firstVideo = res.items?.find(i => i.type === 'video');
      if (firstVideo) setSelectedQuality(firstVideo.quality);
    } else {
      const code = res.error?.code ?? 'UNKNOWN';
      setErrorCode(code);
      const msgMap: Record<string, string> = {
        PROVIDER_UNCONFIGURED: 'YouTube Downloader is temporarily unavailable while we finalize the backend integration. Please try again soon.',
        PRIVATE_VIDEO: 'This video is private or members-only and cannot be downloaded.',
        AGE_RESTRICTED: 'This video has age restrictions. We do not process age-restricted content.',
        MEMBERS_ONLY: 'This video is for channel members only and cannot be downloaded.',
        LIVE_STREAM: 'Live streams cannot be downloaded. Please try after the stream ends.',
        DRM_PROTECTED: 'This video is DRM-protected and cannot be downloaded.',
        NOT_FOUND: 'This video was not found. It may have been deleted or made private.',
        RATE_LIMIT: 'Too many requests. Please wait a minute and try again.',
        UNSUPPORTED_DOMAIN: 'Only YouTube links (youtube.com, youtu.be) are supported.',
      };
      setErrorMessage(msgMap[code] ?? (res.error?.message || 'Failed to process this YouTube link. Please verify the URL and try again.'));
    }
  };

  const handleDownload = async (item: DownloadItem) => {
    setDownloadingUrl(item.url);
    const ext = item.format.toLowerCase();
    const safeTitle = (result?.title || 'youtube_video')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .substring(0, 40);
    const qualityTag = item.quality.toLowerCase().replace(/\s+/g, '_');
    const filename = `${safeTitle}_${qualityTag}.${ext}`;

    await downloadMediaFile(item.url, filename, (status) => {
      setDownloadStatus(status);
    }, item.audioUrl);

    setTimeout(() => {
      setDownloadingUrl(null);
      setDownloadStatus('');
    }, 2500);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Video items sorted: videos first (highest quality), then audio
  const videoItems = result?.items?.filter(i => i.type === 'video') ?? [];
  const audioItems = result?.items?.filter(i => i.type === 'audio') ?? [];
  const selectedItem = result?.items?.find(i => i.quality === selectedQuality) ?? null;

  const faqs = [
    {
      q: 'Is this YouTube Video Downloader free to use?',
      a: 'Yes, ProToolBox YouTube Video Downloader is 100% free with no sign-up, subscription, or software installation required. Simply paste the video link and download in your preferred quality.'
    },
    {
      q: 'Which YouTube URL formats are supported?',
      a: 'We support all standard YouTube formats: regular videos (youtube.com/watch?v=...), short links (youtu.be/...), YouTube Shorts (youtube.com/shorts/...), and mobile links (m.youtube.com/watch?v=...).'
    },
    {
      q: 'What video quality options are available?',
      a: 'Available quality options depend on the original upload: 144p, 360p, 480p, 720p HD, 1080p Full HD. Audio-only downloads are available as MP3 or M4A. Options are shown after fetching the video info.'
    },
    {
      q: 'Can I download YouTube Shorts?',
      a: 'Yes! YouTube Shorts URLs (youtube.com/shorts/...) are fully supported and go through the same quality selection and download flow as regular videos.'
    },
    {
      q: 'Can I download private or age-restricted videos?',
      a: 'No. We only process publicly available videos. Private videos, members-only content, age-restricted videos, and live streams cannot be downloaded to protect user privacy and platform policies.'
    },
    {
      q: 'How do I download audio only (MP3) from a YouTube video?',
      a: 'After fetching the video info, scroll down to the Audio section in the quality selector and choose MP3 or M4A format. Click Download to save the audio track.'
    },
    {
      q: 'Is it legal to download YouTube videos?',
      a: 'Downloading YouTube videos may violate YouTube\'s Terms of Service unless you have explicit permission from the content creator or the video is licensed under Creative Commons. Use this tool for personal, offline viewing of content you have the right to access. Do not use downloaded content for commercial redistribution.'
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
    name: 'YouTube Video Downloader',
    url: 'https://protoolbox.in/tools/youtube-video-downloader',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    description: 'Free online YouTube Video Downloader. Download public YouTube videos and Shorts in MP4 HD quality or extract audio as MP3. No sign-up required.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };

  return (
    <div className="tool-inner">
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

      {/* ── TOOL INPUT CARD ── */}
      <div className="downloader-hero-card">
        <form onSubmit={handleFetchMedia}>
          <div>
            <label
              htmlFor="yt-url-input"
              className="downloader-label"
            >
              Paste YouTube Video or Shorts Link
            </label>
            <div className="downloader-input-row">
              <div className="downloader-input-wrapper">
                <input
                  id="yt-url-input"
                  type="url"
                  className="downloader-input"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="Paste YouTube or Shorts URL (e.g. youtube.com/shorts/...)"
                  required
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className={`downloader-paste-btn ${pastedFeedback ? 'active' : 'idle'}`}
                >
                  {pastedFeedback ? <><Check size={14} /> Pasted</> : <><Clipboard size={14} /> Paste</>}
                </button>
              </div>
              <button
                type="submit"
                className="btn btn-primary downloader-submit-btn"
                disabled={isLoading}
              >
                {isLoading
                  ? <><RefreshCw size={16} className="spin-icon" /> Fetching…</>
                  : <><PlayCircle size={16} /> Fetch Video</>}
              </button>
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 16px', borderRadius: '12px', marginTop: '14px',
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
                <div style={{ width: 220, height: 124, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ height: 22, background: '#e2e8f0', borderRadius: 6, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 6, width: '70%', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 6, width: '50%', marginTop: 8, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* ── RESULT CARD ── */}
        {result && result.ok && (
          <div className="downloader-result-box">
            {/* Video info row */}
            <div className="downloader-media-header">
              {result.thumbnail && (
                <div className="downloader-thumb-wrap" style={{ width: 'clamp(160px, 32%, 240px)' }}>
                  <img
                    src={result.thumbnail}
                    alt={result.title || 'YouTube video thumbnail'}
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="downloader-meta-box">
                {result.title && (
                  <h3 className="downloader-video-title">
                    {result.title}
                  </h3>
                )}
                <div className="downloader-badges-row">
                  {isShorts(inputUrl) && (
                    <span className="downloader-badge-pill" style={{ background: '#fef2f2', color: '#dc2626' }}>
                      <Film size={12} /> Shorts
                    </span>
                  )}
                  {result.duration && (
                    <span className="downloader-badge-pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }}>
                      <Clock size={12} /> {result.duration}
                    </span>
                  )}
                  {videoItems.length > 0 && (
                    <span className="downloader-badge-pill" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                      <Eye size={12} /> {videoItems.length} quality options
                    </span>
                  )}
                </div>
                {/* Video ID badge */}
                {extractVideoId(inputUrl) && (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                    Video ID: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#475569' }}>{extractVideoId(inputUrl)}</code>
                  </p>
                )}
              </div>
            </div>

            {/* Quality selection — Video */}
            {videoItems.length > 0 && (
              <div className="downloader-quality-section">
                <p className="downloader-section-title">
                  <Film size={16} /> Available Video Qualities
                </p>
                <div className="downloader-quality-grid">
                  {videoItems.map((item, idx) => {
                    const isSelected = selectedQuality === item.quality;
                    const isDownloading = downloadingUrl === item.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedQuality(item.quality)}
                        className={`downloader-quality-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="downloader-quality-header">
                            <span className="downloader-quality-name">
                              {item.quality}
                            </span>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {item.isHighest && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 9999 }}>
                                  Highest Quality
                                </span>
                              )}
                              <span className="downloader-format-tag">
                                {item.format}
                              </span>
                            </div>
                          </div>
                          {item.size && <div className="downloader-quality-size">{item.size}</div>}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary downloader-download-btn"
                          onClick={e => { e.stopPropagation(); handleDownload(item); }}
                          disabled={isDownloading}
                        >
                          {isDownloading
                            ? <><RefreshCw size={13} className="spin-icon" /> {downloadStatus || 'Saving…'}</>
                            : <><Download size={13} /> Download</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audio items */}
            {audioItems.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <p className="downloader-section-title">
                  <Music size={16} /> Audio Track
                </p>
                <div className="downloader-audio-grid">
                  {audioItems.map((item, idx) => {
                    const isDownloading = downloadingUrl === item.url;
                    return (
                      <div
                        key={idx}
                        className="downloader-audio-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Music size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{item.quality}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Format: <strong style={{ textTransform: 'uppercase' }}>{item.format}</strong> {item.size ? `• ${item.size}` : ''}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDownload(item)}
                          disabled={isDownloading}
                          style={{ height: '36px', fontSize: '0.82rem', padding: '0 14px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                        >
                          {isDownloading
                            ? <><RefreshCw size={13} className="spin-icon" /> {downloadStatus || 'Saving…'}</>
                            : <><Download size={13} /> Download {item.format.toUpperCase()}</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No items fallback */}
            {videoItems.length === 0 && audioItems.length === 0 && (
              <div style={{ padding: '16px', background: 'rgba(234,179,8,0.08)', borderRadius: '12px', border: '1px solid #fbbf24', color: '#92400e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} /> No downloadable streams found for this video.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FEATURES ROW ── */}
      <div className="downloader-features-grid">
        {[
          { icon: <Film size={20} />, title: 'HD Quality', desc: 'Up to 1080p MP4' },
          { icon: <Music size={20} />, title: 'Audio Only', desc: 'MP3 & M4A tracks' },
          { icon: <Sparkles size={20} />, title: 'Shorts Support', desc: 'Fast shorts extraction' },
          { icon: <ShieldCheck size={20} />, title: 'Public & Safe', desc: 'No login required' },
        ].map((f, i) => (
          <div key={i} className="downloader-feature-card">
            <div className="downloader-feature-icon-wrap">{f.icon}</div>
            <p className="downloader-feature-title">{f.title}</p>
            <p className="downloader-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── SEO GUIDE SECTION ── */}
      <div className="card" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        {/* How to Use */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlayCircle size={22} color="#dc2626" /> How to Download YouTube Videos Online (Free)
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem' }}>
            ProToolBox YouTube Video Downloader lets you save public YouTube videos and Shorts directly in your browser — no software install, no sign-up, completely free. Here's how:
          </p>
          <ol style={{ paddingLeft: '1.5rem', color: '#475569', lineHeight: 1.9, margin: 0 }}>
            <li><strong>Copy the YouTube URL</strong> — Open YouTube, navigate to your video or Short, and copy the URL from your browser's address bar.</li>
            <li><strong>Paste the link</strong> — Click the <em>Paste</em> button above or press Ctrl+V to paste the URL into the input box.</li>
            <li><strong>Click "Fetch Video"</strong> — Our server retrieves the video metadata and available quality streams.</li>
            <li><strong>Select your quality</strong> — Choose MP4 (144p to 1080p) or audio-only (MP3/M4A) based on your needs.</li>
            <li><strong>Download</strong> — Click the Download button for your chosen quality and save the file to your device.</li>
          </ol>
        </section>

        {/* Supported URL formats */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Supported YouTube URL Formats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Standard Video', example: 'youtube.com/watch?v=VIDEO_ID' },
              { label: 'Short Link', example: 'youtu.be/VIDEO_ID' },
              { label: 'YouTube Shorts', example: 'youtube.com/shorts/VIDEO_ID' },
              { label: 'Mobile URL', example: 'm.youtube.com/watch?v=VIDEO_ID' },
            ].map((u, i) => (
              <div key={i} style={{ background: 'rgba(99,102,241,0.05)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.12)' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.88rem', color: '#4f46e5' }}>{u.label}</p>
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
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '0.75rem' }}>
            To respect platform policies and user privacy, the following types of content are not supported:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#475569', lineHeight: 1.9, margin: 0 }}>
            <li><strong>Private videos</strong> — Videos set to Private or Unlisted with restricted access.</li>
            <li><strong>Members-only videos</strong> — Channel membership paywalled content.</li>
            <li><strong>Age-restricted videos</strong> — Content requiring sign-in for age verification.</li>
            <li><strong>Live streams</strong> — Active live broadcasts (try after the stream is over and archived).</li>
            <li><strong>DRM-protected content</strong> — Premium or encrypted content.</li>
          </ul>
        </section>

        {/* Quality guide */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Video Quality & Format Guide</h3>
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--primary-color, #6366f1)', color: '#fff' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Quality</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Format</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Best For</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1080p Full HD', 'MP4', 'High-quality offline viewing, large screens'],
                  ['720p HD', 'MP4', 'Standard quality, balanced file size'],
                  ['480p / 360p', 'MP4', 'Slower connections, limited storage'],
                  ['144p', 'MP4', 'Very low bandwidth or preview use'],
                  ['Audio Only', 'MP3', 'Music, podcasts, lectures — no video track'],
                  ['Audio Only', 'M4A', 'High-quality audio, iOS/Mac compatible'],
                ].map(([q, f, b], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 600 }}>{q}</td>
                    <td style={{ padding: '10px 14px', color: '#6366f1', fontWeight: 600 }}>{f}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Privacy & legal note */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Privacy, Safety &amp; Legal Notice
          </h3>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem' }}>
            ProToolBox processes your request server-side and immediately discards the data — we do not store any video content, metadata, or downloaded files on our servers beyond the duration of your request. No cookies, no tracking, no account required.
          </p>
          <div style={{ background: 'rgba(99,102,241,0.05)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
              <ShieldCheck size={16} /> Responsible Use Guidelines
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
              Downloading YouTube content may violate YouTube's Terms of Service unless you have explicit creator permission or the content is under a Creative Commons license. Only download videos for personal, offline viewing. Never redistribute, re-upload, or use downloaded content commercially without the creator's written consent.
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
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
                  style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '10px', overflow: 'hidden' }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.98rem', fontWeight: 600,
                      color: 'var(--text-color, #0f172a)', gap: '12px'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="#6366f1" /> : <ChevronDown size={18} color="#94a3b8" />}
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
            Save and process media from other platforms with our free browser tools:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href="/tools/pinterest-image-downloader" className="btn btn-secondary btn-sm">Pinterest Downloader</a>
            <a href="/tools/instagram-reels-downloader" className="btn btn-secondary btn-sm">Instagram Reels Downloader</a>
            <a href="/tools/video-player" className="btn btn-secondary btn-sm">Online Video Player</a>
            <a href="/tools/video-metadata-viewer" className="btn btn-secondary btn-sm">Video Metadata Viewer</a>
            <a href="/tools/image-compressor" className="btn btn-secondary btn-sm">Image Compressor</a>
            <a href="/tools/mp3-player" className="btn btn-secondary btn-sm">MP3 Player</a>
          </div>
        </section>
      </div>
    </div>
  );
}
