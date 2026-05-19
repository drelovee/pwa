import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../lib/db';
import { getCurrentUser } from '../../../../lib/auth';

async function sendMessage(formData: FormData) {
  'use server';

  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const chatId = String(formData.get('chatId'));
  const text = String(formData.get('text') || '').trim();

  if (!text) return;

  const member = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId: user.id,
      },
    },
  });

  if (!member && !user.isAdmin) {
    throw new Error('Нет доступа к чату');
  }

  await prisma.message.create({
    data: {
      chatId,
      senderId: user.id,
      type: 'text',
      text,
    },
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/app/chats/${chatId}`);
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const { id } = await params;

  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
      },
      relatedPost: true,
      relatedOrder: true,
      relatedTeam: true,
    },
  });

  if (!chat) {
    return <div className="chat-screen">Чат не найден</div>;
  }

  const isMember = chat.members.some((m) => m.userId === user.id);

  if (!isMember && !user.isAdmin) {
    return <div className="chat-screen">Нет доступа к этому чату</div>;
  }

  const otherMembers = chat.members.filter((m) => m.userId !== user.id);

  const title =
    chat.relatedTeam?.name ||
    chat.relatedPost?.title ||
    chat.relatedOrder?.title ||
    chat.title ||
    otherMembers[0]?.user.profile?.fullName ||
    otherMembers[0]?.user.email ||
    'Чат';

  const subtitle =
    chat.type === 'team'
      ? `${chat.members.length} участников`
      : chat.type === 'admin_team_offer'
        ? `Чат с командой • ${chat.members.length} участника`
        : otherMembers[0]?.user.profile?.username
          ? `@${otherMembers[0].user.profile.username}`
          : `${chat.members.length} участника`;

  let lastDate = '';

  return (
    <div className="chat-screen">
      <header className="chat-top">
        <a href="/app/chats" className="chat-back">‹</a>

        <div className="chat-avatar">
          {(title || 'C').slice(0, 1).toUpperCase()}
        </div>

        <div className="chat-title-box">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <a className="chat-search" href={`/app/chats/${chat.id}?search=1`}>
          🔍
        </a>
      </header>

      {(chat.type === 'team' || chat.type === 'admin_team_offer') && (
        <section className="chat-members">
          {chat.members.map((member) => (
            <div className="chat-member-pill" key={member.id}>
              <span>
                {(member.user.profile?.fullName || member.user.email).slice(0, 1).toUpperCase()}
              </span>
              <div>
                <b>{member.user.profile?.fullName || member.user.email}</b>
                <p>{member.role || member.user.profile?.username || 'участник'}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <main className="chat-messages-list">
        {chat.messages.length === 0 && (
          <div className="empty-chat">
            Сообщений пока нет. Напишите первое сообщение.
          </div>
        )}

        {chat.messages.map((message) => {
          const mine = message.senderId === user.id;
          const currentDate = formatDate(message.createdAt);
          const showDate = currentDate !== lastDate;
          lastDate = currentDate;

          const authorName =
            message.sender?.profile?.fullName ||
            message.sender?.email ||
            'Система';

          return (
            <div key={message.id}>
              {showDate && (
                <div className="chat-date-divider">
                  {currentDate}
                </div>
              )}

              {message.type !== 'text' || !message.senderId ? (
                <div className="system-message">
                  <span>{message.text}</span>
                  <small>{formatTime(message.createdAt)}</small>
                </div>
              ) : (
                <div className={mine ? 'message-row mine' : 'message-row other'}>
                  {!mine && (
                    <div className="message-avatar">
                      {authorName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className={mine ? 'message-bubble mine' : 'message-bubble other'}>
                    {!mine && (
                      <div className="message-author">
                        {authorName}
                      </div>
                    )}

                    <div className="message-text">
                      {message.text}
                    </div>

                    <div className="message-meta">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {(chat.type === 'offer' || chat.type === 'admin_team_offer') && (
        <section className="chat-confirm-panel">
          <div>
            <b>Подтвердить заказ?</b>
            <p>После подтверждения заказ появится в активных заказах.</p>
          </div>
          <div className="chat-confirm-actions">
            <button type="button">Подтвердить</button>
            <button type="button">Отменить</button>
          </div>
        </section>
      )}

      <form action={sendMessage} className="chat-input-panel">
        <input type="hidden" name="chatId" value={chat.id} />
        <input name="text" placeholder="Введите сообщение..." autoComplete="off" />
        <button type="submit">➤</button>
      </form>
    </div>
  );
}