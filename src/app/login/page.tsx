import { Suspense } from 'react';
import LoginContent from './LoginContent';

export const dynamic = 'force-dynamic'; // verhindert SSG/Prerender-Probleme

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}