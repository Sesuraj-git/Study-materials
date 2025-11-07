import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notes, flashcards } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: Request, { params }: { params: { id: string } }){
  const [note] = await db.select().from(notes).where(eq(notes.id, params.id));
  const cards = await db.select().from(flashcards).where(eq(flashcards.noteId, params.id));
  return NextResponse.json({ note, flashcards: cards });
}
