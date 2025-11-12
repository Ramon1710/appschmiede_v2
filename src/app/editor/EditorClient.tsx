'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import EditorShell from './_components/EditorShell';

export default function EditorClient() {
  const search = useSearchParams();
  const pageParam = search?.get('p') ?? undefined;
  return <EditorShell initialPageId={pageParam} />;
}