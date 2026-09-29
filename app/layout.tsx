import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: "Meo Cafe & Kasir",
  description: "Website menu cafe mewah & estetik Meo Cafe Malang dengan arsitektur MVC Vanilla JS, tema Claymorphism & Minimalist Biru-Putih, integrasi Supabase, fitur Kasir & Struk, serta Dashboard Owner & CRUD Menu.",
  openGraph: {
    title: "Meo Cafe & Kasir",
    description: "Website menu cafe mewah & estetik Meo Cafe Malang dengan arsitektur MVC Vanilla JS, tema Claymorphism & Minimalist Biru-Putih, integrasi Supabase, fitur Kasir & Struk, serta Dashboard Owner & CRUD Menu.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Meo Cafe & Kasir",
    description: "Website menu cafe mewah & estetik Meo Cafe Malang dengan arsitektur MVC Vanilla JS, tema Claymorphism & Minimalist Biru-Putih, integrasi Supabase, fitur Kasir & Struk, serta Dashboard Owner & CRUD Menu.",
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
