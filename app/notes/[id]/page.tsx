import { db } from '@/lib/db';
import { notes, flashcards } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export default async function NoteDetail({ params }: { params: { id: string } }){
  const [note] = await db.select().from(notes).where(eq(notes.id, params.id));
  const cards = await db.select().from(flashcards).where(eq(flashcards.noteId, params.id));
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">{note?.title ?? 'Untitled note'}</h1>
      <p className="text-gray-600 whitespace-pre-wrap">{note?.rawText}</p>
      <div className="mt-6 flex gap-3">
        <a href={`/flashcards/study/${note?.id}`} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Study Flashcards</a>
        <a href={`/quizzes/${note?.id}`} className="px-4 py-2 rounded-lg bg-gray-100">Take Quiz</a>
      </div>
      <h2 className="text-xl font-semibold mt-8 mb-3">Flashcards</h2>
      <ul className="grid sm:grid-cols-2 gap-3">
        {cards.map(c=> (
          <li key={c.id} className="bg-white p-4 rounded-xl border">
            <p className="font-medium">{c.front}</p>
            <p className="text-sm text-gray-600 mt-1">{c.back}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
