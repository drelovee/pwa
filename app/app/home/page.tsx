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

  const isExecutor = user.accountType === 'executor';
  const name = user.profile?.fullName || 'Alex';
  const firstName = name.split(' ')[0] || 'Alex';

  return (
    <MobileShell active="home">
      <div className="home-hero">
        <div>
          <h1>Hi, {firstName} 👋</h1>
          <p className="muted">У вас {orders.length} активных заказа</p>

          <Link className="home-main-action" href="/app/posts/new">
 	    <span>＋</span>
 	    {isExecutor ? 'Создать объявление' : 'Создать заказ'}
	  </Link>
        </div>

        <Link href="/app/settings" className="home-big-avatar">
          <span>◎</span>
        </Link>
      </div>


       
      

      {isExecutor ? (
        <>
          {(user.profile?.fullName || user.profile?.title || user.profile?.about) && (
            <section className="home-profile-card">
              <div className="home-profile-top">
                <div className="home-profile-avatar">◎</div>

                <div>
                  <b>{user.profile?.fullName || name}</b>
                  {user.profile?.title && (
                    <p className="muted">{user.profile.title}</p>
                  )}
                  {!user.profile?.title && user.profile?.about && (
                    <p className="muted">{user.profile.about}</p>
                  )}
                </div>

                <Link href="/app/resume" className="home-dots">
                  •••
                </Link>
              </div>

              {user.profile?.skills && user.profile.skills.length > 0 && (
                <div className="home-tags">
                  {user.profile.skills.slice(0, 5).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              )}
	      {posts.length > 0 && (
  	        <Link href="/app/resume" className="home-portfolio-card">
   		  <div>
     		    <b>Примеры работ</b>
    		    <p className="muted">Смотреть портфолио ›</p>
    		  </div>

   		  <div className="portfolio-preview">
    		    <span />
   		    <span />
   		    <span>＋</span>
  		  </div>
  		</Link>
	      )}
      	    </section>
          )}


          <div className="home-show-all">
            <Link href="/app/resume">Показать все ›</Link>
          </div>
        </>
      ) : (
        <section className="home-stats">
          <div>
            <b>4.9★</b>
            <span>Рейтинг</span>
          </div>

          <div>
            <b>{orders.length || 12}</b>
            <span>выполнено</span>
          </div>

          <div>
            <b>${user.profile?.spentTotal || 240}</b>
            <span>потрачено</span>
          </div>
        </section>
      )}

      <section className="home-section">
        <h2>Активные заказы</h2>

                <div className="home-orders-list">
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <div className="home-order-card" key={order.id}>
                <div className={`order-dot dot-${index + 1}`} />

                <div className="order-info">
                  <b>{order.title}</b>

                  <p className="muted">
                    {formatStatus(order.status)}
                    {' • '}
                    ₽{order.budgetRub}
                  </p>

                  {index === 0 && (
                    <div className="order-progress">
                      <span />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="home-empty-orders">
              <p>Активных заказов пока нет</p>
            </div>
          )}
        </div>

        <div className="home-show-all">
          <Link href="/app/orders">Показать все ›</Link>
        </div>
      </section>

      {!isExecutor && (
        <section className="home-section">
          <h2>Быстрые действия</h2>

          <div className="quick-actions">
            <button>♥<span>Избранное</span></button>
            <button>◎<span>Баланс</span></button>
            <form action="/api/auth/logout" method="post">
              <button>↪<span>Выход</span></button>
            </form>
          </div>
        </section>
      )}
    </MobileShell>
  );
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    draft: 'Черновик',
    confirmed: 'Подтверждён',
    in_progress: 'В работе',
    paused: 'На паузе',
    needs_attention: 'Требует внимания',
    review: 'На проверке',
    completed: 'Завершен',
    cancelled: 'Отменён',
  };

  return map[status] || status;
}