import Link from 'next/link'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Logiciel Mère',
  description: 'Planning + Modules usinage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4 flex gap-6">
          <Link href="/">Accueil</Link>
          <Link href="/planning">Planning</Link>
        </nav>
        <div className="p-4">{children}</div>
      </body>
    </html>
  )
}
