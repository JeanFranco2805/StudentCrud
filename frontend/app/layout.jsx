import { Syne, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Students Vault',
  description: 'Brutalist Student Terminal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
