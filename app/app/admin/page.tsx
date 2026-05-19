import { redirect } from 'next/navigation';
import { MobileShell } from '../../../components/mobile/MobileShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';

async function createCategory(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user?.isAdmin) redirect('/app/home');

  const name = String(formData.get('name'));
  const subs = String(formData.get('subs') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  await prisma.category.create({
    data: {
      name,
      slug: slugify(name),
      subcategories: {
        create: subs.map((sub) => ({
          name: sub,
          slug: slugify(sub),
        })),
      },
    },
  });

  redirect('/app/admin');
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  if (!user.isAdmin) {
    return (
      <MobileShell active="settings">
        <div className="page-head">
          <div>
            <h1>Админка</h1>
            <p>Управление приложением</p>
          </div>
        </div>

        <div className="card">
          <p className="muted">
            Ваш аккаунт не админ. Чтобы временно включить админа,
            поставьте isAdmin=true в БД.
          </p>
        </div>
      </MobileShell>
    );
  }

  const [users, posts, chats, teams, categories] = await Promise.all([
    prisma.user.findMany({
      include: {
        profile: true,
      },
    }),
    prisma.post.findMany(),
    prisma.chat.findMany(),
    prisma.team.findMany(),
    prisma.category.findMany({
      include: {
        subcategories: true,
      },
    }),
  ]);

  return (
    <MobileShell active="settings">
      <div className="page-head">
        <div>
          <h1>Админка</h1>
          <p>Пользователи, публикации, чаты, команды и категории</p>
        </div>
      </div>

      <div className="grid grid3">
        <div className="card">Пользователи: {users.length}</div>
        <div className="card">Публикации: {posts.length}</div>
        <div className="card">Чаты: {chats.length}</div>
        <div className="card">Команды: {teams.length}</div>
        <div className="card">Категории: {categories.length}</div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Создать категорию</h2>

        <form action={createCategory} className="card grid">
          <input className="input" name="name" placeholder="Название" />

          <input
            className="input"
            name="subs"
            placeholder="Подкатегории через запятую"
          />

          <button className="btn">Создать</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Пользователи</h2>

        <div className="list">
          {users.map((item) => (
            <div className="card" key={item.id}>
              <b>{item.profile?.fullName}</b>

              <p className="muted">
                {item.email} · @{item.profile?.username} · {item.accountType}
              </p>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}