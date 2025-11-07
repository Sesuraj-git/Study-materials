import { db } from "@/lib/db";
import { flashcards } from "@/lib/schema";
import { Header } from "../dashboard/page";

export default async function FlashcardLibrary() {
  const cards = await db.select().from(flashcards).limit(100);
  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Flashcard Library</h1>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => (
            <li key={c.id} className="bg-white p-4 rounded-xl border">
              <p className="font-medium">{c.front}</p>
              <p className="text-sm text-gray-600 mt-1">{c.back}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
