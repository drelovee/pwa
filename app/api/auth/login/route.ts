import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { error, json } from '@/lib/api';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return error('Введите email и пароль');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { profile: true } });
  if (!user) return error('Неверная почта или пароль', 401);
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return error('Неверная почта или пароль', 401);
  await setAuthCookie(user.id);
  return json({ user: { id: user.id, email: user.email, accountType: user.accountType, profile: user.profile } });
}
