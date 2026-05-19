import { redirect } from 'next/navigation';
import { MobileShell } from '../../../components/mobile/MobileShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SubmitButton } from '@/components/mobile/SubmitButton';

async function createTeam(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const name = String(formData.get('name'));
  const description = String(formData.get('description') || '');

  await prisma.team.create({
    data: {
      ownerId: user.id,
      name,
      description,
      members: {
        create: {
          userId: user.id,
          roleTitle: 'Владелец',
          isAdmin: true,
        },
      },
      chats: {
        create: {
          type: 'team',
          title: name,
          members: {
            create: {
              userId: user.id,
              role: 'admin',
            },
          },
          messages: {
            create: {
              type: 'system',
              text: `Создан чат команды ${name}`,
            },
          },
        },
      },
    },
  });

  redirect('/app/teams');
}

async function applyTeam(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  await prisma.teamApplication.create({
    data: {
      teamId: String(formData.get('teamId')),
      userId: user.id,
    },
  });

  redirect('/app/teams');
}

async function offerTeam(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const teamId = String(formData.get('teamId'));

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      members: true,
    },
  });

  const admin = team?.members.find((member) => member.isAdmin);

  if (team && admin) {
    await prisma.chat.create({
      data: {
        type: 'admin_team_offer',
        title: `Предложение проекта: ${team.name}`,
        relatedTeam: {
          connect: {
            id: team.id,
          },
        },
        members: {
          create: [
            {
              userId: user.id,
            },
            {
              userId: admin.userId,
              role: 'admin',
            },
          ],
        },
        messages: {
          create: {
            type: 'system',
            text: `Заказчик предложил проект команде ${team.name}. Переписку видит админ команды.`,
          },
        },
      },
    });
  }

  redirect('/app/chats');
}

export default async function TeamsPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const teams = await prisma.team.findMany({
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
  });

  const myTeams = teams.filter((team) =>
    team.members.some((member) => member.userId === user.id)
  );

  const visibleTeams = user.accountType === 'executor' ? myTeams : teams;

  return (
    <MobileShell active="teams">
      <div className="page-head">
        <div>
          <h1>Команды</h1>
          <p>
            {user.accountType === 'executor'
              ? 'Ваши команды и создание новых команд'
              : 'Популярные команды для предложения проектов'}
          </p>
        </div>
      </div>

      {user.accountType === 'executor' && (
        <div className="card">
          <h2>Создать команду</h2>

          <form action={createTeam} className="grid">
            <input
              className="input"
              name="name"
              placeholder="Название команды"
            />

            <textarea
              className="textarea"
              name="description"
              placeholder="Описание команды"
            />

            <SubmitButton>Создать</SubmitButton>
          </form>
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>
          {user.accountType === 'executor' ? 'Мои команды' : 'Популярные команды'}
        </h2>

        <div className="list">
          {visibleTeams.map((team) => (
            <div className="card" key={team.id}>
              <div className="between">
                <b>{team.name}</b>
                <span className="muted">
                  {team.members.length} участников
                </span>
              </div>

              <p>{team.description || 'Описание пока не заполнено'}</p>

              {team.categories.length > 0 && (
                <p className="muted">
                  {team.categories
                    .map((item) =>
                      item.subcategory
                        ? `${item.category.name} / ${item.subcategory.name}`
                        : item.category.name
                    )
                    .join(', ')}
                </p>
              )}

              {user.accountType === 'executor' ? (
                <form action={applyTeam}>
                  <input type="hidden" name="teamId" value={team.id} />
                  <SubmitButton className="btn secondary">
                    Подать заявку
                  </SubmitButton>
                </form>
              ) : (
                <form action={offerTeam}>
                  <input type="hidden" name="teamId" value={team.id} />
                  <SubmitButton>
                    Предложить проект
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}

          {!visibleTeams.length && (
            <p className="muted">
              Пока нет команд. Создайте первую команду.
            </p>
          )}
        </div>
      </section>
    </MobileShell>
  );
}