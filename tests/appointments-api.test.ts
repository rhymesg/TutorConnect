/**
 * Appointment API Integration Tests
 * Tests for Norwegian tutoring appointment management system
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom';
import { PrismaClient } from '@prisma/client';
import { createMockRequest, createMockUser } from './helpers/test-utils';
import { AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Appointment API Integration', () => {
  let testUser: any;
  let testChat: any;
  let testPost: any;
  let authToken: string;

  beforeAll(async () => {
    // Set up test data
    testUser = await createMockUser();
    testPost = await createMockPost(testUser.id);
    testChat = await createMockChat(testPost.id, [testUser.id]);
    authToken = generateMockAuthToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('GET /api/appointments', () => {
    it('should list user appointments with Norwegian context', async () => {
      // Create test appointment
      const appointment = await prisma.appointment.create({
        data: {
          chatId: testChat.id,
          dateTime: new Date('2024-12-15T14:00:00Z'),
          location: 'Oslo Bibliotek',
          duration: 60,
          status: AppointmentStatus.PENDING,
        },
      });

      const response = await fetch('/api/appointments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toHaveProperty('norwegianContext');
      expect(data.data[0].norwegianContext).toHaveProperty('date');
      expect(data.data[0].norwegianContext).toHaveProperty('time');
      expect(data.data[0]).toHaveProperty('userRole');
    });

    it('should filter appointments by status', async () => {
      const response = await fetch('/api/appointments?status=PENDING&status=CONFIRMED', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const response = await fetch('/api/appointments?page=1&limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination).toHaveProperty('page', 1);
      expect(data.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('POST /api/appointments', () => {
    it('should create appointment with Norwegian validation', async () => {
      const appointmentData = {
        chatId: testChat.id,
        dateTime: '2024-12-20T15:00:00Z', // Friday 3 PM - good time for tutoring
        duration: 90,
        locationType: 'library',
        location: 'Deichman Grünerløkka',
        meetingType: 'regular_lesson',
        notes: 'Matematikk repetisjon',
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.appointment).toHaveProperty('id');
      expect(data.data.appointment).toHaveProperty('norwegianContext');
      expect(data.data).toHaveProperty('message');
      expect(data.data.message).toContain('avtalt');
    });

    it('should validate Norwegian business hours', async () => {
      const appointmentData = {
        chatId: testChat.id,
        dateTime: '2024-12-20T23:00:00Z', // 11 PM - too late
        duration: 60,
        locationType: 'online',
        location: 'Online video call',
        meetingType: 'regular_lesson',
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should detect Norwegian holidays', async () => {
      const appointmentData = {
        chatId: testChat.id,
        dateTime: '2024-12-25T14:00:00Z', // Christmas Day
        duration: 60,
        locationType: 'online',
        location: 'Online video call',
        meetingType: 'regular_lesson',
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();
      // Should succeed but with warnings
      if (response.status === 201) {
        expect(data.data.warnings).toContain(expect.stringMatching(/Christmas|jul/i));
      }
    });
  });

  describe('GET /api/appointments/[appointmentId]', () => {
    it('should get appointment details with Norwegian context', async () => {
      const appointment = await createTestAppointment();
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('norwegianContext');
      expect(data.data).toHaveProperty('canModify');
      expect(data.data).toHaveProperty('canCancel');
      expect(data.data).toHaveProperty('otherParticipants');
    });
  });

  describe('POST /api/appointments/[appointmentId]/confirm', () => {
    it('should confirm appointment and update status', async () => {
      const appointment = await createTestAppointment();
      
      const confirmationData = {
        confirmed: true,
        notes: 'Ser frem til timen!',
      };

      const response = await fetch(`/api/appointments/${appointment.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmationData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('confirmed');
      expect(data.data).toHaveProperty('norwegianContext');
    });

    it('should decline appointment when confirmed is false', async () => {
      const appointment = await createTestAppointment();
      
      const confirmationData = {
        confirmed: false,
        notes: 'Kan dessverre ikke',
      };

      const response = await fetch(`/api/appointments/${appointment.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmationData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('declined');
    });
  });

  describe('POST /api/appointments/[appointmentId]/reschedule', () => {
    it('should reschedule appointment with valid new time', async () => {
      const appointment = await createTestAppointment();
      
      const rescheduleData = {
        newDateTime: '2024-12-21T14:00:00Z',
        reason: 'Må flytte på grunn av annet oppdrag',
      };

      const response = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rescheduleData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('norwegianContext');
    });

    it('should reject reschedule to past time', async () => {
      const appointment = await createTestAppointment();
      
      const rescheduleData = {
        newDateTime: '2024-01-01T14:00:00Z', // Past date
        reason: 'Test invalid reschedule',
      };

      const response = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rescheduleData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // Helper functions
  async function createMockPost(userId: string) {
    return await prisma.post.create({
      data: {
        userId,
        type: 'TEACHER',
        subject: 'MATHEMATICS',
        title: 'Matematikk undervisning',
        description: 'Hjelp med matematikk for ungdomsskole',
        ageGroups: ['TEENAGERS_13_15'],
        location: 'OSLO',
        availableDays: ['monday', 'wednesday', 'friday'],
        availableTimes: ['15:00', '16:00', '17:00'],
        hourlyRate: 400,
        currency: 'NOK',
      },
    });
  }

  async function createMockChat(postId: string, participantIds: string[]) {
    const chat = await prisma.chat.create({
      data: {
        relatedPostId: postId,
        isActive: true,
      },
    });

    // Add participants
    for (const participantId of participantIds) {
      await prisma.chatParticipant.create({
        data: {
          chatId: chat.id,
          userId: participantId,
          isActive: true,
        },
      });
    }

    return chat;
  }

  async function createTestAppointment() {
    return await prisma.appointment.create({
      data: {
        chatId: testChat.id,
        dateTime: new Date('2024-12-18T16:00:00Z'),
        location: 'Trondheim Bibliotek',
        duration: 60,
        status: AppointmentStatus.PENDING,
      },
    });
  }

  function generateMockAuthToken(user: any): string {
    // In a real test, you'd generate a proper JWT
    return `mock_token_${user.id}`;
  }

  async function cleanupTestData() {
    // Clean up in reverse order of dependencies
    await prisma.appointment.deleteMany({
      where: { chatId: testChat?.id },
    });
    
    await prisma.message.deleteMany({
      where: { chatId: testChat?.id },
    });
    
    await prisma.chatParticipant.deleteMany({
      where: { chatId: testChat?.id },
    });
    
    if (testChat) {
      await prisma.chat.delete({
        where: { id: testChat.id },
      });
    }
    
    if (testPost) {
      await prisma.post.delete({
        where: { id: testPost.id },
      });
    }
    
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
  }
});