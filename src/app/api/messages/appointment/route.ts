import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { APIError } from '@/lib/errors';
import type { CreateAppointmentData } from "@prisma/client";


export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const body = await request.json();
    const { 
      chatId, 
      dateTime, 
      location, 
      specificLocation, 
      duration = 60, 
      notes, 
      reminderTime,
      messageContent 
    }: CreateAppointmentData & { messageContent?: string } = body;

    // Validate required fields
    if (!chatId || !dateTime || !location) {
      return NextResponse.json({ 
        error: 'Chat ID, date/time, and location are required' 
      }, { status: 400 });
    }

    // Verify user is participant in the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
    }

    // Validate appointment date is in the future
    const appointmentDate = new Date(dateTime);
    if (appointmentDate <= new Date()) {
      return NextResponse.json({ 
        error: 'Appointment date must be in the future' 
      }, { status: 400 });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        chatId,
        dateTime: appointmentDate,
        location,
        specificLocation,
        duration,
        notes,
        reminderTime,
        status: 'PENDING',
      },
    });

    // Create system message about the appointment request
    const systemMessageContent = messageContent || 
      `${participant.user.name} has requested an appointment for ${appointmentDate.toLocaleDateString('no-NO')} at ${appointmentDate.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} in ${location}.`;

    const message = await prisma.message.create({
      data: {
        content: systemMessageContent,
        type: 'APPOINTMENT_REQUEST',
        chatId,
        senderId: userId,
        appointmentId: appointment.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        appointment: true,
      },
    });

    // Update chat's last message timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    // Update unread count for other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: { not: userId },
        isActive: true,
      },
    });

    if (otherParticipants.length > 0) {
      await prisma.chatParticipant.updateMany({
        where: {
          id: {
            in: otherParticipants.map(p => p.id),
          },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({
      appointment,
      message,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment message:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const body = await request.json();
    const { appointmentId, action, messageContent } = body; // action: 'accept', 'reject', 'confirm', 'complete'

    if (!appointmentId || !action) {
      return NextResponse.json({ 
        error: 'Appointment ID and action are required' 
      }, { status: 400 });
    }

    // Get appointment with chat info
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
      },
      include: {
        chat: {
          include: {
            participants: {
              where: {
                userId,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!appointment || appointment.chat.participants.length === 0) {
      return NextResponse.json({ 
        error: 'Appointment not found or access denied' 
      }, { status: 404 });
    }

    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: appointment.chatId,
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let updatedAppointment;
    let systemMessage;
    let messageType: 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE' = 'APPOINTMENT_RESPONSE';

    switch (action) {
      case 'accept':
        updatedAppointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'CONFIRMED' },
        });
        
        systemMessage = messageContent || 
          `${participant.user.name} has accepted the appointment request.`;
        break;

      case 'reject':
        updatedAppointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: { 
            status: 'CANCELLED',
            cancellationReason: messageContent || 'Declined by participant',
          },
        });
        
        systemMessage = messageContent || 
          `${participant.user.name} has declined the appointment request.`;
        break;

      case 'confirm':
        // Mark participant as ready
        const postField = appointment.chat.participants.some(p => 
          p.userId === userId && appointment.chat.relatedPost?.type === 'TEACHER'
        ) ? 'teacherReady' : 'studentReady';
        
        updatedAppointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: { [postField]: true },
        });

        // Check if both are ready
        if (updatedAppointment.teacherReady && updatedAppointment.studentReady) {
          updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { bothCompleted: true },
          });
          
          systemMessage = `Both participants have confirmed the appointment is ready to proceed.`;
          messageType = 'SYSTEM_MESSAGE';
        } else {
          systemMessage = messageContent || 
            `${participant.user.name} has confirmed they are ready for the appointment.`;
        }
        break;

      case 'complete':
        updatedAppointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'COMPLETED' },
        });
        
        systemMessage = messageContent || 
          `${participant.user.name} has marked the appointment as completed.`;
        messageType = 'SYSTEM_MESSAGE';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create response message
    const message = await prisma.message.create({
      data: {
        content: systemMessage,
        type: messageType,
        chatId: appointment.chatId,
        senderId: userId,
        appointmentId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        appointment: updatedAppointment,
      },
    });

    // Update chat's last message timestamp
    await prisma.chat.update({
      where: { id: appointment.chatId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({
      appointment: updatedAppointment,
      message,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}