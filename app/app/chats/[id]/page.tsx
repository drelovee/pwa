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
async function confirmOrder(formData: FormData) {
  'use server';

  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const chatId = String(formData.get('chatId'));

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      members: true,
      relatedPost: true,
      relatedOrder: true,
      relatedTeam: true,
    },
  });

  if (!chat) return;

  const isMember = chat.members.some((member) => member.userId === user.id);

  if (!isMember && !user.isAdmin) {
    throw new Error('Нет доступа к чату');
  }

  if (chat.relatedOrderId) {
    await prisma.order.update({
      where: { id: chat.relatedOrderId },
      data: { status: 'confirmed' },
    });

    await prisma.message.create({
      data: {
        chatId,
        senderId: null,
        type: 'system',
        text: 'Заказ подтверждён.',
      },
    });

    revalidatePath(`/app/chats/${chatId}`);
    revalidatePath('/app/home');
    return;
  }

  if (!chat.relatedPost) return;

  const customerId =
    chat.relatedPost.type === 'customer_order'
      ? chat.relatedPost.authorId
      : user.id;

  const executorMember = chat.members.find(
    (member) => member.userId !== customerId
  );

  const executorId =
    chat.relatedPost.type === 'executor_ad'
      ? chat.relatedPost.authorId
      : executorMember?.userId || null;

  const orderData: any = {
    title: chat.relatedPost.title,
    description: chat.relatedPost.description,
    budgetRub: chat.relatedPost.budgetRub,
    deadlineDays: chat.relatedPost.deadlineDays,
    customerId,
    status: 'confirmed',
    postId: chat.relatedPost.id,
  };

  if (executorId) {
    orderData.executorId = executorId;
  }

  if (chat.relatedTeamId) {
    orderData.teamId = chat.relatedTeamId;
  }

  const order = await prisma.order.create({
    data: orderData,
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: {
      relatedOrderId: order.id,
      updatedAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      chatId,
      senderId: null,
      type: 'system',
      text: 'Заказ подтверждён и добавлен в активные заказы.',
    },
  });

  revalidatePath(`/app/chats/${chatId}`);
  revalidatePath('/app/home');
}

async function cancelOrder(formData: FormData) {
  'use server';

  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const chatId = String(formData.get('chatId'));

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      members: true,
      relatedOrder: true,
    },
  });

  if (!chat) return;

  const isMember = chat.members.some((member) => member.userId === user.id);

  if (!isMember && !user.isAdmin) {
    throw new Error('Нет доступа к чату');
  }

  if (chat.relatedOrderId) {
    await prisma.order.update({
      where: { id: chat.relatedOrderId },
      data: { status: 'cancelled' },
    });
  }

  await prisma.message.create({
    data: {
      chatId,
      senderId: null,
      type: 'system',
      text: 'Заказ отменён.',
    },
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: {
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/app/chats/${chatId}`);
  revalidatePath('/app/home');
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

        <a className="chat-search">
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

      {(chat.type === 'offer' || chat.type === 'admin_team_offer') &&
        !chat.relatedOrderId && (
          <section className="chat-confirm-panel">
            <div>
              <b>Подтвердить заказ?</b>
              <p>После подтверждения заказ появится в активных заказах.</p>
            </div>

            <div className="chat-confirm-actions">
              <form action={confirmOrder}>
                <input type="hidden" name="chatId" value={chat.id} />
                <button type="submit">Подтвердить</button>
              </form>

              <form action={cancelOrder}>
                <input type="hidden" name="chatId" value={chat.id} />
                <button type="submit">Отменить</button>
              </form>
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