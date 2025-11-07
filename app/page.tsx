import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default async function Page() {
  const token = (await cookies()).get('sb_token')?.value;
  if (token && verifyToken(token)) redirect('/dashboard');
  redirect('/login');
}
