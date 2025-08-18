import { NextRequest } from 'next/server';
import { GET, PUT, DELETE, PATCH } from './route';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('@/middleware/auth');

// Mock profile schema functions
jest.mock('@/schemas/profile', () => ({
  updateProfileSchema: {
    parse: jest.fn(),
  },
  updatePrivacySettingsSchema: {
    parse: jest.fn(),
  },
  calculateProfileCompleteness: jest.fn(() => ({ percentage: 80, missing: [] })),
  applyPrivacySettings: jest.fn((profile, options) => profile),
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  post: {
    updateMany: jest.fn(),
  },
} as any;

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockGetAuthenticatedUser = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;

describe('/api/profile', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    region: 'oslo',
    postalCode: '0123',
    gender: 'MALE',
    birthYear: 1990,
    profileImage: null,
    school: 'University of Oslo',
    degree: 'Bachelor',
    certifications: ['Math Teacher'],
    bio: 'Experienced math teacher',
    privacyGender: 'PUBLIC',
    privacyAge: 'PUBLIC',
    privacyDocuments: 'PRIVATE',
    privacyContact: 'PUBLIC',
    isActive: true,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: new Date(),
    documents: [],
    posts: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthMiddleware.mockResolvedValue(undefined);
    mockGetAuthenticatedUser.mockReturnValue(mockUser as any);
  });

  const createMockRequest = (body?: any, method: string = 'GET') => {
    return {
      json: async () => body,
      method,
    } as NextRequest;
  };

  describe('GET /api/profile', () => {
    it('should return user profile successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('user-123');
      expect(data.data.completeness).toBeDefined();
      expect(mockAuthMiddleware).toHaveBeenCalledWith(request);
    });

    it('should return 404 if profile not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should handle authentication error', async () => {
      mockAuthMiddleware.mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should include related data in profile response', async () => {
      const profileWithRelations = {
        ...mockProfile,
        documents: [
          {
            id: 'doc-123',
            documentType: 'DEGREE',
            fileName: 'degree.pdf',
            verificationStatus: 'VERIFIED',
            uploadedAt: new Date(),
          },
        ],
        posts: [
          {
            id: 'post-123',
            type: 'OFFERING',
            subject: 'Mathematics',
            title: 'Math Tutor Available',
            createdAt: new Date(),
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(profileWithRelations);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.documents).toHaveLength(1);
      expect(data.data.posts).toHaveLength(1);
    });
  });

  describe('PUT /api/profile', () => {
    const updateData = {
      name: 'Updated Name',
      region: 'bergen',
      bio: 'Updated bio',
    };

    beforeEach(() => {
      const { updateProfileSchema } = require('@/schemas/profile');
      updateProfileSchema.parse.mockReturnValue(updateData);
    });

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, ...updateData };
      mockPrisma.user.update.mockResolvedValue(updatedProfile);

      const request = createMockRequest(updateData, 'PUT');
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profile updated successfully');
      expect(data.data.name).toBe('Updated Name');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('should handle validation errors', async () => {
      const { updateProfileSchema } = require('@/schemas/profile');
      const validationError = new Error('Validation failed');
      validationError.name = 'ZodError';
      updateProfileSchema.parse.mockImplementation(() => {
        throw validationError;
      });

      const request = createMockRequest(updateData, 'PUT');
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Prisma errors', async () => {
      const prismaError = { code: 'P2002', meta: { target: ['email'] } };
      mockPrisma.user.update.mockRejectedValue(prismaError);

      const request = createMockRequest(updateData, 'PUT');
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });

    it('should handle generic database errors', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest(updateData, 'PUT');
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/profile', () => {
    it('should deactivate account successfully', async () => {
      const deleteData = { confirmEmail: 'test@example.com' };
      mockPrisma.user.update.mockResolvedValue({ ...mockProfile, isActive: false });
      mockPrisma.post.updateMany.mockResolvedValue({ count: 3 });

      const request = createMockRequest(deleteData, 'DELETE');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account deactivated successfully');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });

      expect(mockPrisma.post.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should reject deletion with wrong email confirmation', async () => {
      const deleteData = { confirmEmail: 'wrong@example.com' };

      const request = createMockRequest(deleteData, 'DELETE');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.errors.confirmEmail).toContain('Email confirmation does not match your account email');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle database error during account deactivation', async () => {
      const deleteData = { confirmEmail: 'test@example.com' };
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(deleteData, 'DELETE');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('PATCH /api/profile', () => {
    describe('privacy settings update', () => {
      const privacyData = {
        privacyGender: 'PRIVATE',
        privacyAge: 'FRIENDS_ONLY',
        privacyDocuments: 'PRIVATE',
        privacyContact: 'PUBLIC',
      };

      beforeEach(() => {
        const { updatePrivacySettingsSchema } = require('@/schemas/profile');
        updatePrivacySettingsSchema.parse.mockReturnValue(privacyData);
      });

      it('should update privacy settings successfully', async () => {
        const updatedProfile = { ...privacyData, updatedAt: new Date() };
        mockPrisma.user.update.mockResolvedValue(updatedProfile);

        const request = createMockRequest(privacyData, 'PATCH');
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Privacy settings updated successfully');
        expect(data.data.privacyGender).toBe('PRIVATE');

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            ...privacyData,
            updatedAt: expect.any(Date),
          },
          select: {
            privacyGender: true,
            privacyAge: true,
            privacyDocuments: true,
            privacyContact: true,
            updatedAt: true,
          },
        });
      });

      it('should handle validation error for privacy settings', async () => {
        const { updatePrivacySettingsSchema } = require('@/schemas/profile');
        const validationError = new Error('Invalid privacy setting');
        validationError.name = 'ZodError';
        updatePrivacySettingsSchema.parse.mockImplementation(() => {
          throw validationError;
        });

        const request = createMockRequest(privacyData, 'PATCH');
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data.success).toBe(false);
        expect(data.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('regular profile update', () => {
      const profileData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        school: 'New University',
      };

      beforeEach(() => {
        const { updateProfileSchema } = require('@/schemas/profile');
        updateProfileSchema.parse.mockReturnValue(profileData);
      });

      it('should update regular profile fields successfully', async () => {
        const updatedProfile = { ...profileData, updatedAt: new Date() };
        mockPrisma.user.update.mockResolvedValue(updatedProfile);

        const request = createMockRequest(profileData, 'PATCH');
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Profile updated successfully');
        expect(data.data.name).toBe('Updated Name');

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            ...profileData,
            updatedAt: expect.any(Date),
          },
          select: expect.any(Object),
        });
      });

      it('should handle validation error for regular fields', async () => {
        const { updateProfileSchema } = require('@/schemas/profile');
        const validationError = new Error('Invalid profile data');
        validationError.name = 'ZodError';
        updateProfileSchema.parse.mockImplementation(() => {
          throw validationError;
        });

        const request = createMockRequest(profileData, 'PATCH');
        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data.success).toBe(false);
        expect(data.code).toBe('VALIDATION_ERROR');
      });
    });

    it('should handle database errors', async () => {
      const { updateProfileSchema } = require('@/schemas/profile');
      updateProfileSchema.parse.mockReturnValue({ name: 'Test' });
      mockPrisma.user.update.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({ name: 'Test' }, 'PATCH');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = {
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
        method: 'PUT',
      } as NextRequest;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle missing request body', async () => {
      const request = createMockRequest(undefined, 'PUT');

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it('should include metadata in all responses', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.meta).toBeDefined();
      expect(data.meta.timestamp).toBeDefined();
      expect(new Date(data.meta.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('authentication and authorization', () => {
    it('should call auth middleware for all endpoints', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const getRequest = createMockRequest();
      await GET(getRequest);
      expect(mockAuthMiddleware).toHaveBeenCalledWith(getRequest);

      const putRequest = createMockRequest({}, 'PUT');
      await PUT(putRequest);
      expect(mockAuthMiddleware).toHaveBeenCalledWith(putRequest);

      const deleteRequest = createMockRequest({}, 'DELETE');
      await DELETE(deleteRequest);
      expect(mockAuthMiddleware).toHaveBeenCalledWith(deleteRequest);

      const patchRequest = createMockRequest({}, 'PATCH');
      await PATCH(patchRequest);
      expect(mockAuthMiddleware).toHaveBeenCalledWith(patchRequest);
    });

    it('should get authenticated user for all endpoints', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const request = createMockRequest();
      await GET(request);
      
      expect(mockGetAuthenticatedUser).toHaveBeenCalledWith(request);
    });
  });
});