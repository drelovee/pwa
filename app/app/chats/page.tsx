import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';
import { MobileShell } from '../../../components/mobile/MobileShell';

export default async function ChatsPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      members: { include: { user: { include: { profile: true } } } },
      relatedTeam: true,
      relatedPost: true,
      relatedOrder: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <MobileShell active="chats">
      <div className="page-head">
        <div>
          <h1>Чаты</h1>
          <p>Личные, командные и рабочие переписки</p>
        </div>
      </div>

      <div className="search-box">Поиск по сообщениям</div>

      <div className="list">
        {chats.length === 0 && (
          <p className="muted">
            Пока нет чатов. Откликнитесь на объявление или предложите проект команде.
          </p>
        )}

        {chats.map((chat) => {
          const other = chat.members.find((m) => m.userId !== user.id);
          const lastMessage = chat.messages[0];

          const title =
            chat.relatedTeam?.name ||
            chat.relatedPost?.title ||
            chat.relatedOrder?.title ||
            chat.title ||
            other?.user.profile?.fullName ||
            other?.user.email ||
            'Чат';

          const subtitle =
            lastMessage?.text ||
            (chat.type === 'team'
              ? `${chat.members.length} участников`
              : 'Нет сообщений');

          const time = lastMessage
            ? new Date(lastMessage.createdAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <Link key={chat.id} href={`/app/chats/${chat.id}`} className="chat-list-item">
              <div className="chat-list-avatar">
                {title.slice(0, 1).toUpperCase()}
              </div>

              <div className="chat-list-main">
                <div className="between">
                  <b>{title}</b>
                  <span className="muted small">{time}</span>
                </div>

                <p className="muted">{subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </MobileShell>
  );
}