import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { error, json } from '@/lib/api';
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return error('Только админ', 403);
  const [users, profiles, posts, chats, teams, categories] = await Promise.all([
    prisma.user.count(), prisma.profile.count(), prisma.post.count(), prisma.chat.count(), prisma.team.count(), prisma.category.count()
  ]);
  return json({ users, profiles, posts, chats, teams, categories });
}
