import Link from 'next/link';
import { MobileShell } from '../../../components/mobile/MobileShell';
import { prisma } from '@/lib/db';
import { SubmitButton } from '@/components/mobile/SubmitButton';


export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q || '';
  const categoryId = sp.categoryId;
  const type = sp.type;

  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  const posts = await prisma.post.findMany({
    where: {
      status: 'published',
      ...(type ? { type: type as any } : {}),
      ...(categoryId ? { categories: { some: { categoryId } } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              {
                author: {
                  profile: {
                    username: { contains: q, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      author: {
        include: {
          profile: true,
        },
      },
      categories: {
        include: {
          category: true,
          subcategory: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const profiles = q
    ? await prisma.profile.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
            { about: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          user: true,
        },
        take: 20,
      })
    : [];

  return (
    <MobileShell active="market">
      <div className="page-head">
        <div>
          <h1>SkillCrew</h1>
          <p>Витрина заказов, объявлений и профилей</p>
        </div>
      </div>

      <form className="searchbar">
        <input
          className="input"
          name="q"
          defaultValue={q}
          placeholder="Поиск по username, описанию, заказам, командам"
        />
      </form>

      <div className="grid grid2" style={{ marginTop: 18 }}>
        {categories.map((category) => (
          <Link
            className="category"
            key={category.id}
            href={`/app/market?categoryId=${category.id}`}
          >
            {category.name}
            <span>›</span>
          </Link>
        ))}
      </div>

      <div className="tabs" style={{ marginTop: 18 }}>
        <Link
          className={type === 'customer_order' ? 'active' : ''}
          href="/app/market?type=customer_order"
        >
          Заказы
        </Link>

        <Link
          className={type === 'executor_ad' ? 'active' : ''}
          href="/app/market?type=executor_ad"
        >
          Объявления
        </Link>

        <Link className={!type ? 'active' : ''} href="/app/market">
          Все
        </Link>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Результаты</h2>

        <div className="list">
          {posts.map((post) => (
            <div className="card" key={post.id}>
              <div className="between">
                <b>{post.title}</b>
                <span className="status">
                  {post.type === 'customer_order' ? 'заказ' : 'объявление'}
                </span>
              </div>

              <p>{post.description}</p>

              <p className="muted">
                @{post.author.profile?.username} · {post.budgetRub} ₽ ·{' '}
                {post.deadlineDays} дней
              </p>

              <form action={`/api/posts/${post.id}/respond`} method="post">
                <SubmitButton className="btn secondary">Откликнуться / написать</SubmitButton>
              </form>
            </div>
          ))}

          {!posts.length && <p className="muted">Пока нет публикаций</p>}
        </div>
      </section>

      {profiles.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2>Профили</h2>

          <div className="list">
            {profiles.map((profile) => (
              <div className="card" key={profile.id}>
                <b>{profile.fullName}</b>

                <p className="muted">
                  @{profile.username} · {profile.user.accountType}
                </p>

                <p>{profile.about}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </MobileShell>
  );
}