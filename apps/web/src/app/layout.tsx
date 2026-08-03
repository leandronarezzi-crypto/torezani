import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Torezani Apoio Marítimo',
  description: 'Gerenciamento de embarcações: mecânica, propulsão, manutenção preventiva por horímetro e histórico de casco/pintura.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
