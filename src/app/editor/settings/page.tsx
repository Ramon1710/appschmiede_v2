import { Suspense } from "react";
import SettingsClient from "./SettingsClient";

export default function ProjectSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070e] text-neutral-200 grid place-items-center">
          <div className="text-center space-y-2">
            <div className="text-2xl">⚙️</div>
            <p>Projekt-Einstellungen werden geladen…</p>
          </div>
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}
