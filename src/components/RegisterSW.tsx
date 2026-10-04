'client' // ali 'use client' v novjših verzijah React/Next
import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker registriran:', reg.scope))
        .catch((err) => console.error('Napaka pri registraciji Service Workerja:', err));
    }
  }, []);

  return null;
}
