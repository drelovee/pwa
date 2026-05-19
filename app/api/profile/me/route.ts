import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';

const schema = z.object({
  fullName: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  title: z.string().optional(),
  about: z.string().optional(),
  avatarUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
});
export async function GET() {
  const user = await requireUser();
  return json({ profile: user.profile, accountType: user.accountType, email: user.email });
}
export async function PATCH(req: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return error('Некорректные данные профиля');
  if (!user.profile) return error('Профиль не найден', 404);
  if (parsed.data.username) {
    const taken = await prisma.profile.findUnique({ where: { username: parsed.data.username } });
    if (taken && taken.id !== user.profile.id) return error('Короткое имя уже занято');
  }
  const profile = await prisma.profile.update({ where: { id: user.profile.id }, data: parsed.data });
  return json({ profile });
}
