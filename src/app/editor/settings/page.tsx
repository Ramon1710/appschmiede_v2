import { Suspense } from "react";
import SettingsClient from "./SettingsClient";
import { cookies } from 'next/headers';

export default async function ProjectSettingsPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('lang')?.value;
  const lang = raw === 'en' ? 'en' : 'de';
  const loadingText =
    lang === 'en' ? 'Loading project settings…' : 'Projekt-Einstellungen werden geladen…';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070e] text-neutral-200 grid place-items-center">
          <div className="text-center space-y-2">
            <div className="text-2xl">⚙️</div>
            <p>{loadingText}</p>
          </div>
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}
