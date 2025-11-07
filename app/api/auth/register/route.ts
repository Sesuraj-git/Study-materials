import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const Schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request){
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if(!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  const hash = await bcrypt.hash(parsed.data.password, 10);
  const [user] = await db.insert(users).values({ name: parsed.data.name, email: parsed.data.email, passwordHash: hash }).returning();
  return NextResponse.json({ id: user.id, email: user.email });
}
