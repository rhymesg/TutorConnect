/**
 * Appointment Management Library
 * Core functions for handling appointment operations
 */

import { PrismaClient, AppointmentStatus, Appointment, User } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { UpdateAppointmentInput, UpdateAppointmentStatusInput } from '@/schemas/appointments';

const prisma = new PrismaClient();

/**
 * Update appointment details
 */
export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentInput,
  userId: string
): Promise<Appointment> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { chat: { include: { participants: true } } }
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Check if user is participant in the chat
  const isParticipant = appointment.chat.participants.some(p => p.userId === userId);
  if (!isParticipant) {
    throw new ForbiddenError('Not authorized to update this appointment');
  }

  // Update the appointment
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return updatedAppointment;
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  data: UpdateAppointmentStatusInput,
  userId: string
): Promise<Appointment> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { chat: { include: { participants: true } } }
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Check if user is participant in the chat
  const isParticipant = appointment.chat.participants.some(p => p.userId === userId);
  if (!isParticipant) {
    throw new ForbiddenError('Not authorized to update this appointment status');
  }

  // Update the appointment status
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: data.status,
      notes: data.notes || appointment.notes,
      updatedAt: new Date(),
    },
  });

  return updatedAppointment;
}

/**
 * Check user availability for a given time slot
 */
export async function checkUserAvailability(
  userId: string,
  dateTime: Date,
  duration: number,
  excludeAppointmentId?: string
): Promise<boolean> {
  const startTime = new Date(dateTime);
  const endTime = new Date(dateTime.getTime() + duration * 60 * 1000);

  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      AND: [
        {
          chat: {
            participants: {
              some: { userId }
            }
          }
        },
        {
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        {
          OR: [
            {
              AND: [
                { dateTime: { lte: startTime } },
                { dateTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { dateTime: { lt: endTime } },
                { dateTime: { gte: startTime } }
              ]
            }
          ]
        },
        ...(excludeAppointmentId ? [{ NOT: { id: excludeAppointmentId } }] : [])
      ]
    }
  });

  return conflictingAppointments.length === 0;
}

/**
 * Appointment utility functions
 */
export const AppointmentUtils = {
  /**
   * Format appointment duration for display
   */
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}t`;
      } else {
        return `${hours}t ${mins}min`;
      }
    }
  },

  /**
   * Check if appointment can be modified
   */
  canModify: (appointment: Appointment): boolean => {
    const now = new Date();
    const appointmentTime = new Date(appointment.dateTime);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursUntil = timeDiff / (1000 * 60 * 60);

    // Can modify if appointment is more than 2 hours away and not cancelled
    return hoursUntil > 2 && appointment.status !== 'CANCELLED';
  },

  /**
   * Check if appointment can be cancelled
   */
  canCancel: (appointment: Appointment): boolean => {
    const now = new Date();
    const appointmentTime = new Date(appointment.dateTime);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursUntil = timeDiff / (1000 * 60 * 60);

    // Can cancel if appointment is more than 1 hour away and not already cancelled
    return hoursUntil > 1 && appointment.status !== 'CANCELLED';
  }
};