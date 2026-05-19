import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret_change_me');

export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(secret);
}

export async function setAuthCookie(userId: string) {
  const token = await createToken(userId);
  (await cookies()).set('skillcrew_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete('skillcrew_token');
}

export async function getCurrentUser() {
  const token = (await cookies()).get('skillcrew_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.sub;
    if (!id) return null;
    return prisma.user.findUnique({
      where: { id },
      include: { profile: { include: { categories: { include: { category: true, subcategory: true } } } } },
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
