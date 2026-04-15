'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import {
  PRIVACY_CONSENT_CHANGED_EVENT,
  readPrivacyConsent,
  type PrivacyConsent,
} from '@/lib/privacy-consent';

const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9591311841405142';

function hasAdvertisingConsent(consent: PrivacyConsent | null) {
  return Boolean(consent?.analytics);
}

export default function AdSenseLoader({ enabled }: { enabled: boolean }) {
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCanLoad(false);
      return;
    }

    const syncConsent = (consent: PrivacyConsent | null) => {
      setCanLoad(hasAdvertisingConsent(consent));
    };

    syncConsent(readPrivacyConsent());

    const handleConsentChanged = (event: Event) => {
      const consent = (event as CustomEvent<PrivacyConsent>).detail ?? readPrivacyConsent();
      syncConsent(consent);
    };

    window.addEventListener(PRIVACY_CONSENT_CHANGED_EVENT, handleConsentChanged);
    return () => window.removeEventListener(PRIVACY_CONSENT_CHANGED_EVENT, handleConsentChanged);
  }, [enabled]);

  if (!enabled || !canLoad) {
    return null;
  }

  return (
    <Script
      id="adsense-loader"
      strategy="afterInteractive"
      async
      src={ADSENSE_SRC}
      crossOrigin="anonymous"
    />
  );
}