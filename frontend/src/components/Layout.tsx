import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} pt-2`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
