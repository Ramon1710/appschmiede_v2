import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, subtitle, updatedAt, children }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-3xl border border-white/10 bg-[#08111f]/90 p-6 shadow-2xl sm:p-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">{subtitle}</p>}
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-neutral-500">Stand: {updatedAt}</p>
        </header>

        <div className="mt-8 space-y-8 text-sm leading-7 text-neutral-200 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_p+a]:mt-3 [&_section]:space-y-4 [&_ul]:space-y-2">
          {children}
        </div>
      </div>
    </main>
  );
}