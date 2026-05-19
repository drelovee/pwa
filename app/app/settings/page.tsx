import { redirect } from 'next/navigation';
import { MobileShell } from '../../../components/mobile/MobileShell';
import { LogoutButton } from '@/components/LogoutButton';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SubmitButton } from '@/components/mobile/SubmitButton';

async function updateProfile(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user?.profile) redirect('/auth/login');

  await prisma.profile.update({
    where: {
      id: user.profile.id,
    },
    data: {
      fullName: String(formData.get('fullName') || ''),
      username: String(formData.get('username') || ''),
      title: String(formData.get('title') || ''),
      about: String(formData.get('about') || ''),
    },
  });

  redirect('/app/settings');
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  return (
    <MobileShell active="settings">
      <div className="page-head">
        <div>
          <h1>Настройки</h1>
          <p>Профиль, аккаунт, уведомления и выход</p>
        </div>
      </div>

      <div className="card">
        <p>Email: {user.email}</p>

        <p>
          Роль:{' '}
          {user.accountType === 'executor' ? 'Исполнитель' : 'Заказчик'}
        </p>

        <p className="muted">
          Уведомления, история операций и способы оплаты пока заглушки.
        </p>
      </div>

      <form action={updateProfile} className="grid" style={{ marginTop: 18 }}>
        <input
          className="input"
          name="fullName"
          defaultValue={user.profile?.fullName || ''}
          placeholder="Полное имя"
        />

        <input
          className="input"
          name="username"
          defaultValue={user.profile?.username || ''}
          placeholder="username без @"
        />

        <input
          className="input"
          name="title"
          defaultValue={user.profile?.title || ''}
          placeholder="Должность / статус"
        />

        <textarea
          className="textarea"
          name="about"
          defaultValue={user.profile?.about || ''}
          placeholder="О себе"
        />

        <SubmitButton>Сохранить профиль</SubmitButton>
      </form>

      <div style={{ marginTop: 20 }}>
        <LogoutButton />
      </div>
    </MobileShell>
  );
}