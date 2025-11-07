import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/auth';

export async function POST(req: Request){
  const { email, password } = await req.json();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if(!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = signToken({ userId: user.id });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sb_token', token, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 60*60*24*7 });
  return res;
}
