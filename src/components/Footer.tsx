import { Link } from 'react-router-dom';
import { categories } from '../data/toolRegistry';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="url(#flogo)" />
                <path d="M8 10h12M8 14h8M8 18h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs><linearGradient id="flogo" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
              </svg>
              <span>ToolSathi</span>
            </Link>
            <p className="footer-tagline">Free online tools for everyday tasks. Fast, private, and easy to use.</p>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Categories</h3>
            <ul className="footer-list">
              {categories.slice(0, 6).map(c => (
                <li key={c.id}><Link to={`/category/${c.id}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">More Categories</h3>
            <ul className="footer-list">
              {categories.slice(6).map(c => (
                <li key={c.id}><Link to={`/category/${c.id}`}>{c.name}</Link></li>
              ))}
              <li><Link to="/tools">All Tools</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Company</h3>
            <ul className="footer-list">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/sitemap">Sitemap</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} ToolSathi. All rights reserved.</p>
          <p className="footer-disclaimer">Processing happens in your browser where possible. See our privacy policy for details.</p>
        </div>
      </div>
    </footer>
  );
}
