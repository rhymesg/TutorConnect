import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import Header from './Header';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  Bars3Icon: ({ className }: { className: string }) => <div className={className} data-testid="bars3-icon" />,
  UserCircleIcon: ({ className }: { className: string }) => <div className={className} data-testid="user-circle-icon" />,
  BellIcon: ({ className }: { className: string }) => <div className={className} data-testid="bell-icon" />,
  MagnifyingGlassIcon: ({ className }: { className: string }) => <div className={className} data-testid="search-icon" />,
}));

jest.mock('@heroicons/react/24/solid', () => ({
  ChevronDownIcon: ({ className }: { className: string }) => <div className={className} data-testid="chevron-down-icon" />,
}));

describe('Header', () => {
  const mockOnMenuClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  describe('Basic Rendering', () => {
    it('should render header with logo', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);
      
      expect(screen.getByText('TC')).toBeInTheDocument();
      expect(screen.getByText('TutorConnect')).toBeInTheDocument();
      expect(screen.getByLabelText('Gå til forsiden')).toBeInTheDocument();
    });

    it('should render menu button when showMenuButton is true', () => {
      render(<Header onMenuClick={mockOnMenuClick} showMenuButton />);
      
      const menuButton = screen.getByLabelText('Åpne hovedmeny');
      expect(menuButton).toBeInTheDocument();
      expect(screen.getByTestId('bars3-icon')).toBeInTheDocument();
    });

    it('should not render menu button when showMenuButton is false', () => {
      render(<Header onMenuClick={mockOnMenuClick} showMenuButton={false} />);
      
      expect(screen.queryByLabelText('Åpne hovedmeny')).not.toBeInTheDocument();
    });

    it('should call onMenuClick when menu button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} showMenuButton />);
      
      const menuButton = screen.getByLabelText('Åpne hovedmeny');
      await user.click(menuButton);
      
      expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Public Navigation (Non-authenticated)', () => {
    it('should render public navigation links when not authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      expect(screen.getByText('Finn lærer')).toBeInTheDocument();
      expect(screen.getByText('Bli lærer')).toBeInTheDocument();
      expect(screen.getByText('Om oss')).toBeInTheDocument();
      expect(screen.getByText('Kontakt')).toBeInTheDocument();
    });

    it('should highlight current page in navigation', () => {
      (usePathname as jest.Mock).mockReturnValue('/posts/123');
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const findTeacherLink = screen.getByText('Finn lærer');
      expect(findTeacherLink).toHaveClass('text-brand-600', 'bg-brand-50');
    });

    it('should render login and register buttons when not authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const loginLink = screen.getByText('Logg inn');
      const registerLink = screen.getByText('Registrer deg');
      
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/auth/register');
    });

    it('should render mobile navigation for public pages', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      // Mobile navigation should contain the same links
      const mobileNavigation = screen.getByLabelText('Mobilnavigasjon');
      expect(mobileNavigation).toBeInTheDocument();
    });
  });

  describe('Authenticated User Interface', () => {
    it('should render search bar when authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const searchInput = screen.getByLabelText('Søk i TutorConnect');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Søk etter lærere eller studenter...');
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should handle search input focus and blur', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const searchInput = screen.getByLabelText('Søk i TutorConnect');
      const searchIcon = screen.getByTestId('search-icon');
      
      // Initially should have neutral color
      expect(searchIcon).toHaveClass('text-neutral-400');
      
      // Focus should change icon color
      await user.click(searchInput);
      expect(searchIcon).toHaveClass('text-brand-500');
      
      // Blur should reset icon color
      await user.tab(); // Tab away to blur
      expect(searchIcon).toHaveClass('text-neutral-400');
    });

    it('should render notification button with badge', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const notificationButton = screen.getByLabelText('Vis varsler');
      expect(notificationButton).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
      
      // Notification badge
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-500');
    });

    it('should render user menu button', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      expect(userMenuButton).toBeInTheDocument();
      expect(screen.getByTestId('user-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('should not render public navigation when authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      expect(screen.queryByText('Finn lærer')).not.toBeInTheDocument();
      expect(screen.queryByText('Bli lærer')).not.toBeInTheDocument();
      expect(screen.queryByText('Om oss')).not.toBeInTheDocument();
      expect(screen.queryByText('Kontakt')).not.toBeInTheDocument();
    });

    it('should not render mobile navigation when authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      expect(screen.queryByLabelText('Mobilnavigasjon')).not.toBeInTheDocument();
    });
  });

  describe('User Menu Dropdown', () => {
    it('should open user menu when clicked', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      
      // Initially dropdown should not be visible
      expect(screen.queryByText('Min profil')).not.toBeInTheDocument();
      
      // Click to open
      await user.click(userMenuButton);
      
      expect(screen.getByText('Min profil')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Innstillinger')).toBeInTheDocument();
      expect(screen.getByText('Logg ut')).toBeInTheDocument();
    });

    it('should close user menu when clicked again', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      
      // Open menu
      await user.click(userMenuButton);
      expect(screen.getByText('Min profil')).toBeInTheDocument();
      
      // Close menu
      await user.click(userMenuButton);
      expect(screen.queryByText('Min profil')).not.toBeInTheDocument();
    });

    it('should set correct aria attributes for user menu', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      
      // Initially closed
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
      
      // After opening
      await user.click(userMenuButton);
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should render correct links in user menu', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      await user.click(userMenuButton);
      
      const profileLink = screen.getByText('Min profil');
      const dashboardLink = screen.getByText('Dashboard');
      const settingsLink = screen.getByText('Innstillinger');
      
      expect(profileLink).toHaveAttribute('href', '/profile');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(settingsLink).toHaveAttribute('href', '/settings');
      
      // Logout should be a button, not a link
      const logoutButton = screen.getByText('Logg ut');
      expect(logoutButton.tagName).toBe('BUTTON');
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide TutorConnect text on small screens', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);
      
      const logoText = screen.getByText('TutorConnect');
      expect(logoText).toHaveClass('hidden', 'sm:block');
    });

    it('should hide search bar on smaller screens when authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const searchContainer = screen.getByLabelText('Søk i TutorConnect').parentElement?.parentElement;
      expect(searchContainer).toHaveClass('hidden', 'lg:block');
    });

    it('should hide desktop navigation on mobile when not authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const desktopNav = screen.getByLabelText('Hovednavigasjon');
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('should show mobile navigation on mobile when not authenticated', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const mobileNav = screen.getByLabelText('Mobilnavigasjon').parentElement;
      expect(mobileNav).toHaveClass('md:hidden');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      expect(screen.getByLabelText('Søk i TutorConnect')).toBeInTheDocument();
      expect(screen.getByLabelText('Vis varsler')).toBeInTheDocument();
      expect(screen.getByLabelText('Brukermeny')).toBeInTheDocument();
      expect(screen.getByLabelText('Gå til forsiden')).toBeInTheDocument();
    });

    it('should have proper menu roles', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      await user.click(userMenuButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(4); // 3 links + 1 button
    });

    it('should mark current page with aria-current', () => {
      (usePathname as jest.Mock).mockReturnValue('/posts/123');
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const currentPageLink = screen.getByText('Finn lærer');
      expect(currentPageLink).toHaveAttribute('aria-current', 'page');
    });

    it('should have aria-hidden on decorative icons', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      expect(screen.getByTestId('search-icon')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('bell-icon')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('user-circle-icon')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('chevron-down-icon')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByLabelText('Gå til forsiden')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Søk i TutorConnect')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Vis varsler')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Brukermeny')).toHaveFocus();
    });

    it('should open user menu with Enter key', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      userMenuButton.focus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Min profil')).toBeInTheDocument();
    });

    it('should open user menu with Space key', async () => {
      const user = userEvent.setup();
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated />);
      
      const userMenuButton = screen.getByLabelText('Brukermeny');
      userMenuButton.focus();
      
      await user.keyboard(' ');
      expect(screen.getByText('Min profil')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should apply correct styles for current navigation item', () => {
      (usePathname as jest.Mock).mockReturnValue('/om-oss');
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const aboutLink = screen.getByText('Om oss');
      expect(aboutLink).toHaveClass('text-brand-600', 'bg-brand-50');
      
      const findTeacherLink = screen.getByText('Finn lærer');
      expect(findTeacherLink).toHaveClass('text-neutral-700');
      expect(findTeacherLink).not.toHaveClass('text-brand-600', 'bg-brand-50');
    });

    it('should apply hover styles correctly', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />);
      
      const findTeacherLink = screen.getByText('Finn lærer');
      expect(findTeacherLink).toHaveClass('hover:text-brand-600', 'hover:bg-neutral-50');
    });
  });
});