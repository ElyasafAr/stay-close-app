import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { AuthGuard } from '@/components/AuthGuard'
import { ReminderChecker } from '@/components/ReminderChecker'

export const metadata: Metadata = {
  title: 'Stay Close - אפליקציית קרבה',
  description: 'אפליקציה לניהול קשרים וקרבה עם אנשים חשובים בחייך',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <AuthGuard>
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

