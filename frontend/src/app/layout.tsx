import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Hello FHEVM - Secret Number Game',
    description: 'Learn FHEVM by building a confidential number guessing game',
    keywords: ['FHEVM', 'Zama', 'Confidential', 'Blockchain', 'Tutorial'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
