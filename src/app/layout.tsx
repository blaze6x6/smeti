import type { Metadata, Viewport } from 'next';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const APP_NAME = 'Koledar odvoza — Smokuč';
const APP_DESC =
  'Koledar odvoza odpadkov za Smokuč (občina Žirovnica): odvoz ob ponedeljkih, e-poštna obvestila dan pred odvozom, podatki iz uradnega koledarja JEKO.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || 'http://localhost:3000'),
  title: {
    default: APP_NAME,
    template: '%s · Koledar odvoza Smokuč',
  },
  description: APP_DESC,
  applicationName: 'Odvoz Smokuč',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Odvoz Smokuč',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESC,
    type: 'website',
    locale: 'sl_SI',
    images: ['/images/hero-smokuc.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0e2418',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        {/* Samodejna registracija Service Workerja za PWA in celozaslonski način */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker uspešno registriran: ', registration.scope);
                    },
                    function(err) {
                      console.log('Registracija ServiceWorkerja ni uspela: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
