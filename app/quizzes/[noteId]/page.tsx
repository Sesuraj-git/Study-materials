'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Q = { q: string; options: string[]; answerIndex: number };

export default function QuizPage(){
  const { noteId } = useParams<{ noteId: string }>();
  const [qs, setQs] = useState<Q[]>([]);
  const [score, setScore] = useState<number | null>(null);

  useEffect(()=>{ fetch(`/api/quizzes/${noteId}`).then(r=>r.json()).then(setQs); }, [noteId]);

  async function submit(e:any){
    e.preventDefault();
    const form = new FormData(e.target);
    const answers = qs.map((_, i)=> Number(form.get(String(i))));
    const res = await fetch(`/api/quizzes/${noteId}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ answers }) });
    const data = await res.json();
    setScore(data.score);
  }

  if(qs.length === 0) return <div className="p-6">No questions.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Quiz</h1>
      <form onSubmit={submit} className="space-y-4">
        {qs.map((q, i)=> (
          <div key={i} className="bg-white border rounded-xl p-4">
            <p className="font-medium mb-2">{i+1}. {q.q}</p>
            <div className="space-y-2">
              {q.options.map((op, j)=> (
                <label key={j} className="flex items-center gap-2">
                  <input name={String(i)} type="radio" value={j} required/>
                  <span>{op}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Submit</button>
      </form>
      {score !== null && <p className="mt-4 font-medium">Score: {score} / {qs.length}</p>}
    </div>
  );
}
