import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
    title: 'Mind Spark – Smart Parking Marketplace',
    description: 'Find, book, and share parking spaces in real-time. Connecting drivers and hosts across your city.',
    keywords: 'parking, smart parking, shared economy, find parking, host parking',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
