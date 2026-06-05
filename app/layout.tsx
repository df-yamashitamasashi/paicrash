import type { Metadata } from 'next'
import { Geist, Geist_Mono, M_PLUS_Rounded_1c } from 'next/font/google'
import { NextAuthProvider } from '@/components/providers'
import './globals.css'

const mPlusRounded = M_PLUS_Rounded_1c({ 
  weight: ['400', '700', '800'],
  subsets: ["latin"],
  variable: '--font-m-plus-rounded'
});
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PaiCrash',
  description: 'ぷよぷよ風の落ち物パズルゲーム。麻雀牌を揃えて消そう！オンライン対戦対応。',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${mPlusRounded.variable} font-sans antialiased bg-background`}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
