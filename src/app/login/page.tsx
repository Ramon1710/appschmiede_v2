// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="card">Lade…</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
