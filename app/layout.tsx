import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { AuthGuard } from '@/components/AuthGuard'
import { ReminderChecker } from '@/components/ReminderChecker'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'Stay Close - אפליקציית קרבה',
  description: 'אפליקציה לניהול קשרים וקרבה עם אנשים חשובים בחייך',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stay Close',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" suppressHydrationWarning>
      <body>
        <ThemeProvider />
        <AuthGuard>
          <ServiceWorkerRegistration />
          <Header />
          <main>
            {children}
          </main>
          <ReminderChecker />
        </AuthGuard>
      </body>
    </html>
  )
}

