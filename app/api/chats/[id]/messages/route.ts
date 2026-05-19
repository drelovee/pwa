import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId: id, userId: user.id } } });
  if (!member) return error('Нет доступа к чату', 403);
  const messages = await prisma.message.findMany({ where: { chatId: id }, orderBy: { createdAt: 'asc' }, include: { sender: { include: { profile: true } } } });
  return json({ messages });
}
const schema = z.object({ text: z.string().min(1) });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId: id, userId: user.id } } });
  if (!member) return error('Нет доступа к чату', 403);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return error('Пустое сообщение');
  const message = await prisma.message.create({ data: { chatId: id, senderId: user.id, text: parsed.data.text } });
  await prisma.chat.update({ where: { id }, data: { updatedAt: new Date() } });
  return json({ message });
}
