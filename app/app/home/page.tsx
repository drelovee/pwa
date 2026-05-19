import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MobileShell } from '../../../components/mobile/MobileShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ customerId: user.id }, { executorId: user.id }],
    },
    take: 3,
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <MobileShell active="home">
      <div className="between">
        <div>
          <h1>Hi, {user.profile?.fullName}</h1>
          <p className="muted">
            @{user.profile?.username} ·{' '}
            {user.accountType === 'executor' ? 'Исполнитель' : 'Заказчик'}
          </p>
        </div>

        <div className="avatar">
          {user.profile?.fullName?.[0]}
        </div>
      </div>

      <div className="grid grid2" style={{ marginTop: 20 }}>
        <Link className="btn" href="/app/posts/new">
          {user.accountType === 'executor' ? 'Создать объявление' : 'Создать заказ'}
        </Link>

        <Link className="btn secondary" href="/app/settings">
          Редактировать профиль
        </Link>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Ваш профиль</h2>

        <div className="card">
          <p>{user.profile?.about || 'Описание пока не заполнено'}</p>

          <p className="muted">
            {user.accountType === 'executor' ? 'Заработано' : 'Потрачено'}:{' '}
            {user.accountType === 'executor'
              ? user.profile?.earnedTotal
              : user.profile?.spentTotal}{' '}
            ₽
          </p>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Мои публикации</h2>

        <div className="list">
          {posts.map((post) => (
            <div className="card" key={post.id}>
              <b>{post.title}</b>

              <p className="muted">
                {post.type === 'customer_order' ? 'Заказ' : 'Объявление'} ·{' '}
                {post.budgetRub} ₽ · {post.deadlineDays} дней
              </p>
            </div>
          ))}

          {!posts.length && <p className="muted">Пока пусто</p>}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Активные заказы</h2>

        <div className="list">
          {orders.map((order) => (
            <div className="card" key={order.id}>
              <div className="between">
                <b>{order.title}</b>
                <span className="status">{order.status}</span>
              </div>

              <p className="muted">{order.budgetRub} ₽</p>
            </div>
          ))}

          {!orders.length && (
            <p className="muted">
              После подтверждения в чате заказ появится здесь
            </p>
          )}
        </div>
      </section>
    </MobileShell>
  );
}
