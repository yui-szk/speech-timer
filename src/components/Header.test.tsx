import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Header />
    </MemoryRouter>
  );
};

describe('Header', () => {
  test('shows settings button on main page', () => {
    renderWithRouter(['/']);
    
    expect(screen.getByText('スピーチタイマー')).toBeInTheDocument();
    expect(screen.getByLabelText('設定画面を開く')).toBeInTheDocument();
    expect(screen.queryByLabelText('メイン画面に戻る')).not.toBeInTheDocument();
  });

  test('shows back button on settings page', () => {
    renderWithRouter(['/settings']);
    
    expect(screen.getByText('設定')).toBeInTheDocument();
    expect(screen.getByLabelText('メイン画面に戻る')).toBeInTheDocument();
    expect(screen.queryByLabelText('設定画面を開く')).not.toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    renderWithRouter(['/']);
    
    const settingsButton = screen.getByLabelText('設定画面を開く');
    expect(settingsButton).toHaveAttribute('aria-label', '設定画面を開く');
    
    // Check focus styles
    expect(settingsButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-mint-500');
  });

  test('has proper tap target size', () => {
    renderWithRouter(['/']);
    
    const settingsButton = screen.getByLabelText('設定画面を開く');
    expect(settingsButton).toHaveClass('w-tap', 'h-tap');
  });
});