import { redirect } from 'next/navigation';

export default function Home() {
  // Einfach erstmal aufs Dashboard leiten – Middleware/Client-Guard übernimmt Auth
  redirect('/dashboard');
}
