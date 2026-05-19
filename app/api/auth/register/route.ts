import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { error, json } from '@/lib/api';
import { usernameFromName } from '@/lib/slug';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  accountType: z.enum(['executor', 'customer']),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return error('Проверьте поля регистрации');
  const { fullName, email, password, accountType } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return error('Email уже зарегистрирован');

  let username = usernameFromName(fullName);
  while (await prisma.profile.findUnique({ where: { username } })) username = usernameFromName(fullName);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      accountType,
      profile: { create: { fullName, username, title: accountType === 'executor' ? 'Исполнитель' : 'Заказчик', about: '' } },
    },
    include: { profile: true },
  });
  await setAuthCookie(user.id);
  return json({ user: publicUser(user) });
}

function publicUser(user: any) {
  return { id: user.id, email: user.email, accountType: user.accountType, profile: user.profile };
}
