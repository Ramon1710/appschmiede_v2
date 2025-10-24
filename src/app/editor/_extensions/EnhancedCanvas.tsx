// src/app/editor/_extensions/EnhancedCanvas.tsx
'use client';
import React from 'react';
import type { Project } from '@/types/editor';
import ResizeHandles from './ResizeHandles';
import Canvas from '../_components/Canvas';

export default function EnhancedCanvas({
  project,
  setProject,
  pageId,
  selectedId,
  setSelectedId,
  preview,
}: {
  project: Project;
  setProject: (p: Project) => void;
  pageId: string;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  preview: boolean;
}) {
  return (
    <div className="relative">
      <Canvas
        project={project}
        setProject={setProject}
        pageId={pageId}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        preview={preview}
      />
      <ResizeHandles project={project} setProject={setProject} selectedId={selectedId} preview={preview} />
    </div>
  );
}
