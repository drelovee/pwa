'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

type NavKey = 'home' | 'market' | 'chats' | 'teams' | 'settings';

type Props = {
  active: NavKey;
};

const items: Array<{
  key: NavKey;
  href: string;
  label: string;
  icon: 'profile' | 'bag' | 'mail' | 'users' | 'menu';
}> = [
  { key: 'home', href: '/app/home', label: 'Профиль', icon: 'profile' },
  { key: 'market', href: '/app/market', label: 'Работа', icon: 'bag' },
  { key: 'chats', href: '/app/chats', label: 'Чаты', icon: 'mail' },
  { key: 'teams', href: '/app/teams', label: 'Команды', icon: 'users' },
  { key: 'settings', href: '/app/settings', label: 'Меню', icon: 'menu' },
];

function Icon({ name }: { name: string }) {
  if (name === 'profile') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c1.2-4 12.8-4 14 0" />
      </svg>
    );
  }

  if (name === 'bag') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M7 8h10l1 12H6L7 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
    );
  }

  if (name === 'mail') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 7h16v11H4V7Z" />
        <path d="M4 8l8 6 8-6" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="9" r="3" />
        <circle cx="16" cy="10" r="2.5" />
        <path d="M3.5 20c.8-4 10.2-4 11 0" />
        <path d="M13.5 20c.5-2.6 5.5-2.6 6 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 8h12" />
      <path d="M6 12h12" />
      <path d="M6 16h12" />
    </svg>
  );
}

export function BottomNav({ active }: Props) {
  const pathname = usePathname();
  const [pressed, setPressed] = useState<NavKey | null>(null);
  const [isPending, startTransition] = useTransition();

  const current =
    pressed ||
    items.find((item) => pathname.startsWith(item.href))?.key ||
    active;

  return (
    <>
      {isPending && (
        <div className="bottom-nav-mini-loader">
          <span />
          <span />
          <span />
        </div>
      )}

      <nav className="bottom-nav">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            onClick={() => {
              setPressed(item.key);
              startTransition(() => {});
            }}
            className={
              current === item.key
                ? 'bottom-nav-circle active'
                : 'bottom-nav-circle'
            }
          >
            <Icon name={item.icon} />
          </Link>
        ))}
      </nav>
    </>
  );
}