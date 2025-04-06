'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { hasUpdater } from '@/services/environment';
import { checkForAppUpdates } from '@/helpers/updater';
import { useTranslation } from '@/hooks/useTranslation';
import { useOpenWithBooks } from '@/hooks/useOpenWithBooks';
import { useSettingsStore } from '@/store/settingsStore';
import Reader from './components/Reader';

function ReaderPageContent() {
  const _ = useTranslation();
  const { settings } = useSettingsStore();
  const searchParams = useSearchParams();
  const filePath = searchParams ? searchParams.get('filePath') : null;

  useOpenWithBooks();

  useEffect(() => {
    const doCheckAppUpdates = async () => {
      if (hasUpdater() && settings.autoCheckUpdates) {
        await checkForAppUpdates(_);
      }
    };
    doCheckAppUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  return <Reader filePath={filePath ? decodeURIComponent(filePath) : undefined} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading reader...</div>}>
      <ReaderPageContent />
    </Suspense>
  );
}
