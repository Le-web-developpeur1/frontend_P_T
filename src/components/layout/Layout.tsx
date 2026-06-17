import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [isOpen, setIsOpen]     = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeMobileSidebar = () => setIsOpen(false);

  const contentMarginLeft = isMobile ? '0px' : (isOpen ? '220px' : '64px');

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      <Sidebar isOpen={isOpen} isMobile={isMobile} onCloseMobile={closeMobileSidebar} />
      <Navbar isOpen={isOpen} isMobile={isMobile} onToggle={toggleSidebar} />
      <main style={{
        paddingTop: '64px',
        marginLeft: contentMarginLeft,
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}