import { Outlet } from 'react-router-dom';
import { memo } from 'react';
import LiveAnnouncer from './LiveAnnouncer';

const AppShell = memo(() => {
  return (
    <div className="min-h-screen">
      <Outlet />
      <LiveAnnouncer />
    </div>
  );
});

AppShell.displayName = 'AppShell';

export default AppShell;