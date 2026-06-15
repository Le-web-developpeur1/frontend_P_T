import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      <Sidebar isOpen={isOpen} />
      <Navbar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      <main style={{
        paddingTop: '64px',
        marginLeft: isOpen ? '220px' : '64px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}