import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Add any global providers here (context providers, etc.)
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const user = userEvent.setup()
  
  return {
    user,
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  }
}

export * from '@testing-library/react'
export { customRender as render }

// Common test data generators
export const createMockUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'STUDENT' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  emailVerified: true,
  ...overrides,
})

export const createMockPost = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Math Tutor Available',
  description: 'Experienced math tutor offering lessons',
  subject: 'Mathematics',
  type: 'OFFERING' as const,
  pricePerHour: 500,
  location: 'Oslo',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockAppointment = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  postId: '123e4567-e89b-12d3-a456-426614174001',
  teacherId: '123e4567-e89b-12d3-a456-426614174000',
  studentId: '123e4567-e89b-12d3-a456-426614174003',
  scheduledAt: new Date('2024-12-25T10:00:00'),
  duration: 60,
  location: 'Online',
  status: 'SCHEDULED' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

// API response mocks
export const mockApiResponse = <T,>(data: T, success = true) => ({
  data: success ? data : null,
  error: success ? null : 'API Error',
  status: success ? 200 : 400,
})

// Wait for loading states
export const waitForLoadingToFinish = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
}