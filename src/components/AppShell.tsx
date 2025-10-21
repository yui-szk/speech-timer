import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const AppShell = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppShell;