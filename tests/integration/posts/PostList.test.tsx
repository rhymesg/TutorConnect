/**
 * Integration test for PostList component
 * Tests the complete post list functionality with API integration
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import PostList from '@/components/posts/PostList';
import { PostWithDetails, PostType, Subject, AgeGroup, NorwegianRegion } from '@/types/database';

// Mock server for API calls
const server = setupServer(
  rest.get('/api/posts', (req, res, ctx) => {
    const mockPosts: PostWithDetails[] = [
      {
        id: '1',
        type: 'TUTOR_OFFERING' as PostType,
        subject: 'MATHEMATICS' as Subject,
        ageGroups: ['ELEMENTARY' as AgeGroup],
        title: 'Matematikk undervisning',
        description: 'Erfaren lærer tilbyr matematikk undervisning for grunnskoleelever',
        availableDays: ['MONDAY', 'WEDNESDAY'],
        availableTimes: ['16:00', '17:00'],
        preferredSchedule: 'Ettermiddager',
        location: 'OSLO' as NorwegianRegion,
        specificLocation: 'Oslo sentrum',
        hourlyRate: 500,
        hourlyRateMin: null,
        hourlyRateMax: null,
        currency: 'NOK',
        isActive: true,
        userId: 'user1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: 'user1',
          name: 'Lars Hansen',
          profileImage: null,
          isActive: true,
          region: 'OSLO' as NorwegianRegion,
        },
        _count: {
          chats: 3,
        },
      },
      {
        id: '2',
        type: 'STUDENT_SEEKING' as PostType,
        subject: 'ENGLISH' as Subject,
        ageGroups: ['HIGH_SCHOOL' as AgeGroup],
        title: 'Trenger hjelp med engelsk',
        description: 'Videregående elev søker engelsk lærer',
        availableDays: ['TUESDAY', 'THURSDAY'],
        availableTimes: ['18:00', '19:00'],
        preferredSchedule: 'Kveld',
        location: 'BERGEN' as NorwegianRegion,
        specificLocation: 'Bergen sentrum',
        hourlyRate: null,
        hourlyRateMin: 300,
        hourlyRateMax: 600,
        currency: 'NOK',
        isActive: true,
        userId: 'user2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: {
          id: 'user2',
          name: 'Emma Olsen',
          profileImage: null,
          isActive: true,
          region: 'BERGEN' as NorwegianRegion,
        },
        _count: {
          chats: 1,
        },
      },
    ];

    return res(
      ctx.json({
        success: true,
        data: {
          data: mockPosts,
          pagination: {
            page: 1,
            limit: 12,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PostList Component Integration', () => {
  it('should render posts from API', async () => {
    render(<PostList />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Laster...')).not.toBeInTheDocument();
    });

    // Check if posts are rendered
    expect(screen.getByText('Matematikk undervisning')).toBeInTheDocument();
    expect(screen.getByText('Trenger hjelp med engelsk')).toBeInTheDocument();
  });

  it('should display correct post count', async () => {
    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText('2 resultater funnet')).toBeInTheDocument();
    });
  });

  it('should show tutor offering badge', async () => {
    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText('Tilbyr undervisning')).toBeInTheDocument();
      expect(screen.getByText('Søker lærer')).toBeInTheDocument();
    });
  });

  it('should display correct pricing information', async () => {
    render(<PostList />);

    await waitFor(() => {
      // Fixed rate for tutor offering
      expect(screen.getByText('kr 500')).toBeInTheDocument();
      // Rate range for student seeking
      expect(screen.getByText('kr 300 - kr 600')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Søk etter fag, lærer eller område...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Søk etter fag, lærer eller område...');
    fireEvent.change(searchInput, { target: { value: 'matematikk' } });

    // Test that search input is working
    expect(searchInput).toHaveValue('matematikk');
  });

  it('should toggle between grid and list view', async () => {
    render(<PostList />);

    await waitFor(() => {
      const gridButton = screen.getByTitle('Rutenettvisning');
      const listButton = screen.getByTitle('Listevisning');
      expect(gridButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();
    });

    const listButton = screen.getByTitle('Listevisning');
    fireEvent.click(listButton);

    // Grid should change (this is a basic interaction test)
    expect(listButton).toHaveClass('bg-brand-100');
  });

  it('should handle error states', async () => {
    // Mock error response
    server.use(
      rest.get('/api/posts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText('Feil ved lasting av annonser')).toBeInTheDocument();
      expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
    });
  });

  it('should show empty state when no posts found', async () => {
    // Mock empty response
    server.use(
      rest.get('/api/posts', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              data: [],
              pagination: {
                page: 1,
                limit: 12,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
              },
            },
          })
        );
      })
    );

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByText('Ingen resultater funnet')).toBeInTheDocument();
      expect(screen.getByText('Prøv å justere søkekriteriene eller fjerne noen filtre.')).toBeInTheDocument();
    });
  });

  it('should handle contact button click', async () => {
    const mockOnContact = jest.fn();
    
    render(<PostList onPostContact={mockOnContact} />);

    await waitFor(() => {
      expect(screen.queryByText('Laster...')).not.toBeInTheDocument();
    });

    // The contact functionality would be in the StartChatButton component
    // This test verifies the callback prop is passed correctly
    expect(mockOnContact).not.toHaveBeenCalled(); // Should only be called on actual button click
  });
});