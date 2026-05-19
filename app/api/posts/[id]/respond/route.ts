import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, include: { author: { include: { profile: true } } } });
  if (!post) return error('Объявление не найдено', 404);
  if (post.authorId === user.id) return error('Нельзя откликнуться на своё объявление');
  const chat = await prisma.chat.create({
    data: {
      type: 'offer',
      title: `Отклик: ${post.title}`,
      relatedPost: {
        connect: {
          id: post.id
        }
      },
      members: { create: [{ userId: user.id }, { userId: post.authorId }] },
      messages: { create: [{ type: 'system', text: `${user.profile?.fullName || 'Пользователь'} откликнулся на «${post.title}». Подтверждает тот, кому откликнулись.` }] },
    },
    include: { messages: true, members: true },
  });
  return json({ chat });
}
