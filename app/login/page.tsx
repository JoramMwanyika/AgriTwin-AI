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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="farmer@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="input-mkt h-12 border-0"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <Link href="#" className="text-xs font-medium text-[#00e676] hover:text-[#00c853]">
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
            className="input-mkt h-12 border-0"
          />
        </div>
        <button type="submit" className="btn-primary flex h-12 w-full items-center justify-center gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-[#00e676] hover:text-[#00c853]">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
