import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';

// Mock the Outlet component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Mock Outlet Content</div>,
  };
});

describe('AppShell', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('renders header, main content, and footer', () => {
    renderWithRouter(<AppShell />);
    
    // Check that the main structure is present
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    
    // Check that the Outlet is rendered
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  test('has correct responsive layout classes', () => {
    renderWithRouter(<AppShell />);
    
    const container = screen.getByRole('banner').parentElement;
    expect(container).toHaveClass('min-h-screen', 'bg-white', 'flex', 'flex-col');
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-1', 'container', 'mx-auto', 'px-4', 'py-6', 'max-w-md');
  });
});