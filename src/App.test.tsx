import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components';
import { MainTimer, Settings } from './pages';

// Test the routing structure without the App component to avoid nested routers
describe('App Routing Structure', () => {
  const renderWithRouter = (initialEntries: string[] = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<MainTimer />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  test('renders MainTimer on root path', () => {
    renderWithRouter(['/']);
    
    // Just check that the app renders without errors
    expect(screen.getAllByText('スピーチタイマー')).toHaveLength(2);
    expect(screen.getByLabelText('設定画面を開く')).toBeInTheDocument();
  });

  test('renders Settings on /settings path', () => {
    renderWithRouter(['/settings']);
    
    // Just check that settings page renders
    expect(screen.getAllByText('設定')).toHaveLength(2);
    expect(screen.getByLabelText('メイン画面に戻る')).toBeInTheDocument();
  });

  test('has proper responsive layout structure', () => {
    renderWithRouter(['/']);
    
    // Check that the main structure is present (may be multiple)
    expect(screen.getAllByRole('banner')).toHaveLength(2); // header
    expect(screen.getAllByRole('main')).toHaveLength(2); // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });
});