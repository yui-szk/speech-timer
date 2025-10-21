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
    
    expect(screen.getByText('メインタイマー画面')).toBeInTheDocument();
    expect(screen.getByText('スピーチタイマー')).toBeInTheDocument();
    expect(screen.getByLabelText('設定画面を開く')).toBeInTheDocument();
  });

  test('renders Settings on /settings path', () => {
    renderWithRouter(['/settings']);
    
    expect(screen.getByText('設定画面')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
    expect(screen.getByLabelText('メイン画面に戻る')).toBeInTheDocument();
  });

  test('has proper responsive layout structure', () => {
    renderWithRouter(['/']);
    
    // Check that the main structure is present
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    
    // Check responsive classes
    const main = screen.getByRole('main');
    expect(main).toHaveClass('container', 'mx-auto', 'max-w-md');
  });
});