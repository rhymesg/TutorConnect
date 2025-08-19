/**
 * Appointment Management Utilities
 * Core business logic for Norwegian tutoring appointment system
 */

import { PrismaClient, AppointmentStatus, User, Chat, Appointment, Post } from '@prisma/client';
import { addDays, addMinutes, subMinutes, isAfter, isBefore, parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  validateNorwegianTutoringTime, 
  isNorwegianHoliday, 
  isNorwegianSchoolBreak,
  formatNorwegianDateTime,
  NORWEGIAN_TIMEZONE 
} from './norwegian-calendar';
import { 
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  MeetingType,
  LocationType,
  RecurringPattern
} from '@/schemas/appointments';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from './errors';
import { formatNOK } from './utils';

const prisma = new PrismaClient();

/**
 * Extended appointment type with relations
 */
export type AppointmentWithDetails = Appointment & {
  chat: Chat & {
    participants: Array<{
      user: Pick<User, 'id' | 'name' | 'email' | 'region'>;
    }>;
    relatedPost?: Pick<Post, 'id' | 'title' | 'subject' | 'type'> & {
      user: Pick<User, 'id' | 'name' | 'region'>;
    };
  };
};

/**
 * Appointment creation result
 */
export interface CreateAppointmentResult {
  appointment: AppointmentWithDetails;
  message: string;
  warnings: string[];
  recurringAppointments?: AppointmentWithDetails[];
}

/**
 * Appointment validation result
 */
export interface AppointmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context: {
    isHoliday: boolean;
    isSchoolBreak: boolean;
    isOptimalTime: boolean;
    conflictingAppointments: number;
  };
}

/**
 * Create a new appointment with comprehensive validation
 */
export async function createAppointment(
  userId: string,
  appointmentData: CreateAppointmentInput
): Promise<CreateAppointmentResult> {
  const { 
    chatId, 
    dateTime, 
    duration, 
    locationType, 
    location, 
    specificLocation,
    meetingType,
    notes,
    agenda,
    isRecurring,
    recurringPattern,
    recurringEndDate,
    reminderTime,
    price,
    currency = 'NOK',
    specialRate,
    isTrialLesson,
    preparationMaterials,
    requiredMaterials
  } = appointmentData;

  // Validate chat exists and user has access
  const chat = await validateChatAccess(chatId, userId);
  
  // Parse and validate appointment time
  const appointmentDateTime = parseISO(dateTime);
  
  // Comprehensive validation
  const validationResult = await validateAppointmentTime(appointmentDateTime, chatId, userId, duration);
  if (!validationResult.isValid) {
    throw new BadRequestError(`Appointment validation failed: ${validationResult.errors.join(', ')}`);
  }

  // Additional Norwegian-specific validation
  const norwegianValidation = validateNorwegianTutoringTime(appointmentDateTime);
  const warnings = [...validationResult.warnings, ...norwegianValidation.warnings];

  try {
    // Create the main appointment
    const appointment = await prisma.appointment.create({
      data: {
        chatId,
        dateTime: appointmentDateTime,
        location,
        specificLocation,
        duration,
        status: AppointmentStatus.PENDING,
        reminderTime,
        notes: notes || null,
        // Store additional metadata in notes for now (could be separate fields)
        ...(agenda && { notes: `${notes || ''}\n\nAgenda: ${agenda}`.trim() }),
      },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    region: true,
                  },
                },
              },
            },
            relatedPost: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    region: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Create system message in chat about the appointment
    await createAppointmentSystemMessage(chatId, appointment, 'created', userId);

    let recurringAppointments: AppointmentWithDetails[] = [];

    // Handle recurring appointments
    if (isRecurring && recurringPattern && recurringEndDate) {
      recurringAppointments = await createRecurringAppointments(
        appointment,
        recurringPattern,
        parseISO(recurringEndDate),
        userId
      );
    }

    // Log appointment creation for analytics
    await logAppointmentEvent(appointment.id, 'created', userId, {
      meetingType,
      locationType,
      isRecurring,
      duration,
      participantCount: chat.participants.length,
    });

    return {
      appointment,
      message: generateAppointmentConfirmationMessage(appointment, meetingType),
      warnings,
      recurringAppointments: recurringAppointments.length > 0 ? recurringAppointments : undefined,
    };

  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new BadRequestError('Failed to create appointment');
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  appointmentId: string,
  userId: string,
  updateData: UpdateAppointmentInput
): Promise<AppointmentWithDetails> {
  // Get existing appointment
  const existingAppointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      chat: {
        include: {
          participants: true,
        },
      },
    },
  });

  if (!existingAppointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Check user access
  const hasAccess = existingAppointment.chat.participants.some(p => p.userId === userId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this appointment');
  }

  // Check if appointment can still be modified
  if (existingAppointment.status === AppointmentStatus.COMPLETED) {
    throw new BadRequestError('Cannot modify a completed appointment');
  }

  // Check if appointment is too soon to modify (less than 2 hours away)
  const twoHoursFromNow = addMinutes(new Date(), 120);
  if (isBefore(existingAppointment.dateTime, twoHoursFromNow) && 
      existingAppointment.status === AppointmentStatus.CONFIRMED) {
    throw new BadRequestError('Cannot modify appointment less than 2 hours before start time');
  }

  // Validate new time if provided
  if (updateData.dateTime) {
    const newDateTime = parseISO(updateData.dateTime);
    const validationResult = await validateAppointmentTime(
      newDateTime, 
      existingAppointment.chatId, 
      userId,
      updateData.duration || existingAppointment.duration,
      appointmentId // Exclude current appointment from conflict check
    );
    
    if (!validationResult.isValid) {
      throw new BadRequestError(`Time validation failed: ${validationResult.errors.join(', ')}`);
    }
  }

  // Update the appointment
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...(updateData.dateTime && { dateTime: parseISO(updateData.dateTime) }),
      ...(updateData.duration && { duration: updateData.duration }),
      ...(updateData.location && { location: updateData.location }),
      ...(updateData.specificLocation !== undefined && { specificLocation: updateData.specificLocation }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      ...(updateData.reminderTime !== undefined && { reminderTime: updateData.reminderTime }),
      ...(updateData.cancellationReason && { cancellationReason: updateData.cancellationReason }),
    },
    include: {
      chat: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  region: true,
                },
              },
            },
          },
          relatedPost: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  region: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Create system message about the update
  await createAppointmentSystemMessage(
    existingAppointment.chatId,
    updatedAppointment,
    'updated',
    userId
  );

  // Log the update
  await logAppointmentEvent(appointmentId, 'updated', userId, updateData);

  return updatedAppointment;
}

/**
 * Update appointment status with workflow validation
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  userId: string,
  statusUpdate: UpdateAppointmentStatusInput
): Promise<AppointmentWithDetails> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      chat: {
        include: {
          participants: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Validate user access
  const participant = appointment.chat.participants.find(p => p.userId === userId);
  if (!participant) {
    throw new ForbiddenError('You do not have access to this appointment');
  }

  // Validate status transition
  const validTransition = validateStatusTransition(
    appointment.status,
    statusUpdate.status,
    userId,
    appointment
  );

  if (!validTransition.isValid) {
    throw new BadRequestError(validTransition.reason || 'Invalid status transition');
  }

  // Update appointment
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: statusUpdate.status,
      ...(statusUpdate.teacherReady !== undefined && { teacherReady: statusUpdate.teacherReady }),
      ...(statusUpdate.studentReady !== undefined && { studentReady: statusUpdate.studentReady }),
      ...(statusUpdate.cancellationReason && { cancellationReason: statusUpdate.cancellationReason }),
      // Set bothCompleted when both parties mark as ready and status is COMPLETED
      ...(statusUpdate.status === AppointmentStatus.COMPLETED && {
        bothCompleted: (statusUpdate.teacherReady && statusUpdate.studentReady) || appointment.bothCompleted,
      }),
    },
    include: {
      chat: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  region: true,
                },
              },
            },
          },
          relatedPost: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  region: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Create system message
  await createAppointmentSystemMessage(
    appointment.chatId,
    updatedAppointment,
    statusUpdate.status.toLowerCase() as 'confirmed' | 'cancelled' | 'completed',
    userId
  );

  // Log status change
  await logAppointmentEvent(appointmentId, 'status_changed', userId, {
    oldStatus: appointment.status,
    newStatus: statusUpdate.status,
    reason: statusUpdate.cancellationReason,
  });

  return updatedAppointment;
}

/**
 * Get appointments with filtering and pagination
 */
export async function getUserAppointments(
  userId: string,
  filters: {
    page?: number;
    limit?: number;
    status?: AppointmentStatus[];
    dateFrom?: string;
    dateTo?: string;
    chatId?: string;
    sortBy?: 'dateTime' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{
  appointments: AppointmentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const {
    page = 1,
    limit = 20,
    status,
    dateFrom,
    dateTo,
    chatId,
    sortBy = 'dateTime',
    sortOrder = 'asc',
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const whereClause: any = {
    chat: {
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
  };

  if (status && status.length > 0) {
    whereClause.status = { in: status };
  }

  if (dateFrom) {
    whereClause.dateTime = { gte: parseISO(dateFrom) };
  }

  if (dateTo) {
    whereClause.dateTime = {
      ...whereClause.dateTime,
      lte: parseISO(dateTo),
    };
  }

  if (chatId) {
    whereClause.chatId = chatId;
  }

  // Execute queries
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    region: true,
                  },
                },
              },
            },
            relatedPost: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    region: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.appointment.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Validate chat access for appointment creation
 */
async function validateChatAccess(chatId: string, userId: string): Promise<Chat & {
  participants: Array<{ userId: string }>;
  relatedPost?: Post & { user: User };
}> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        where: { isActive: true },
      },
      relatedPost: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (!chat.isActive) {
    throw new BadRequestError('Cannot create appointment in inactive chat');
  }

  const hasAccess = chat.participants.some(p => p.userId === userId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this chat');
  }

  return chat;
}

/**
 * Validate appointment time against conflicts and business rules
 */
async function validateAppointmentTime(
  dateTime: Date,
  chatId: string,
  userId: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<AppointmentValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let context = {
    isHoliday: false,
    isSchoolBreak: false,
    isOptimalTime: true,
    conflictingAppointments: 0,
  };

  // Check if in the past
  if (isBefore(dateTime, new Date())) {
    errors.push('Appointment cannot be scheduled in the past');
  }

  // Check advance notice (minimum 2 hours)
  const twoHoursFromNow = addMinutes(new Date(), 120);
  if (isBefore(dateTime, twoHoursFromNow)) {
    errors.push('Appointments must be scheduled at least 2 hours in advance');
  }

  // Check Norwegian context
  const holidayInfo = isNorwegianHoliday(dateTime);
  const breakInfo = isNorwegianSchoolBreak(dateTime);
  
  context.isHoliday = holidayInfo.isHoliday;
  context.isSchoolBreak = breakInfo.isBreak;

  if (holidayInfo.isHoliday) {
    warnings.push(`Scheduled on ${holidayInfo.holidayName}`);
  }

  if (breakInfo.isBreak) {
    warnings.push(`Scheduled during ${breakInfo.breakName}`);
  }

  // Norwegian tutoring time validation
  const norwegianValidation = validateNorwegianTutoringTime(dateTime);
  if (!norwegianValidation.isValid) {
    errors.push(...norwegianValidation.warnings);
  } else {
    warnings.push(...norwegianValidation.warnings);
  }

  context.isOptimalTime = norwegianValidation.isValid;

  // Check for conflicting appointments
  const endTime = addMinutes(dateTime, duration);
  const bufferTime = 15; // 15-minute buffer between appointments

  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      chat: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
      OR: [
        {
          // New appointment starts during existing appointment
          dateTime: {
            lte: dateTime,
          },
          // Calculate end time of existing appointment
          AND: {
            dateTime: {
              gte: subMinutes(dateTime, 480), // Max 8 hours duration check
            },
          },
        },
        {
          // New appointment ends during existing appointment
          dateTime: {
            gte: dateTime,
            lt: endTime,
          },
        },
      ],
    },
    select: {
      id: true,
      dateTime: true,
      duration: true,
    },
  });

  // Check each potential conflict more precisely
  const actualConflicts = conflictingAppointments.filter(existing => {
    const existingEnd = addMinutes(existing.dateTime, existing.duration);
    const newStart = subMinutes(dateTime, bufferTime);
    const newEnd = addMinutes(endTime, bufferTime);

    // Check if appointments overlap (with buffer)
    return !(isBefore(existingEnd, newStart) || isAfter(existing.dateTime, newEnd));
  });

  context.conflictingAppointments = actualConflicts.length;

  if (actualConflicts.length > 0) {
    errors.push(`Conflicts with ${actualConflicts.length} existing appointment(s)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    context,
  };
}

/**
 * Validate appointment status transitions
 */
function validateStatusTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
  userId: string,
  appointment: Appointment & { chat: { participants: any[] } }
): { isValid: boolean; reason?: string } {
  // Define valid transitions
  const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
    [AppointmentStatus.CONFIRMED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
    [AppointmentStatus.COMPLETED]: [], // Cannot transition from completed
    [AppointmentStatus.CANCELLED]: [], // Cannot transition from cancelled
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      isValid: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  // Additional business rules
  if (newStatus === AppointmentStatus.COMPLETED) {
    // Check if appointment time has passed
    if (isAfter(new Date(), appointment.dateTime)) {
      // Can mark as completed after start time
      return { isValid: true };
    } else {
      // Can only mark as completed within 1 hour of start time
      const oneHourBefore = subMinutes(appointment.dateTime, 60);
      if (isBefore(new Date(), oneHourBefore)) {
        return {
          isValid: false,
          reason: 'Cannot mark appointment as completed more than 1 hour before start time',
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Create recurring appointments
 */
async function createRecurringAppointments(
  baseAppointment: Appointment,
  pattern: string,
  endDate: Date,
  userId: string
): Promise<AppointmentWithDetails[]> {
  const recurringAppointments: AppointmentWithDetails[] = [];
  let currentDate = new Date(baseAppointment.dateTime);
  const maxAppointments = 24; // Safety limit

  let daysToAdd: number;
  switch (pattern) {
    case RecurringPattern.WEEKLY:
      daysToAdd = 7;
      break;
    case RecurringPattern.BI_WEEKLY:
      daysToAdd = 14;
      break;
    case RecurringPattern.MONTHLY:
      daysToAdd = 30;
      break;
    default:
      return [];
  }

  for (let i = 0; i < maxAppointments; i++) {
    currentDate = addDays(currentDate, daysToAdd);
    
    if (isAfter(currentDate, endDate)) {
      break;
    }

    try {
      // Validate each recurring appointment
      const validationResult = await validateAppointmentTime(
        currentDate,
        baseAppointment.chatId,
        userId,
        baseAppointment.duration
      );

      if (validationResult.isValid) {
        const recurringAppointment = await prisma.appointment.create({
          data: {
            chatId: baseAppointment.chatId,
            dateTime: currentDate,
            location: baseAppointment.location,
            specificLocation: baseAppointment.specificLocation,
            duration: baseAppointment.duration,
            status: AppointmentStatus.PENDING,
            reminderTime: baseAppointment.reminderTime,
            notes: `${baseAppointment.notes || ''} (Recurring appointment)`.trim(),
          },
          include: {
            chat: {
              include: {
                participants: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        region: true,
                      },
                    },
                  },
                },
                relatedPost: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        region: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        recurringAppointments.push(recurringAppointment);
      }
    } catch (error) {
      // Skip this occurrence if there's an error, but continue with others
      console.warn(`Skipping recurring appointment on ${currentDate.toISOString()}: ${error}`);
    }
  }

  return recurringAppointments;
}

/**
 * Create system message for appointment events
 */
async function createAppointmentSystemMessage(
  chatId: string,
  appointment: Appointment,
  action: 'created' | 'updated' | 'confirmed' | 'cancelled' | 'completed',
  userId: string
): Promise<void> {
  const formattedDateTime = formatNorwegianDateTime(appointment.dateTime);
  
  let messageContent: string;
  switch (action) {
    case 'created':
      messageContent = `📅 Avtale opprettet for ${formattedDateTime.full}`;
      break;
    case 'updated':
      messageContent = `📝 Avtale oppdatert for ${formattedDateTime.full}`;
      break;
    case 'confirmed':
      messageContent = `✅ Avtale bekreftet for ${formattedDateTime.full}`;
      break;
    case 'cancelled':
      messageContent = `❌ Avtale avlyst for ${formattedDateTime.full}`;
      break;
    case 'completed':
      messageContent = `🎉 Avtale fullført for ${formattedDateTime.full}`;
      break;
    default:
      messageContent = `📅 Avtale ${action} for ${formattedDateTime.full}`;
  }

  await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      content: messageContent,
      type: 'APPOINTMENT_REQUEST', // Use existing type
      appointmentId: appointment.id,
    },
  });
}

/**
 * Generate appointment confirmation message
 */
function generateAppointmentConfirmationMessage(
  appointment: Appointment,
  meetingType?: string
): string {
  const formattedDateTime = formatNorwegianDateTime(appointment.dateTime);
  const duration = appointment.duration;
  
  let message = `Avtale opprettet for ${formattedDateTime.full}`;
  
  if (meetingType) {
    const typeLabels: Record<string, string> = {
      [MeetingType.FIRST_MEETING]: 'første møte',
      [MeetingType.REGULAR_LESSON]: 'undervisning',
      [MeetingType.EXAM_PREP]: 'eksamensforberedelse',
      [MeetingType.CONSULTATION]: 'konsultasjon',
      [MeetingType.TRIAL_LESSON]: 'prøvetime',
      [MeetingType.INTENSIVE_SESSION]: 'intensivkurs',
      [MeetingType.GROUP_LESSON]: 'gruppetime',
      [MeetingType.REVIEW_SESSION]: 'repetisjon',
    };
    
    const typeLabel = typeLabels[meetingType] || 'time';
    message = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} avtalt for ${formattedDateTime.full}`;
  }
  
  message += `\nVarighet: ${duration} minutter\nSted: ${appointment.location}`;
  
  if (appointment.specificLocation) {
    message += `\nDetaljer: ${appointment.specificLocation}`;
  }
  
  return message;
}

/**
 * Log appointment events for analytics
 */
async function logAppointmentEvent(
  appointmentId: string,
  eventType: string,
  userId: string,
  metadata?: any
): Promise<void> {
  // This would typically log to an analytics service
  // For now, we'll use console logging
  console.log('Appointment Event:', {
    appointmentId,
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    metadata,
  });
  
  // In production, you might want to store this in a separate analytics table
  // or send to an external analytics service
}

/**
 * Check user availability for a given time slot
 */
export async function checkUserAvailability(
  userId: string,
  dateTime: Date,
  duration: number,
  bufferMinutes: number = 15
): Promise<{
  isAvailable: boolean;
  conflictingAppointments: Array<{
    id: string;
    dateTime: Date;
    duration: number;
    status: AppointmentStatus;
  }>;
}> {
  const startTime = subMinutes(dateTime, bufferMinutes);
  const endTime = addMinutes(dateTime, duration + bufferMinutes);

  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      chat: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
      dateTime: {
        gte: startTime,
        lt: endTime,
      },
    },
    select: {
      id: true,
      dateTime: true,
      duration: true,
      status: true,
    },
  });

  return {
    isAvailable: conflictingAppointments.length === 0,
    conflictingAppointments,
  };
}

/**
 * Get appointment statistics for a user
 */
export async function getAppointmentStats(
  userId: string,
  dateRange?: { from: Date; to: Date }
): Promise<{
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  totalDuration: number;
  averageDuration: number;
  upcomingCount: number;
}> {
  const whereClause: any = {
    chat: {
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
  };

  if (dateRange) {
    whereClause.dateTime = {
      gte: dateRange.from,
      lte: dateRange.to,
    };
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    select: {
      status: true,
      duration: true,
      dateTime: true,
    },
  });

  const stats = appointments.reduce(
    (acc, appointment) => {
      acc.total++;
      acc.totalDuration += appointment.duration;
      
      switch (appointment.status) {
        case AppointmentStatus.COMPLETED:
          acc.completed++;
          break;
        case AppointmentStatus.CANCELLED:
          acc.cancelled++;
          break;
        case AppointmentStatus.PENDING:
          acc.pending++;
          break;
        case AppointmentStatus.CONFIRMED:
          acc.confirmed++;
          if (isAfter(appointment.dateTime, new Date())) {
            acc.upcomingCount++;
          }
          break;
      }
      
      return acc;
    },
    {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      confirmed: 0,
      totalDuration: 0,
      upcomingCount: 0,
    }
  );

  return {
    ...stats,
    averageDuration: stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0,
  };
}

/**
 * Export utility functions
 */
export const AppointmentUtils = {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  getUserAppointments,
  checkUserAvailability,
  getAppointmentStats,
  validateAppointmentTime,
  formatNorwegianDateTime,
} as const;