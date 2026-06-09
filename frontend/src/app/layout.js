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
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
                <meta name="theme-color" content="#0D0E1A" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Mind Spark" />
            </head>
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
