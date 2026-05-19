'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton(){const router=useRouter();return <button className="btn danger" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/auth/login');}}>Выйти</button>}
