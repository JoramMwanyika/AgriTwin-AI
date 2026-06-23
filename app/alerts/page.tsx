"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { AppPageHeader } from "@/components/app-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Droplets, ThermometerSun, Bug, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: "critical" },
    { id: 2, type: "warning" },
    { id: 3, type: "info" },
  ])

  const dismissAlert = (id: number) => {
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <AppPageHeader subtitle="Alerts & warnings" />
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-800">Active Alerts ({alerts.length})</h2>
          <span className="text-xs text-muted-foreground">Updated 10m ago</span>
        </div>

        {alerts.find((a) => a.type === "critical") && (
          <Card className="border-l-4 border-l-[#C94A4A] shadow-md relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => dismissAlert(1)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-[#FFE5E5] flex items-center justify-center text-[#C94A4A] shrink-0">
                  <Bug className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[#C94A4A]">Fall Armyworm Detected</h3>
                    <span className="text-[10px] bg-[#FFE5E5] text-[#C94A4A] px-2 py-0.5 rounded-full font-medium">
                      Critical
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    High risk of infestation in neighboring farms. Inspect maize funnel for larvae immediately.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Recommended: Apply Neem-based pesticide.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {alerts.find((a) => a.type === "warning") && (
          <Card className="border-l-4 border-l-[#E5B045] shadow-sm relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => dismissAlert(2)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#E5B045] shrink-0">
                  <ThermometerSun className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[#B3831F]">Heat Stress Risk</h3>
                    <span className="text-[10px] bg-[#FFF4E5] text-[#B3831F] px-2 py-0.5 rounded-full font-medium">
                      Warning
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    Temperatures expected to reach 32°C tomorrow. Ensure crops are well-mulched to retain moisture.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {alerts.find((a) => a.type === "info") && (
          <Card className="border-l-4 border-l-primary shadow-sm relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => dismissAlert(3)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-primary shrink-0">
                  <Droplets className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-primary">Irrigation Reminder</h3>
                    <span className="text-[10px] bg-[#E8F5E9] text-primary px-2 py-0.5 rounded-full font-medium">
                      Info
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    Scheduled irrigation for Block A is due at 6:00 PM today.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
