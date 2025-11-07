'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    setLoading(false);
    if(res.ok){ router.push('/dashboard'); } else { alert('Invalid credentials'); }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-white to-purple-50">
      <div className="flex-1 flex flex-col justify-center p-10 md:p-20 text-gray-800">
        <h1 className="text-5xl font-bold leading-tight">Find Your Perfect <span className="text-purple-600">Study Partner</span></h1>
        <p className="mt-4 text-gray-600 max-w-md">Connect with fellow students, join study groups, and collaborate on projects. Make learning more engaging and effective together.</p>
        <ul className="mt-6 space-y-3 text-gray-700">
          <li className="flex items-center space-x-2"><span className="text-green-500">✔</span><span>Smart matching based on interests and goals</span></li>
          <li className="flex items-center space-x-2"><span className="text-green-500">✔</span><span>Real-time messaging and collaboration tools</span></li>
          <li className="flex items-center space-x-2"><span className="text-green-500">✔</span><span>Shared workspaces for group projects</span></li>
        </ul>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="max-w-sm w-full p-10 bg-white rounded-2xl shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to continue your learning journey</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input type="email" placeholder="you@university.edu" value={email} onChange={(e)=>setEmail(e.target.value)} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">Don’t have an account? <a href="/register" className="text-purple-600 font-medium hover:underline">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}
