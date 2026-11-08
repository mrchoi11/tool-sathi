import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Completely isolate Admin portal: No website Header, No website Footer
  if (isAdmin) {
    return <main className="admin-isolated-container">{children}</main>;
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
