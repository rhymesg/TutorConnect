import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock translations
jest.mock('@/lib/translations', () => ({
  navigation: { no: { login: 'Logg inn' } },
  forms: { 
    no: { 
      email: 'E-post',
      password: 'Passord',
      enterEmail: 'Skriv inn e-postadressen din',
      enterPassword: 'Skriv inn passordet ditt'
    } 
  },
  actions: {},
  messages: {},
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { accessToken: 'token', refreshToken: 'refresh' }
      }),
    });
  });

  it('should render login form elements', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Logg inn')).toBeInTheDocument();
    expect(screen.getByText('Velkommen tilbake til TutorConnect')).toBeInTheDocument();
    expect(screen.getByLabelText('E-post')).toBeInTheDocument();
    expect(screen.getByLabelText('Passord')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /husk meg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logg inn/i })).toBeInTheDocument();
  });

  it('should update form fields when user types', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should toggle remember me checkbox', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const checkbox = screen.getByRole('checkbox', { name: /husk meg/i });
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('should show forgot password section when clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const forgotPasswordButton = screen.getByRole('button', { name: /glemt passord/i });
    await user.click(forgotPasswordButton);
    
    expect(screen.getByText('Glemt passordet ditt?')).toBeInTheDocument();
    expect(screen.getByText('Tilbakestill passord')).toBeInTheDocument();
  });

  it('should hide forgot password section when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Show forgot password section
    await user.click(screen.getByRole('button', { name: /glemt passord/i }));
    expect(screen.getByText('Glemt passordet ditt?')).toBeInTheDocument();
    
    // Hide it
    await user.click(screen.getByRole('button', { name: /lukk/i }));
    expect(screen.queryByText('Glemt passordet ditt?')).not.toBeInTheDocument();
  });

  it('should validate required fields on submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    await user.click(submitButton);
    
    // Should not make API call with empty fields
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPassword123!',
          remember: false,
        }),
      });
    });
  });

  it('should store tokens on successful login', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh');
    });
  });

  it('should redirect to dashboard on successful login', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should call onSuccess callback when provided', async () => {
    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: 'token', refreshToken: 'refresh' }
      });
    });
  });

  it('should redirect to custom path when redirectTo is provided', async () => {
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/profile" />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  it('should redirect to email verification when required', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { 
          accessToken: 'token', 
          refreshToken: 'refresh',
          requiresEmailVerification: true 
        }
      }),
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/verify-email?message=login-verification-required');
    });
  });

  it('should display error message for unauthorized login', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: 'Invalid credentials'
      }),
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Ugyldig e-postadresse eller passord.')).toBeInTheDocument();
    });
  });

  it('should display rate limit error message', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        success: false,
        message: 'Rate limited'
      }),
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('For mange innloggingsforsøk. Prøv igjen senere.')).toBeInTheDocument();
    });
  });

  it('should display account locked error message', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 423,
      json: async () => ({
        success: false,
        message: 'Account locked'
      }),
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Kontoen din er midlertidig låst. Kontakt support for hjelp.')).toBeInTheDocument();
    });
  });

  it('should display network error message', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Det oppstod en nettverksfeil. Prøv igjen senere.')).toBeInTheDocument();
    });
  });

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        errors: [{ field: 'email', message: 'Invalid email' }]
      }),
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    // Submit form to get validation errors
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
    
    // Clear email field and type new value - error should disappear
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    
    await waitFor(() => {
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });
  });

  it('should clear general error when user makes changes', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    // Submit form to get general error
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Ugyldig e-postadresse eller passord.')).toBeInTheDocument();
    });
    
    // Make a change - error should disappear
    await user.type(emailInput, 'x');
    
    await waitFor(() => {
      expect(screen.queryByText('Ugyldig e-postadresse eller passord.')).not.toBeInTheDocument();
    });
  });

  it('should show submitting state during form submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockFetch.mockReturnValue(pendingPromise);
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(submitButton);
    
    // Should show loading text
    expect(screen.getByText('Logger inn...')).toBeInTheDocument();
    
    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { accessToken: 'token' } }),
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Logger inn...')).not.toBeInTheDocument();
    });
  });

  it('should include remember me value in form submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('E-post');
    const passwordInput = screen.getByLabelText('Passord');
    const rememberCheckbox = screen.getByRole('checkbox', { name: /husk meg/i });
    const submitButton = screen.getByRole('button', { name: /logg inn/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPassword123!');
    await user.click(rememberCheckbox);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPassword123!',
          remember: true,
        }),
      });
    });
  });
});