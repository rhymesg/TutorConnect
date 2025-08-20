import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get unique teacher count (users who have created teacher posts)
    const teacherCount = await prisma.user.count({
      where: {
        posts: {
          some: {
            type: 'TEACHER'
          }
        }
      }
    });

    // Get unique student count (users who have created student posts)
    const studentCount = await prisma.user.count({
      where: {
        posts: {
          some: {
            type: 'STUDENT'
          }
        }
      }
    });

    // Get unique subject count
    const subjectCount = await prisma.post.findMany({
      select: {
        subject: true
      },
      distinct: ['subject']
    });

    // Get total posts for additional context
    const totalPosts = await prisma.post.count({
      where: {
        isActive: true
      }
    });

    const stats = {
      teachers: teacherCount,
      students: studentCount,
      subjects: subjectCount.length,
      totalPosts: totalPosts
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Stats API error:', error);
    
    // Return fallback stats in case of error
    return NextResponse.json({
      teachers: 0,
      students: 0,
      subjects: 0,
      totalPosts: 0
    });
  }
}