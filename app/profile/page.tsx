"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { AppPageHeader } from "@/components/app-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { User, Globe, ChevronRight, LogOut, Settings, Bell, PenLine, Shield, HelpCircle } from "lucide-react"
import { handleSignOut } from "@/app/actions"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { normalizeLanguageCode } from "@/lib/languages"

const CHAT_LANGUAGE_STORAGE_KEY = "agritwin_chat_language"

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
]

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [language, setLanguage] = useState("en")
  const [profile, setProfile] = useState({
    name: "",
    location: "Loading...",
    role: "Farmer",
    email: "",
    notificationsEnabled: true
  })
  const [tempProfile, setTempProfile] = useState(profile)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile();
    const saved = localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY)
    if (saved) setLanguage(normalizeLanguageCode(saved))
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setTempProfile(data);
        setNotifications(data.notificationsEnabled ?? true);
      }
    } catch (e) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempProfile)
      });

      if (res.ok) {
        setProfile(tempProfile)
        setIsEditOpen(false)
        toast.success("Profile updated successfully")
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      toast.error("Failed to update profile");
    }
  }

  const handleLanguageChange = (code: string) => {
    const normalized = normalizeLanguageCode(code)
    setLanguage(normalized)
    localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, normalized)
    const lang = LANGUAGES.find((l) => l.code === code || l.code === normalized)
    setIsLanguageOpen(false)
    toast.success(`Language changed to ${lang?.name}`)
  }

  const handleNotificationToggle = async (checked: boolean) => {
    setNotifications(checked)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationsEnabled: checked })
      });
      if (res.ok) {
        toast.success(checked ? "Notifications enabled" : "Notifications disabled")
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      setNotifications(!checked) // Revert on failure
      toast.error("Failed to update notification settings");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <AppPageHeader subtitle="Settings & account" />
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1f16] to-[#14532d] shadow-xl p-6 text-white"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0ff01]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4ade80]/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

          <div className="relative z-10 flex gap-5 items-start">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#c0ff01] to-[#4ade80] p-[2px] shadow-lg shadow-black/20">
              <div className="w-full h-full rounded-[14px] bg-[#0a1f16] flex items-center justify-center overflow-hidden">
                <User className="h-10 w-10 text-[#c0ff01]" />
              </div>
            </div>

            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-white tracking-wide">{profile.name}</h2>
                  <p className="text-[#c0ff01] font-medium text-sm mb-1">{profile.role}</p>
                </div>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                      onClick={() => setTempProfile(profile)}
                    >
                      <PenLine className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-2xl">Edit Profile</DialogTitle>
                      <DialogDescription>Update your personal information visible on AgriTwin.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={tempProfile.name}
                          onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                          className="focus-visible:ring-[#14532d]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={tempProfile.location}
                          onChange={(e) => setTempProfile({ ...tempProfile, location: e.target.value })}
                          className="focus-visible:ring-[#14532d]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveProfile} className="bg-[#14532d] text-white hover:bg-[#0a1f16]">Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium backdrop-blur-sm flex items-center gap-1.5">
                  📍 {profile.location}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium backdrop-blur-sm flex items-center gap-1.5">
                  📧 {profile.email}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Groups */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-2">Preferences</h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0 divide-y divide-gray-100">
                <Dialog open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#e6f4ea] flex items-center justify-center group-hover:bg-[#dcefe3] transition-colors">
                          <Globe className="h-5 w-5 text-[#14532d]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Language</p>
                          <p className="text-xs text-gray-500">
                            Current: <span className="font-medium text-gray-800">{currentLang.flag} {currentLang.name}</span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Select Language</DialogTitle>
                      <DialogDescription>Choose your preferred language for the interface and AI assistant.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                      {LANGUAGES.map((lang) => (
                        <Button
                          key={lang.code}
                          variant={language === lang.code ? "default" : "outline"}
                          className={`justify-start gap-4 h-14 ${language === lang.code
                            ? 'bg-[#14532d] hover:bg-[#0a1f16] text-white border-transparent'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          onClick={() => handleLanguageChange(lang.code)}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="text-base font-medium">{lang.name}</span>
                          {language === lang.code && <div className="ml-auto w-2 h-2 rounded-full bg-[#c0ff01]" />}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center justify-between p-4 group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#e6f4ea] flex items-center justify-center group-hover:bg-[#dcefe3] transition-colors">
                      <Bell className="h-5 w-5 text-[#14532d]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Notifications</p>
                      <p className="text-xs text-gray-500">Weather alerts & task reminders</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={handleNotificationToggle}
                    className="data-[state=checked]:bg-[#14532d]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-2 mt-6">Support & Security</h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0 divide-y divide-gray-100">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                  onClick={() => toast.info("Privacy settings coming soon")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Privacy & Security</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                  onClick={() => toast.info("Help center coming soon")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <HelpCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Help & Support</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                  onClick={() => toast.info("App settings coming soon")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Settings className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">App Settings</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4"
        >
          <Button
            variant="outline"
            className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-red-200 shadow-sm h-12 text-base font-medium rounded-xl"
            onClick={() => handleSignOut()}
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </Button>

          <div className="text-center mt-6 text-xs text-gray-400">
            <p>AgriTwin v0.1.0 (Beta)</p>
          </div>
        </motion.div>

      </div>
    </AppShell>
  )
}
