import { redirect } from 'next/navigation';
import { MobileShell } from '../../../../components/mobile/MobileShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SubmitButton } from '@/components/mobile/SubmitButton';


async function createPost(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const categoryId = String(formData.get('categoryId'));
  const subcategoryId = String(formData.get('subcategoryId') || '') || null;

  await prisma.post.create({
    data: {
      authorId: user.id,
      type: user.accountType === 'customer' ? 'customer_order' : 'executor_ad',
      title: String(formData.get('title')),
      description: String(formData.get('description')),
      budgetRub: Number(formData.get('budgetRub') || 0),
      deadlineDays: Number(formData.get('deadlineDays') || 1),
      categories: {
        create: {
          categoryId,
          subcategoryId,
        },
      },
    },
  });

  redirect('/app/market');
}

export default async function NewPostPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/auth/login');

  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
    },
  });

  return (
    <MobileShell active="home">
      <div className="page-head">
        <div>
          <h1>
            {user.accountType === 'executor' ? 'Новое объявление' : 'Новый заказ'}
          </h1>
          <p>
            Укажите описание, бюджет, срок и категорию, чтобы публикация появилась в витрине.
          </p>
        </div>
      </div>

      <form action={createPost} className="grid">
        <input className="input" name="title" placeholder="Название" />

        <textarea
          className="textarea"
          name="description"
          placeholder="Описание"
        />

        <input
          className="input"
          name="budgetRub"
          type="number"
          placeholder="Бюджет, ₽"
        />

        <input
          className="input"
          name="deadlineDays"
          type="number"
          placeholder="Срок, дней"
        />

        <select className="select" name="categoryId">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select className="select" name="subcategoryId">
          <option value="">Без подкатегории</option>

          {categories.flatMap((category) =>
            category.subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))
          )}
        </select>

        <SubmitButton>Опубликовать</SubmitButton>
      </form>
    </MobileShell>
  );
}