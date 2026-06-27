"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AuthLayout } from "@/components/marketing/auth-layout"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error("Invalid credentials", { description: "Please check your email and password." })
      } else {
        toast.success("Welcome back!", { description: "Redirecting to your dashboard..." })
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      toast.error("Something went wrong", { description: "Please try again later." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to access your digital twin and farm insights.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 font-bold text-sm">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="farmer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus-visible:ring-[#00e676] rounded-xl px-4 transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-300 font-bold text-sm">
                Password
              </Label>
              <Link href="#" className="text-xs font-bold text-[#00e676] hover:text-[#00c853] hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus-visible:ring-[#00e676] rounded-xl px-4 transition-all"
            />
          </div>
        </div>
        <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00e676] text-black font-extrabold hover:bg-[#00c853] hover:shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:-translate-y-0.5 transition-all duration-300" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-black/60" /> Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="pt-6 text-center text-sm font-medium text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-[#00e676] hover:text-[#00c853] transition-colors hover:underline">
            Sign up for free
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
