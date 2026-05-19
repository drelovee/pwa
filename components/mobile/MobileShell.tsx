import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

type Props = {
  active: 'home' | 'market' | 'chats' | 'teams' | 'settings';
  children: ReactNode;
};

export function MobileShell({ active, children }: Props) {
  return (
    <main className="mobile-app-shell">
      <div className="mobile-app-content">{children}</div>
      <BottomNav active={active} />
    </main>
  );
}