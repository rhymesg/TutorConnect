import { render, screen } from '../../utils/test-utils'
import Header from '../../../src/components/layout/Header'

// Mock the pathname hook
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Header Component', () => {
  const mockOnMenuClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Public Header (unauthenticated)', () => {
    it('renders the TutorConnect logo and name', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />)
      
      expect(screen.getByText('TC')).toBeInTheDocument()
      expect(screen.getByText('TutorConnect')).toBeInTheDocument()
    })

    it('displays public navigation links', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />)
      
      expect(screen.getAllByText('Finn lærer')).toHaveLength(2) // Appears in both desktop and mobile nav
      expect(screen.getAllByText('Bli lærer')).toHaveLength(2)
      expect(screen.getAllByText('Om oss')).toHaveLength(2)
      expect(screen.getAllByText('Kontakt')).toHaveLength(2)
    })

    it('shows login and register buttons', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />)
      
      expect(screen.getByText('Logg inn')).toBeInTheDocument()
      expect(screen.getByText('Registrer deg')).toBeInTheDocument()
    })

    it('does not show authenticated user features', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />)
      
      expect(screen.queryByPlaceholderText('Søk etter lærere eller studenter...')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Vis varsler')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Brukermeny')).not.toBeInTheDocument()
    })

    it('shows mobile navigation menu for public pages', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />)
      
      // Mobile navigation should be visible (though it might be hidden by CSS)
      const mobileNavigation = screen.getByLabelText('Mobilnavigasjon')
      expect(mobileNavigation).toBeInTheDocument()
    })
  })

  describe('Authenticated Header', () => {
    it('shows search input for authenticated users', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.getByPlaceholderText('Søk etter lærere eller studenter...')).toBeInTheDocument()
    })

    it('displays notification button with badge', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.getByLabelText('Vis varsler')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Notification count
    })

    it('shows user menu button', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.getByLabelText('Brukermeny')).toBeInTheDocument()
    })

    it('does not show public navigation links', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.queryByText('Finn lærer')).not.toBeInTheDocument()
      expect(screen.queryByText('Bli lærer')).not.toBeInTheDocument()
    })

    it('does not show login/register buttons', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.queryByText('Logg inn')).not.toBeInTheDocument()
      expect(screen.queryByText('Registrer deg')).not.toBeInTheDocument()
    })
  })

  describe('Menu functionality', () => {
    it('shows menu button when showMenuButton is true', () => {
      render(<Header onMenuClick={mockOnMenuClick} showMenuButton={true} />)
      
      expect(screen.getByLabelText('Åpne hovedmeny')).toBeInTheDocument()
    })

    it('hides menu button when showMenuButton is false', () => {
      render(<Header onMenuClick={mockOnMenuClick} showMenuButton={false} />)
      
      expect(screen.queryByLabelText('Åpne hovedmeny')).not.toBeInTheDocument()
    })

    it('calls onMenuClick when menu button is clicked', async () => {
      const { user } = render(
        <Header onMenuClick={mockOnMenuClick} showMenuButton={true} />
      )
      
      const menuButton = screen.getByLabelText('Åpne hovedmeny')
      await user.click(menuButton)
      
      expect(mockOnMenuClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('User menu dropdown', () => {
    it('initially hides user menu dropdown', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.queryByText('Min profil')).not.toBeInTheDocument()
    })

    it('shows user menu dropdown when user menu button is clicked', async () => {
      const { user } = render(
        <Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />
      )
      
      const userMenuButton = screen.getByLabelText('Brukermeny')
      await user.click(userMenuButton)
      
      expect(screen.getByText('Min profil')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Innstillinger')).toBeInTheDocument()
      expect(screen.getByText('Logg ut')).toBeInTheDocument()
    })

    it('sets correct aria attributes for user menu', async () => {
      const { user } = render(
        <Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />
      )
      
      const userMenuButton = screen.getByLabelText('Brukermeny')
      
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false')
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true')
      
      await user.click(userMenuButton)
      
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Search functionality', () => {
    it('updates search icon color on focus', async () => {
      const { user } = render(
        <Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />
      )
      
      const searchInput = screen.getByPlaceholderText('Søk etter lærere eller studenter...')
      
      await user.click(searchInput)
      // Note: Color changes are handled by CSS classes, so we test the focus event
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={true} />)
      
      expect(screen.getByLabelText('Gå til forsiden')).toBeInTheDocument()
      expect(screen.getByLabelText('Vis varsler')).toBeInTheDocument()
      expect(screen.getByLabelText('Brukermeny')).toBeInTheDocument()
      expect(screen.getByLabelText('Søk i TutorConnect')).toBeInTheDocument()
    })

    it('has proper navigation landmarks', () => {
      render(<Header onMenuClick={mockOnMenuClick} isAuthenticated={false} />)
      
      expect(screen.getByLabelText('Hovednavigasjon')).toBeInTheDocument()
      expect(screen.getByLabelText('Mobilnavigasjon')).toBeInTheDocument()
    })

    it('uses semantic HTML elements', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      
      const header = screen.getByRole('banner') // header element
      expect(header).toBeInTheDocument()
    })
  })
})