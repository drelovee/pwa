'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: 'Сервер вернул некорректный ответ' };
  }
}

export function LoginForm() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  return (
    <form
      className="auth"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr('');

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await safeJson(res);

        if (!res.ok) {
          setErr(data.message || 'Ошибка входа');
          return;
        }

        r.push('/app/home');
      }}
    >
      <h1>Вход</h1>

      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {err && <p style={{ color: '#b00020' }}>{err}</p>}

      <button className="btn">Войти</button>
      <a href="/auth/signup">Регистрация</a>
    </form>
  );
}

export function SignupForm() {
  const r = useRouter();
  const [role, setRole] = useState<'executor' | 'customer'>('executor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  return (
    <form
      className="auth"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr('');

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            password,
            accountType: role,
          }),
        });

        const data = await safeJson(res);

        if (!res.ok) {
          setErr(data.message || 'Ошибка регистрации');
          return;
        }

        r.push('/app/home');
      }}
    >
      <h1>Регистрация</h1>

      <div className="tabs">
        <button
          type="button"
          className={role === 'executor' ? 'active' : ''}
          onClick={() => setRole('executor')}
        >
          Executor
        </button>

        <button
          type="button"
          className={role === 'customer' ? 'active' : ''}
          onClick={() => setRole('customer')}
        >
          Customer
        </button>
      </div>

      <input
        className="input"
        placeholder="Имя"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {err && <p style={{ color: '#b00020' }}>{err}</p>}

      <button className="btn">Создать аккаунт</button>
      <a href="/auth/login">Уже есть аккаунт</a>
    </form>
  );
}