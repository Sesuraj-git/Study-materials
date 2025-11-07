import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { flashcards } from '@/lib/schema';
import { eq } from 'drizzle-orm';

function toQuiz(cards: {front:string, back:string}[]){
  const qs = cards.slice(0,5).map((c, i) => {
    const opts = [c.back];
    // naive distractors from other cards' backs
    for(const d of cards){
      if(opts.length >= 4) break;
      if(d.back !== c.back) opts.push(d.back);
    }
    while(opts.length < 4) opts.push(c.front);
    // shuffle
    for(let j=opts.length-1; j>0; j--){ const k=Math.floor(Math.random()*(j+1)); [opts[j],opts[k]]=[opts[k],opts[j]]; }
    const answerIndex = opts.findIndex(o => o === c.back);
    return { q: c.front, options: opts, answerIndex };
  });
  return qs;
}

 async function GET(_: Request, { params }: { params: { noteId: string } }){
  const cards = await db.select({ front: flashcards.front, back: flashcards.back }).from(flashcards).where(eq(flashcards.noteId, params.noteId));
  return NextResponse.json(toQuiz(cards));
}

export async function POST(req: Request, { params }: { params:any){
  const body = await req.json();
  const answers: number[] = body.answers || [];
  const cards = await db.select({ front: flashcards.front, back: flashcards.back }).from(flashcards).where(eq(flashcards.noteId, params.noteId));
  const qs = toQuiz(cards);
  let score = 0;
  for(let i=0;i<qs.length;i++){ if(answers[i] === qs[i].answerIndex) score++; }
  return NextResponse.json({ score });
}
