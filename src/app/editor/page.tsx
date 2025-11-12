'use client';

import { Suspense } from 'react';
import EditorClient from './EditorClient';

export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <EditorClient />
    </Suspense>
  );
}