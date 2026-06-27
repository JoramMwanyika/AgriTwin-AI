import type React from "react"
import { Roboto } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/auth-provider"
import { ChatProvider } from "@/components/chat-provider"
import { ChatBotWidget } from "@/components/chat-bot-widget"
import { CronPinger } from "@/components/cron-pinger"

const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ["latin"], variable: "--font-sans" })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={roboto.variable}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <AuthProvider>
          <ChatProvider>
            {children}
            <ChatBotWidget />
            <Toaster />
            <CronPinger />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: 'AgriTwin - AI Smart Farming Assistant',
  description: 'Your multilingual AI farming advisor powered by Azure AI',
  generator: 'v0.app'
};
