import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Citizen & GST All-in-One Calculator',
  description:
    'Complete professional All-in-One Calculator featuring GST Rates Calculator, Live Currency Converter, Citizen Calculator with Loan EMI, Calculation History, Age Calculator, and Banknote Cash Counter.',
  openGraph: {
    title: 'Citizen & GST All-in-One Calculator',
    description:
      'Complete professional All-in-One Calculator featuring GST Rates Calculator, Live Currency Converter, Citizen Calculator with Loan EMI, Calculation History, Age Calculator, and Banknote Cash Counter.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Citizen & GST All-in-One Calculator',
    description:
      'Complete professional All-in-One Calculator featuring GST Rates Calculator, Live Currency Converter, Citizen Calculator with Loan EMI, Calculation History, Age Calculator, and Banknote Cash Counter.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body
        suppressHydrationWarning
        className="font-sans antialiased text-[#171717] bg-[#F2FFF7] selection:bg-[#347BCB] selection:text-white min-h-screen"
      >
        {children}
      </body>
    </html>
  );
}
