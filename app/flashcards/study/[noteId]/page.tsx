'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Card = { id: string; front: string; back: string; };

export default function StudyPage(){
  const { noteId } = useParams<{ noteId: string }>();
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(()=>{
    fetch(`/api/notes/${noteId}`).then(r=>r.json()).then(d => setCards(d.flashcards || []));
  }, [noteId]);

  async function review(q: number){
    const card = cards[idx];
    await fetch('/api/flashcards/review', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: card.id, quality: q }) });
    setShowBack(false);
    setIdx(i => Math.min(i+1, cards.length-1));
  }

  if(cards.length === 0) return <div className="p-6">No cards.</div>;
  const card = cards[idx];

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Flashcards</h1>
      <div className="bg-white border rounded-2xl p-6 min-h-[180px] cursor-pointer" onClick={()=>setShowBack(s=>!s)}>
        <p className="text-gray-500 text-sm mb-2">{idx+1} / {cards.length}</p>
        <p className="text-lg">{showBack ? card.back : card.front}</p>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="px-3 py-2 rounded-lg bg-gray-100" onClick={()=>review(2)}>Again</button>
        <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white" onClick={()=>review(4)}>Good</button>
        <button className="px-3 py-2 rounded-lg bg-emerald-600 text-white" onClick={()=>review(5)}>Easy</button>
      </div>
    </div>
  );
}
