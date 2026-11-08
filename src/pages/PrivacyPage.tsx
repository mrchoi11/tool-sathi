import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export default function PrivacyPage() {
  usePageSeo(
    'page-privacy',
    'Privacy Policy — ToolSathi',
    'ToolSathi privacy policy: discover how client-side in-browser processing keeps your files and personal data 100% private.'
  );

  return (
    <div className="container" style={{ padding: 'var(--space-xl) var(--space-md) var(--space-4xl)', maxWidth: '840px', position: 'relative', zIndex: 1 }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>Privacy Policy</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.15)' }}>
          <Shield size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 850, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Privacy Policy</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Last updated: 2026</p>
        </div>
      </div>

      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xl)',
        lineHeight: 1.7,
        color: '#334155'
      }}>
        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>1. Client-Side Processing First</h2>
          <p>
            At ToolSathi, your privacy is our architectural priority. The vast majority of our utilities—including image compression, video playback, PDF merging/splitting, QR code generation, and text formatting—run <strong>100% locally in your browser</strong> using WebAssembly, HTML5 APIs, and JavaScript. Your files never touch external servers.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>2. Information We Do Not Collect</h2>
          <p>
            We do not log file contents, store uploaded media, or inspect personal documents. When you drag and drop an image, PDF, or text file into a tool, the data is retained exclusively in your device's temporary memory and discarded as soon as you close or refresh the tab.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>3. External Video & Stream Links</h2>
          <p>
            When utilizing player tools with third-party URLs (such as direct MP4 links, HLS streams, or shared links), your browser directly fetches stream segments from the respective host CDN. ToolSathi does not host or proxy copyrighted audiovisual media.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>4. Cookies and Local Storage</h2>
          <p>
            We use minimal local storage purely to remember user preferences (such as recently used tools). No tracking cookies are used to build personal profiles.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>5. Contact Information</h2>
          <p>
            If you have any questions or security concerns regarding ToolSathi's privacy standards, please reach out to our team at policyian@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
