import { Suspense } from 'react';
import EditorPageClient from './EditorPageClient';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="container p-6">Laden...</div>}>
      <EditorPageClient />
    </Suspense>
  );
}