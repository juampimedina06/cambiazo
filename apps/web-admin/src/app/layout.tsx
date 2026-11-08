import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CAMBIAZO — Consola de Administración Escolar',
  description:
    'Plataforma escolar multi-tenant para digitalización de pagos en kioscos y economía circular de útiles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-canvas text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
