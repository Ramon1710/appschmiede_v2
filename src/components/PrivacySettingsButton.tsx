'use client';

import { openPrivacySettings } from '@/lib/privacy-consent';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function PrivacySettingsButton({ className = '', children = 'Datenschutzeinstellungen' }: Props) {
  return (
    <button type="button" onClick={openPrivacySettings} className={className}>
      {children}
    </button>
  );
}