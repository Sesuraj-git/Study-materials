'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage(){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) });
    if(res.ok){ router.push('/login'); } else { alert('Could not register'); }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Create your account</h1>
        <input className="w-full border rounded-lg px-4 py-2 mb-3" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full border rounded-lg px-4 py-2 mb-3" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-4 py-2 mb-4" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg">Sign up</button>
      </form>
    </div>
  );
}
