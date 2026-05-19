import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
export default async function Page(){const user=await getCurrentUser();return <main className="hero"><div className="auth"><h1>SkillCrew</h1><p>Маркетплейс заказчиков, исполнителей и команд с удалённой PostgreSQL-БД.</p><Link className="btn" href={user?'/app/home':'/auth/login'}>{user?'Открыть приложение':'Войти'}</Link><Link className="btn secondary" href="/auth/signup">Создать аккаунт</Link></div></main>}
