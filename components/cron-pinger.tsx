"use client";

import { useEffect } from "react";

export function CronPinger() {
    useEffect(() => {
        // Ping the reminders cron endpoint every 60 seconds
        const reminderInterval = setInterval(() => {
            fetch("/api/cron/reminders")
                .then(res => res.json())
                .then(data => {
                    if (data.emailsSent > 0) {
                        console.log(`[Cron] Sent ${data.emailsSent} reminder emails.`);
                    }
                })
                .catch(err => console.error("[Cron] Failed to execute reminder check", err));
        }, 60000); // 60 seconds

        // Ping the daily AI generation endpoint every 5 minutes (300000 ms)
        const aiInterval = setInterval(() => {
            fetch("/api/cron/daily-ai")
                .then(res => res.json())
                .then(data => {
                    if (data.generated > 0) {
                        console.log(`[Cron] Generated ${data.generated} AI daily recommendations.`);
                    }
                })
                .catch(err => console.error("[Cron] Failed to execute AI daily check", err));
        }, 300000); // 5 minutes

        // Also do an initial ping 5 seconds after mount
        const timeout = setTimeout(() => {
            fetch("/api/cron/reminders").catch(() => {});
            fetch("/api/cron/daily-ai").catch(() => {});
        }, 5000);

        return () => {
            clearInterval(reminderInterval);
            clearInterval(aiInterval);
            clearTimeout(timeout);
        };
    }, []);

    return null; // This component renders nothing, it just runs in the background
}
