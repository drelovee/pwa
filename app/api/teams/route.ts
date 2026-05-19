import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const my = url.searchParams.get('my') === '1';
  const user = my ? await requireUser() : null;
  const teams = await prisma.team.findMany({
    where: {
      ...(my && user ? { members: { some: { userId: user.id } } } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
    },
    include: { members: { include: { user: { include: { profile: true } } } }, categories: { include: { category: true, subcategory: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return json({ teams });
}
const schema = z.object({ name: z.string().min(2), description: z.string().optional(), categories: z.array(z.object({ categoryId: z.string(), subcategoryId: z.string().optional().nullable() })).default([]) });
export async function POST(req: Request) {
  const user = await requireUser();
  if (user.accountType !== 'executor') return error('Команды создают только исполнители', 403);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return error('Проверьте поля команды');
  const team = await prisma.team.create({
    data: {
      ownerId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      members: { create: { userId: user.id, roleTitle: 'Владелец', isAdmin: true } },
      categories: { create: parsed.data.categories.map((c) => ({ categoryId: c.categoryId, subcategoryId: c.subcategoryId || null })) },
      chats: { create: { type: 'team', title: parsed.data.name, members: { create: { userId: user.id, role: 'admin' } }, messages: { create: { type: 'system', text: `Создан чат команды ${parsed.data.name}` } } } },
    },
  });
  return json({ team });
}
