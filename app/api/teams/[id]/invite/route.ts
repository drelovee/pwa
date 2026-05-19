import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { getCurrentUser } from '../../../../../lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const username = String(body.username || '').replace('@', '').trim();

  if (!username) {
    return NextResponse.json({ message: 'Введите username' }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: true,
    },
  });

  if (!team) {
    return NextResponse.json({ message: 'Команда не найдена' }, { status: 404 });
  }

  const isAdmin = team.members.some(
    (member) => member.userId === user.id && member.isAdmin
  );

  if (!isAdmin && team.ownerId !== user.id && !user.isAdmin) {
    return NextResponse.json({ message: 'Нет прав' }, { status: 403 });
  }

  const invited = await prisma.user.findFirst({
    where: {
      accountType: 'executor',
      profile: {
        username,
      },
    },
  });

  if (!invited) {
    return NextResponse.json({ message: 'Исполнитель не найден' }, { status: 404 });
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: id,
        userId: invited.id,
      },
    },
  });

  if (existingMember) {
    return NextResponse.json({ message: 'Пользователь уже в команде' }, { status: 400 });
  }

  const invite = await prisma.teamInvite.create({
    data: {
      teamId: id,
      invitedUserId: invited.id,
      invitedByUserId: user.id,
    },
  });

  return NextResponse.json({ invite });
}