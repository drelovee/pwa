import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';
import { slugify } from '@/lib/slug';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { subcategories: { where: { isActive: true }, orderBy: { usageCount: 'desc' } } },
  });
  return json({ categories });
}

const schema = z.object({ name: z.string().min(2), imageUrl: z.string().optional(), subcategories: z.array(z.string()).default([]) });
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return error('Только админ может создавать категории', 403);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return error('Некорректная категория');
  const cat = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      imageUrl: parsed.data.imageUrl,
      subcategories: { create: parsed.data.subcategories.map((name) => ({ name, slug: slugify(name) })) },
    },
    include: { subcategories: true },
  });
  return json({ category: cat });
}
