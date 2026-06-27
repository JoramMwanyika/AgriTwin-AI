"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AuthLayout } from "@/components/marketing/auth-layout"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match", { description: "Please make sure your passwords match." })
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Registration failed")
      }
      toast.success("Account created!", { description: "Welcome to AgriTwin. Please sign in to continue." })
      setTimeout(() => router.push("/login?registered=true"), 1000)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again later."
      toast.error("Registration failed", { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of farmers using AI-powered digital twins."
      tagline="Set up your farm in minutes — monitor blocks, get voice advice, and grow smarter."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300 font-bold text-sm">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-11 border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus-visible:ring-[#00e676] rounded-xl px-4 transition-all"
            />
          </div>
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
              className="h-11 border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus-visible:ring-[#00e676] rounded-xl px-4 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 font-bold text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="h-11 border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus-visible:ring-[#00e676] rounded-xl px-4 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300 font-bold text-sm">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              className="h-11 border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus-visible:ring-[#00e676] rounded-xl px-4 transition-all"
            />
          </div>
          <div className="flex items-start gap-3 py-1 text-sm pt-2">
            <input
              type="checkbox"
              required
              className="mt-1 rounded border-white/20 bg-black/40 text-[#00e676] focus:ring-[#00e676] outline-none"
            />
            <span className="text-slate-400 font-medium">
              I agree to the{" "}
              <Link href="#" className="font-bold text-[#00e676] hover:text-[#00c853]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-bold text-[#00e676] hover:text-[#00c853]">
                Privacy Policy
              </Link>
            </span>
          </div>
        </div>
        <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00e676] text-black font-extrabold hover:bg-[#00c853] hover:shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:-translate-y-0.5 transition-all duration-300 mt-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-black/60" /> Creating account...
            </>
          ) : (
            <>
              Create Account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="pt-6 text-center text-sm font-medium text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#00e676] hover:text-[#00c853] transition-colors hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
