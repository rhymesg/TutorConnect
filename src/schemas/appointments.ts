/**
 * Appointment Schema Validations
 * Zod schemas for appointment-related API operations
 */

import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

/**
 * Update appointment schema
 */
export const updateAppointmentSchema = z.object({
  dateTime: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(), // 15 minutes to 8 hours
  location: z.string().min(1).max(255).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Update appointment status schema
 */
export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  notes: z.string().max(1000).optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;