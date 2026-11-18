import React, { useState } from 'react';
import {
  Download, Image as ImageIcon, Clipboard, Check, AlertCircle, RefreshCw,
  Sparkles, ExternalLink, ShieldCheck, Film, HelpCircle, ChevronDown, ChevronUp,
  Sliders, Layers, Eye
} from 'lucide-react';
import { resolveMediaUrl, downloadMediaFile, type DownloadResult, type DownloadItem } from '../services/downloaderService';
import './tools.css';

export default function PinterestImageDownloader() {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Clipboard Paste handler
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text.trim());
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch {
      // Ignore clipboard permission blocks
    }
  };

  // Fetch Pin Media
  const handleFetchMedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = inputUrl.trim();
    if (!cleanUrl) {
      setErrorMessage('Please enter or paste a valid Pinterest pin link.');
      return;
    }

    if (!cleanUrl.includes('pinterest.com') && !cleanUrl.includes('pin.it')) {
      setErrorMessage('Please enter a valid Pinterest link (e.g. pinterest.com/pin/... or pin.it/...).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    const res = await resolveMediaUrl(cleanUrl);
    setIsLoading(false);

    if (res.ok) {
      setResult(res);
    } else {
      if (res.error?.code === 'RATE_LIMIT') {
        setErrorMessage('Rate limit reached. Please wait a minute and try again.');
      } else if (res.error?.code === 'NOT_FOUND') {
        setErrorMessage('Could not load this pin. It may be set to private, deleted, or requires a user login.');
      } else {
        setErrorMessage(res.error?.message || 'Failed to extract Pinterest media. Please verify the URL and try again.');
      }
    }
  };

  // Download Trigger
  const handleDownload = async (item: DownloadItem, index: number) => {
    setDownloadingUrl(item.url);
    const ext = item.format.toLowerCase();
    const safeTitle = (result?.title || (item.type === 'video' ? 'pinterest_video' : 'pinterest_image'))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .substring(0, 40);
    const suffix = item.type === 'video' ? 'video' : (item.quality.toLowerCase().includes('original') ? 'original' : 'hd');
    const filename = `${safeTitle}_${suffix}.${ext}`;

    await downloadMediaFile(item.url, filename, (status) => {
      setDownloadStatus(status);
    });

    setTimeout(() => {
      setDownloadingUrl(null);
      setDownloadStatus('');
    }, 2500);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // FAQ Schema JSON-LD
  const faqs = [
    {
      q: 'Is this Pinterest Image Downloader free to use?',
      a: 'Yes, ProToolBox Pinterest Image Downloader is 100% free with no subscription, sign-up, or software installation required. You can download original high-resolution pictures as often as needed.'
    },
    {
      q: 'How do I download Pinterest photos on iPhone or Android mobile devices?',
      a: 'Open the Pinterest app or mobile website, tap the Share icon on your desired pin, and select "Copy Link". Then paste the link into the box above and tap "Fetch Image". Finally, tap "Download Image" to save the photo directly to your device Photos or Downloads folder.'
    },
    {
      q: 'What image quality and resolutions will I receive?',
      a: 'Our tool automatically analyzes the Pinterest asset manifest and extracts the original full-resolution picture (often exceeding 1080p, 2K, or 4K depending on the upload) alongside standard 736p HD versions.'
    },
    {
      q: 'Can I download private Pinterest boards or secret pins?',
      a: 'No. To respect user privacy and security guidelines, our tool only accesses publicly available pins. Secret boards, private personal collections, or content locked behind login walls cannot be retrieved.'
    },
    {
      q: 'Does this tool work with pin.it short links?',
      a: 'Yes! Both full desktop URLs (pinterest.com/pin/...) and mobile short links (pin.it/...) are automatically expanded and resolved.'
    },
    {
      q: 'Can I download video pins and GIFs using this downloader?',
      a: 'This tool is specifically designed for high-resolution images, illustrations, and posters. For video pins, it extracts the maximum-resolution thumbnail image. If an unencrypted standalone MP4 file is publicly hosted on the pin, it will also be provided.'
    },
    {
      q: 'What should I keep in mind regarding copyright and image attribution?',
      a: 'Pinterest content is created by talented independent designers, photographers, and artists. Please only download media for personal inspiration, offline study, or with proper creator attribution and permission.'
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map((f) => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.a
      }
    }))
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Pinterest Image Downloader',
    'url': 'https://protoolbox.in/tools/pinterest-image-downloader',
    'applicationCategory': 'MultimediaApplication',
    'operatingSystem': 'All',
    'description': 'Free online Pinterest Image Downloader. Save full-resolution photos, aesthetic wallpapers, illustrations, and pin covers directly in your browser.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    }
  };

  return (
    <div className="tool-inner">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      {/* ── TOOL INPUT CARD ── */}
      <div className="downloader-hero-card">
        <form onSubmit={handleFetchMedia}>
          <div>
            <label
              htmlFor="pinterest-url-input"
              className="downloader-label"
            >
              Paste Pinterest Pin Link
            </label>
            <div className="downloader-input-row">
              <div className="downloader-input-wrapper">
                <input
                  id="pinterest-url-input"
                  type="url"
                  className="downloader-input"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste Pinterest link (e.g. pinterest.com/pin/... or pin.it/...)"
                  required
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className={`downloader-paste-btn ${pastedFeedback ? 'active' : 'idle'}`}
                  title="Paste from clipboard"
                >
                  {pastedFeedback ? <><Check size={14} color="#fff" /> Pasted</> : <><Clipboard size={14} /> Paste</>}
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary downloader-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Fetch Media</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error Notification */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#dc2626',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => handleFetchMedia()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                color: '#dc2626',
                padding: '4px 10px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div style={{ marginTop: '1.5rem', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
            <div className="loading-ring" style={{ margin: '0 auto 1rem' }}></div>
            <h4 style={{ margin: '0 0 6px', color: 'var(--text-color)' }}>Analyzing Pinterest Pin...</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Resolving redirect targets and extracting highest resolution asset URLs.
            </p>
          </div>
        )}

        {/* ── RESULT CARD ── */}
        {result && (
          <div style={{
            marginTop: '1.5rem',
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
          }}>
            <div className="pinterest-result-grid">
              {/* Preview Thumbnail Container */}
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#0f172a',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '440px'
              }}>
                {result.thumbnail ? (
                  <img
                    src={result.thumbnail}
                    alt={result.title || 'Pinterest Download Preview'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '440px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ padding: '3rem', color: '#94a3b8', textAlign: 'center' }}>
                    <ImageIcon size={48} style={{ opacity: 0.5, margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Media Preview</p>
                  </div>
                )}
              </div>

              {/* Download Details & Action Buttons */}
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(230, 0, 35, 0.1)',
                  color: '#e60023',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '10px'
                }}>
                  {result.isVideoPin ? 'Pinterest Video Pin' : 'Pinterest Pin'}
                </span>

                <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', color: 'var(--text-color)', lineHeight: 1.4 }}>
                  {result.title || 'Pinterest Image'}
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Original quality media detected. Select your preferred resolution below to download directly to your device:
                </p>

                {/* Video Pin Notice */}
                {result.notice && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#b45309',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '1.25rem'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span><strong>Notice:</strong> {result.notice}</span>
                  </div>
                )}

                {/* Download Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                  {result.items && result.items.length > 0 ? (
                    result.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="downloader-audio-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: item.type === 'video' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(6, 182, 212, 0.1)', color: item.type === 'video' ? '#6366f1' : '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {item.type === 'video' ? <Film size={18} /> : <ImageIcon size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-color)' }}>
                              {item.quality}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Format: <strong>{item.format}</strong> {item.type === 'video' ? '• Video Stream' : '• High-Res Image'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={downloadingUrl === item.url}
                          onClick={() => handleDownload(item, idx)}
                          style={{
                            minHeight: '38px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            borderRadius: '10px',
                            padding: '0 16px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {downloadingUrl === item.url ? (
                            <>
                              <RefreshCw size={14} className="spin" />
                              <span>{downloadStatus || 'Saving...'}</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Download {item.type === 'video' ? 'Video' : 'Image'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No downloadable assets discovered for this pin.</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: '10px', height: '36px' }}
                    onClick={() => {
                      setResult(null);
                      setInputUrl('');
                    }}
                  >
                    Download Another Pin
                  </button>
                  <a
                    href={inputUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', height: '36px' }}
                  >
                    <span>View on Pinterest</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LEGAL DISCLAIMER ── */}
        <div style={{
          marginTop: '1.75rem',
          padding: '12px 16px',
          background: 'rgba(100, 116, 139, 0.06)',
          borderRadius: '8px',
          borderLeft: '3px solid #64748b',
          fontSize: '0.8rem',
          color: '#64748b',
          lineHeight: 1.5
        }}>
          <strong>Legal Disclaimer:</strong> Please only download images and media that you own, have created, or have received explicit permission to save from the copyright holder. ProToolBox does not host, store, or archive copyrighted media files on its servers. This utility operates strictly as a client-assisted browser tool and is not affiliated with, sponsored by, or endorsed by Pinterest, Inc.
        </div>
      </div>

      {/* ── SEO ARTICLE & EDUCATIONAL GUIDE (900-1200 WORDS) ── */}
      <div className="tool-seo-guide" style={{ marginTop: '3rem', lineHeight: 1.8, color: '#334155' }}>
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Pinterest Image Downloader – Save Pinterest Images in Full HD
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#475569' }}>
            Looking for a fast, free, and secure way to save stunning high-resolution photography, aesthetic wallpapers, infographics, and design illustrations from Pinterest? The <strong>Pinterest Image Downloader</strong> by ProToolBox empowers creators, educators, students, and digital mood-boarders to extract original-quality images straight from any public pin link. Whether you are using a mobile browser, tablet, or desktop workstation, our tool effortlessly resolves pin links and lets you download crisp, uncompressed pictures directly to your device storage without annoying watermarks or quality degradation.
          </p>
        </section>

        {/* How It Works Steps */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            How to Download Pinterest Images in 4 Easy Steps
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '0.75rem' }}>1</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#0f172a' }}>Copy the Pin Link</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Open Pinterest on your browser or app. Navigate to the pin you wish to save, tap the share icon, and select <strong>Copy Link</strong>.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '0.75rem' }}>2</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#0f172a' }}>Paste the URL Above</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Paste the copied Pinterest link into the search input box at the top of this page or tap the quick <strong>Paste</strong> button.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '0.75rem' }}>3</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#0f172a' }}>Analyze and Inspect</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Click <strong>Fetch Image</strong>. Our cloud engine inspects the asset container to pinpoint the original uncompressed source file.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '0.75rem' }}>4</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#0f172a' }}>Save to Your Device</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Select <strong>Original (Highest Resolution)</strong> or Standard HD and click <strong>Download Image</strong> to save the JPG file immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Why Use This Tool */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Why Choose ProToolBox for Pinterest Downloads?
          </h3>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li>
              <strong>Uncompromised Original Resolution:</strong> Normal browser screenshots or mobile saves often compress images down to low resolutions. ProToolBox retrieves the master asset directly from Pinterest CDN servers (`i.pinimg.com/originals/`) for pixel-perfect sharpness.
            </li>
            <li>
              <strong>Short Link &amp; App Compatibility:</strong> Seamlessly resolves mobile <code>pin.it/...</code> short share links without forcing you to manually open redirect chains.
            </li>
            <li>
              <strong>Zero Software or Extension Clutter:</strong> Completely web-based. No sketchy desktop software, browser add-ons, or mobile APKs that compromise your device safety or drain battery life.
            </li>
            <li>
              <strong>Instant Direct File Downloads:</strong> Our server attachment protocol triggers genuine browser file downloads rather than redirecting you to dead preview tabs.
            </li>
            <li>
              <strong>Strict Privacy &amp; Data Security:</strong> We do not log your queries, build user tracking profiles, or store downloaded media on our servers.
            </li>
          </ul>
        </section>

        {/* Common Creative Use Cases */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Popular Use Cases &amp; Responsible Usage
          </h3>
          <p>
            Visual discovery is at the heart of creative workflows. Whether you are assembling architecture mood-boards, organizing cooking recipe cards, gathering color palette inspiration for web design, or backing up reference assets for personal sketchbooks, having offline access to full-definition visual assets is essential.
          </p>
          <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)', marginTop: '1rem' }}>
            <h4 style={{ margin: '0 0 8px', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} /> Best Practices for Responsible Image Saving
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
              Always celebrate and respect the intellectual property of original photographers, illustrators, and brands. If you share saved images on blogs or social media, always tag and credit the original creator. Do not re-sell, redistribute, or use proprietary Pinterest artwork for commercial products without written licensing from the copyright holder.
            </p>
          </div>
        </section>

        {/* ── FAQ ACCORDION ── */}
        <section style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
            Frequently Asked Questions (FAQs)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--card-bg, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.98rem',
                      fontWeight: 600,
                      color: 'var(--text-color, #0f172a)',
                      gap: '12px'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="#6366f1" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 18px',
                      color: '#475569',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(0,0,0,0.04)'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Related ProToolBox Tools */}
        <section style={{ padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            Explore Complementary Creative Image Tools
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Once you have downloaded your Pinterest pictures, optimize and convert them with our free browser utilities:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href="/tools/image-compressor" className="btn btn-secondary btn-sm">Image Compressor</a>
            <a href="/tools/image-resizer" className="btn btn-secondary btn-sm">Image Resizer</a>
            <a href="/tools/webp-converter" className="btn btn-secondary btn-sm">WebP Converter</a>
            <a href="/tools/background-remover" className="btn btn-secondary btn-sm">AI Background Remover</a>
            <a href="/tools/image-cropper" className="btn btn-secondary btn-sm">Image Cropper</a>
            <a href="/tools/favicon-generator" className="btn btn-secondary btn-sm">Favicon Generator</a>
            <a href="/tools/social-media-image-resizer" className="btn btn-secondary btn-sm">Social Media Resizer</a>
          </div>
        </section>
      </div>
    </div>
  );
}
