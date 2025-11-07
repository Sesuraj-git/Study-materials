import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { flashcards } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request){
  const { id, quality } = await req.json();
  const [card] = await db.select().from(flashcards).where(eq(flashcards.id, id));
  if(!card) return NextResponse.json({ error: 'not found' }, { status: 404 });
  let repetitions = card.repetitions || 0;
  let interval = card.interval || 0;
  let easeFactor = card.easeFactor || 2.5;
  const q = Number(quality);
  if (q < 3) { repetitions = 0; interval = 1; }
  else { repetitions += 1; if (repetitions === 1) interval = 1; else if (repetitions === 2) interval = 6; else interval = Math.round(interval * easeFactor); }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * 0.08);
  const nextReview = new Date(Date.now() + (interval || 1) * 24*3600*1000);
  await db.update(flashcards).set({ repetitions, interval, easeFactor, nextReview }).where(eq(flashcards.id, id));
  return NextResponse.json({ id, repetitions, interval, easeFactor, nextReview });
}
