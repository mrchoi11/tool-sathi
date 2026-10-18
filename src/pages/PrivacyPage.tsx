import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-2xl) var(--space-md) var(--space-4xl)', maxWidth: '800px' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
        <ChevronRight size={14} style={{ color: 'var(--color-text-dim)' }} />
        <span style={{ color: 'var(--color-text)' }}>Privacy Policy</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
          <Shield size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Last updated: October 2026</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>1. Client-Side Processing First</h2>
          <p>
            At ToolSathi, your privacy is our architectural foundation. The vast majority of our utilities—including image compression, video playback, PDF merging/splitting, QR code generation, and text formatting—run <strong>100% locally in your browser</strong> using WebAssembly, HTML5 APIs, and JavaScript. Your files never touch our servers unless explicitly required for external service bridging.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>2. Information We Do Not Collect</h2>
          <p>
            We do not log file contents, store uploaded media, or inspect personal documents. When you drag and drop an image, PDF, or text file into a tool, the data is retained exclusively in your device's temporary memory and discarded as soon as you close or refresh the tab.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>3. External Video & Stream Links</h2>
          <p>
            When utilizing player tools with third-party URLs (such as direct MP4 links, HLS streams, or TeraBox shared links), your browser directly fetches stream segments from the respective host CDN. ToolSathi does not host or proxy copyrighted audiovisual media.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>4. Cookies and Local Storage</h2>
          <p>
            We may use minimal local storage purely to remember user preferences (such as light/dark mode preference or recently used tools). No tracking cookies are used to build personal profiles.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>5. Contact Information</h2>
          <p>
            If you have any questions or security concerns regarding ToolSathi's privacy standards, please reach out to our team at support@toolsathi.local.
          </p>
        </section>
      </div>
    </div>
  );
}
