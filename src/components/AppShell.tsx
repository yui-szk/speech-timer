import { Outlet } from 'react-router-dom';
import { memo } from 'react';
import Header from './Header';
import Footer from './Footer';
import PerformanceDebugger from './PerformanceDebugger';

const AppShell = memo(() => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <Outlet />
      </main>
      <Footer />
      <PerformanceDebugger />
    </div>
  );
});

AppShell.displayName = 'AppShell';

export default AppShell;