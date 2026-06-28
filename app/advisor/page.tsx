"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdvisorPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard?startCall=true")
  }, [router])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-500">Redirecting to Voice Assistant...</p>
      </div>
    </div>
  )
}

