import { prisma } from '@/lib/prisma';

/**
 * Update expired appointments to WAITING_TO_COMPLETE status
 * This function should be called periodically to check for appointments that have passed their scheduled time
 */
export async function updateExpiredAppointments(chatId?: string): Promise<number> {
  // Build where clause
  const whereClause: any = {
    status: 'CONFIRMED',
    dateTime: {
      lt: new Date()
    }
  };

  // If chatId is provided, only update appointments for that chat
  if (chatId) {
    whereClause.chatId = chatId;
  }

  // Find appointments that should be moved to WAITING_TO_COMPLETE
  const expiredAppointments = await prisma.appointment.findMany({
    where: whereClause
  });

  if (expiredAppointments.length === 0) {
    return 0;
  }

  // Update expired appointments to WAITING_TO_COMPLETE status and reset completion flags
  await prisma.appointment.updateMany({
    where: whereClause,
    data: {
      status: 'WAITING_TO_COMPLETE',
      teacherReady: false,
      studentReady: false,
      bothCompleted: false
    }
  });

  return expiredAppointments.length;
}