import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  budgetRub: z.coerce.number().int().min(0),
  deadlineDays: z.coerce.number().int().min(1),
  categories: z.array(z.object({ categoryId: z.string(), subcategoryId: z.string().optional().nullable() })).min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const categoryId = url.searchParams.get('categoryId') || undefined;
  const type = url.searchParams.get('type') as any;
  const posts = await prisma.post.findMany({
    where: {
      status: 'published',
      ...(type ? { type } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { author: { profile: { username: { contains: q, mode: 'insensitive' } } } }] } : {}),
      ...(categoryId ? { categories: { some: { categoryId } } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { author: { include: { profile: true } }, categories: { include: { category: true, subcategory: true } } },
  });
  return json({ posts });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return error('Проверьте поля объявления/заказа');
  const type = user.accountType === 'customer' ? 'customer_order' : 'executor_ad';
  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      type,
      title: parsed.data.title,
      description: parsed.data.description,
      budgetRub: parsed.data.budgetRub,
      deadlineDays: parsed.data.deadlineDays,
      categories: { create: parsed.data.categories.map((c) => ({ categoryId: c.categoryId, subcategoryId: c.subcategoryId || null })) },
    },
    include: { categories: { include: { category: true, subcategory: true } } },
  });
  return json({ post });
}
