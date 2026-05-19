import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (user.accountType !== 'executor') return error('Заявку может подать только исполнитель', 403);
  const application = await prisma.teamApplication.create({ data: { teamId: id, userId: user.id } });
  return json({ application });
}
