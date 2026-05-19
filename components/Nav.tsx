import Link from 'next/link';
import { Briefcase, Home, Mail, Menu, Users } from 'lucide-react';
export function BottomNav({ active }: { active: string }) {
  const items = [
    ['home','/app/home',Home], ['market','/app/market',Briefcase], ['chats','/app/chats',Mail], ['teams','/app/teams',Users], ['settings','/app/settings',Menu]
  ] as const;
  return <nav className="nav">{items.map(([id,href,Icon])=><Link key={id} className={active===id?'active':''} href={href}><Icon size={21}/></Link>)}</nav>;
}
export function Sidebar({ active }: { active: string }) {
 const items = [['home','/app/home','Главная'],['market','/app/market','Витрина'],['chats','/app/chats','Чаты'],['teams','/app/teams','Команды'],['settings','/app/settings','Настройки'],['admin','/app/admin','Админка']];
 return <aside className="sidebar"><h2>SkillCrew</h2>{items.map(([id,href,title])=><Link key={id} className={active===id?'active':''} href={href}>{title}</Link>)}</aside>;
}
export function AppFrame({ active, children }: { active: string; children: React.ReactNode }) {
 return <div className="shell"><div className="desktopWrap"><Sidebar active={active}/><main className="mobile"><div className="container">{children}</div><BottomNav active={active}/></main></div></div>;
}
