import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { APIError } from '@/lib/errors';


export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;
    const { messageId } = params;

    // Get message with chat participant verification
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        chat: {
          participants: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
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
        chat: {
          select: {
            id: true,
            relatedPostId: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;
    const { messageId } = params;

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if message exists and user is the sender
    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (existingMessage.sentAt < fifteenMinutesAgo) {
      return NextResponse.json({ error: 'Message is too old to edit' }, { status: 400 });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
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

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;
    const { messageId } = params;

    // Check if message exists and user is the sender
    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Check if message is too old to delete (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (existingMessage.sentAt < fifteenMinutesAgo) {
      return NextResponse.json({ error: 'Message is too old to delete' }, { status: 400 });
    }

    // Instead of hard delete, we'll soft delete by updating content
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: '[This message was deleted]',
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(deletedMessage);
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}