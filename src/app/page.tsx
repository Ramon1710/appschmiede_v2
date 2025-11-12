// path: src/app/page.tsx
import { redirect } from 'next/navigation';

// Startseite leitet direkt zum Editor
export const dynamic = 'force-dynamic';

export default function Home() {
  redirect('/editor');
}
