import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  const chats = await prisma.chat.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
      },
      relatedTeam: true,
      relatedPost: true,
      relatedOrder: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return NextResponse.json({ chats });
}