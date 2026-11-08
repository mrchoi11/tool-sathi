import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Completely isolate Admin portal: No website Header, No website Footer, No background orbs
  if (isAdmin) {
    return <main className="admin-isolated-container">{children}</main>;
  }

  return (
    <div className="page-wrapper">
      {/* Apple-Inspired 3D Liquid Glass Floating Ambient Elements */}
      <div className="liquid-glass-background" aria-hidden="true">
        <div className="liquid-orb liquid-orb-1" />
        <div className="liquid-orb liquid-orb-2" />
        <div className="liquid-orb liquid-orb-3" />
        <div className="liquid-orb liquid-orb-4" />
        <div className="liquid-orb liquid-orb-5" />
        <div className="glass-droplet droplet-1" />
        <div className="glass-droplet droplet-2" />
        <div className="glass-droplet droplet-3" />
        <div className="glass-droplet droplet-4" />
      </div>

      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
