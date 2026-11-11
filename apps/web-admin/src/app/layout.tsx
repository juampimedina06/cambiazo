import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider, THEME_STORAGE_KEY } from '@/shared/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'CAMBIAZO — Consola de Administración Escolar',
  description:
    'Plataforma escolar multi-tenant para digitalización de pagos en kioscos y economía circular de útiles.',
  icons: {
    icon: '/logo-pencil-c.jpg',
  },
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative min-h-screen bg-canvas text-text-primary antialiased overflow-x-hidden">
        {/* Ambient Liquid Glass Backdrop Orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-32 -left-24 h-[460px] w-[460px] rounded-full bg-brand-primary/14 dark:bg-brand-primary/22 blur-[120px]" />
          <div className="absolute top-1/4 -right-24 h-[420px] w-[420px] rounded-full bg-accent-mint/14 dark:bg-accent-mint/14 blur-[120px]" />
          <div className="absolute -bottom-32 left-1/3 h-[380px] w-[380px] rounded-full bg-accent-yellow/12 dark:bg-brand-primary/12 blur-[130px]" />
        </div>

        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
