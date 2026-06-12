import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isOpen} />
      <Navbar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      <main className={`pt-16 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}