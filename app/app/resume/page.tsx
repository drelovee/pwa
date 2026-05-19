import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MobileShell } from '../../../components/mobile/MobileShell';
import { SubmitButton } from '../../../components/mobile/SubmitButton';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function updateResume(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user?.profile) redirect('/auth/login');
  const skills = String(formData.get('skills') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  await prisma.profile.update({
    where: {
      id: user.profile.id,
    },
    data: {
      fullName: String(formData.get('fullName') || ''),
      title: String(formData.get('title') || ''),
      about: String(formData.get('about') || ''),
      skills,
    },
  });

  redirect('/app/resume');
}

export default async function ResumePage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  return (
    <MobileShell active="home">
      <div className="resume-topbar">
        <Link href="/app/home" className="resume-back">
          ‹
        </Link>

        <h1>Ваше резюме</h1>

        <button form="resume-form" className="resume-save">
          Сохранить
        </button>
      </div>

      <form id="resume-form" action={updateResume} className="resume-page">
        <div className="resume-user">
          <div className="resume-avatar">◎</div>

          <div>
            <b>{user.profile?.fullName || 'Имя не указано'}</b>
            <p>{user.email}</p>
          </div>
        </div>

        <label>
          <span>Ваше имя</span>
          <input
            className="resume-input"
            name="fullName"
            defaultValue={user.profile?.fullName || ''}
          />
        </label>

        <label>
          <span>Ваша должность</span>
          <input
            className="resume-input"
            name="title"
            defaultValue={user.profile?.title || ''}
          />
        </label>

        <label>
          <span>Навыки через запятую</span>
          <input
            className="resume-input"
            name="skills"
            defaultValue={user.profile?.skills?.join(', ') || ''}
            placeholder="UX/UI, Figma, Mobile Design"
          />
        </label>

        <label>
          <span>О себе</span>
          <textarea
            className="resume-textarea"
            name="about"
            defaultValue={user.profile?.about || ''}
          />
        </label>

        <section className="resume-section">
          <div className="between">
            <h2>Навыки работы</h2>
            <button type="button" className="resume-add-btn">
              ＋ Добавить навык
            </button>
          </div>

          <div className="resume-tags">
            <span>Веб-дизайн</span>
            <span>UX/UI</span>
            <span>Мобильные приложения</span>
          </div>
        </section>

        <section className="resume-section">
          <div className="between">
            <h2>Портфолио</h2>
            <button type="button" className="resume-add-btn">
              ＋ Добавить работы
            </button>
          </div>

          <div className="resume-portfolio">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="resume-section">
          <h2>Опыт работы</h2>

          <div className="resume-experience">
            <div>
              <b>Lead UX Designer</b>
              <p>Май 2021 - Апрель 2024</p>
              <p>MoonlightApps</p>
            </div>

            <span>›</span>
          </div>
        </section>

        <div style={{ display: 'none' }}>
          <SubmitButton>Сохранить</SubmitButton>
        </div>
      </form>
    </MobileShell>
  );
}