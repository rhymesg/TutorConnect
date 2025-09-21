import { prisma } from '@/lib/prisma';
import { sendAppointmentCompletionEmail } from '@/lib/email';

/**
 * Update expired appointments to WAITING_TO_COMPLETE status
 * This function should be called periodically to check for appointments that have passed their scheduled time
 */
export async function updateExpiredAppointments(chatId?: string): Promise<number> {
  const now = new Date();

  // Build base where clause
  const baseWhere: any = {
    status: 'CONFIRMED'
  };

  // If chatId is provided, only update appointments for that chat
  if (chatId) {
    baseWhere.chatId = chatId;
  }

  // Find appointments that should be moved to WAITING_TO_COMPLETE with chat and user details
  const confirmedAppointments = await prisma.appointment.findMany({
    where: baseWhere,
    include: {
      chat: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              emailAppointmentComplete: true
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              emailAppointmentComplete: true
            }
          },
          relatedPost: {
            select: {
              subject: true
            }
          }
        }
      }
    }
  });

  // Filter appointments where end time has passed (using duration)
  const expiredAppointments = confirmedAppointments.filter(appointment => {
    const appointmentStart = new Date(appointment.dateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration * 60 * 1000));
    return appointmentEnd <= now;
  });

  if (expiredAppointments.length === 0) {
    return 0;
  }

  // Get appointment IDs to update
  const expiredAppointmentIds = expiredAppointments.map(apt => apt.id);

  // Update expired appointments to WAITING_TO_COMPLETE status and reset completion flags
  await prisma.appointment.updateMany({
    where: {
      id: { in: expiredAppointmentIds }
    },
    data: {
      status: 'WAITING_TO_COMPLETE',
      teacherReady: false,
      studentReady: false,
      bothCompleted: false,
      completionEmailSent: false
    }
  });

  // Send appointment completion reminder emails (only for newly expired appointments)
  for (const appointment of expiredAppointments) {
    const { teacher, student } = appointment.chat;

    // Acquire a simple lock using the completionEmailSent flag to prevent duplicates
    const lockResult = await prisma.appointment.updateMany({
      where: {
        id: appointment.id,
        completionEmailSent: false
      },
      data: {
        completionEmailSent: true
      }
    });

    if (lockResult.count === 0) {
      console.log(`⏭️ Completion emails already processing or sent for appointment ${appointment.id}, skipping`);
      continue;
    }

    try {
      let emailsSent = false;

      // Send email to teacher if they have appointment completion notifications enabled
      if (teacher?.emailAppointmentComplete && teacher.email) {
        await sendAppointmentCompletionEmail(
          teacher.email,
          teacher.name,
          student?.name || 'Student',
          appointment.dateTime,
          appointment.duration,
          appointment.chat.relatedPost?.subject || 'Ukjent fag',
          appointment.chatId
        );
        console.log(`✅ Sent appointment completion email to teacher: ${teacher.email}`);
        emailsSent = true;
      }

      // Send email to student if they have appointment completion notifications enabled
      if (student?.emailAppointmentComplete && student.email) {
        await sendAppointmentCompletionEmail(
          student.email,
          student.name,
          teacher?.name || 'Teacher',
          appointment.dateTime,
          appointment.duration,
          appointment.chat.relatedPost?.subject || 'Ukjent fag',
          appointment.chatId
        );
        console.log(`✅ Sent appointment completion email to student: ${student.email}`);
        emailsSent = true;
      }

      if (!emailsSent) {
        // No emails were sent; revert flag so future attempts can try again
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            completionEmailSent: false
          }
        });
      }
    } catch (error) {
      console.error(`❌ Failed to send appointment completion emails for appointment ${appointment.id}:`, error);

      // Release lock so a future attempt can retry
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          completionEmailSent: false
        }
      });
    }
  }

  return expiredAppointments.length;
}

/**
 * Update user statistics when an appointment is completed
 * Updates session counts and unique teacher/student counts
 */
export async function updateUserStatsOnCompletion(appointmentId: string): Promise<void> {
  // Get appointment with chat information
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      chat: {
        select: {
          teacherId: true,
          studentId: true
        }
      }
    }
  });

  if (!appointment?.chat?.teacherId || !appointment?.chat?.studentId) {
    return;
  }

  const { teacherId, studentId } = appointment.chat;

  // Check if this is the first completed session between these two users
  const existingCompletedSessions = await prisma.appointment.count({
    where: {
      status: 'COMPLETED',
      id: { not: appointmentId }, // Exclude current appointment
      chat: {
        teacherId,
        studentId
      }
    }
  });

  const isFirstSession = existingCompletedSessions === 0;

  // Update user statistics in a transaction
  await prisma.$transaction([
    // Update teacher statistics
    prisma.user.update({
      where: { id: teacherId },
      data: {
        teacherSessions: { increment: 1 },
        ...(isFirstSession && { teacherStudents: { increment: 1 } })
      }
    }),
    // Update student statistics
    prisma.user.update({
      where: { id: studentId },
      data: {
        studentSessions: { increment: 1 },
        ...(isFirstSession && { studentTeachers: { increment: 1 } })
      }
    })
  ]);
}
