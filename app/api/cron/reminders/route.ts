import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "No Brevo API key found" }, { status: 500 });
        }

        const now = new Date();
        const pendingTasks = await db.task.findMany({
            where: {
                status: "PENDING",
                dueDate: { not: null }
            },
            include: {
                assignee: true,
                farm: { include: { user: true } }
            }
        });

        let sentCount = 0;

        for (const task of pendingTasks) {
            if (!task.dueDate) continue;

            const timeDiffMs = task.dueDate.getTime() - now.getTime();
            const minutesUntilDue = Math.floor(timeDiffMs / (1000 * 60));

            // 1. Overdue Notice to Farmer (if < 0 mins)
            if (minutesUntilDue < 0 && !task.overdueNoticeSent) {
                const farmerEmail = task.farm?.user?.email || "farmer@example.com";
                await sendBrevoEmail(
                    apiKey,
                    farmerEmail, // SENDER
                    "AgriTwin Alerts", // SENDER NAME
                    farmerEmail, // TO
                    task.farm?.user?.name || "Farmer", // TO NAME
                    `[OVERDUE] Task: ${task.title}`,
                    `
                        <div style="font-family: sans-serif; padding: 20px; background-color: #fef2f2; border-radius: 10px;">
                            <h2 style="color: #b91c1c;">Task Overdue 🚨</h2>
                            <p><strong>Task:</strong> ${task.title}</p>
                            <p><strong>Assigned To:</strong> ${task.assignee?.name || "Unassigned"}</p>
                            <p><strong>Was Due:</strong> ${task.dueDate.toLocaleString()}</p>
                            <p>This task is past its deadline and has not been marked as completed.</p>
                        </div>
                    `
                );
                await db.task.update({ where: { id: task.id }, data: { overdueNoticeSent: true } });
                sentCount++;
            }
            
            // 2. 10 Minute Warning to Employee (if 0 to 10 mins)
            else if (minutesUntilDue >= 0 && minutesUntilDue <= 10 && !task.reminder10mSent && task.assignee?.email) {
                const farmerEmail = task.farm?.user?.email || "farmer@example.com";
                await sendBrevoEmail(
                    apiKey,
                    farmerEmail, // SENDER
                    "AgriTwin Reminders", // SENDER NAME
                    task.assignee.email, // TO
                    task.assignee.name, // TO NAME
                    `[URGENT] 10 Minutes Left: ${task.title}`,
                    `
                        <div style="font-family: sans-serif; padding: 20px; background-color: #fffbeb; border-radius: 10px;">
                            <h2 style="color: #b45309;">10 Minute Warning ⏰</h2>
                            <p>Hello ${task.assignee.name},</p>
                            <p>Your task <strong>${task.title}</strong> is due very soon!</p>
                            <p><strong>Due At:</strong> ${task.dueDate.toLocaleString()}</p>
                            <p>Please complete it and mark it done on the AgriTwin dashboard.</p>
                        </div>
                    `
                );
                await db.task.update({ where: { id: task.id }, data: { reminder10mSent: true } });
                sentCount++;
            }

            // 3. 1 Hour Warning to Employee (if 11 to 60 mins)
            else if (minutesUntilDue > 10 && minutesUntilDue <= 60 && !task.reminder1hSent && task.assignee?.email) {
                const farmerEmail = task.farm?.user?.email || "farmer@example.com";
                await sendBrevoEmail(
                    apiKey,
                    farmerEmail, // SENDER
                    "AgriTwin Reminders", // SENDER NAME
                    task.assignee.email, // TO
                    task.assignee.name, // TO NAME
                    `[REMINDER] 1 Hour Left: ${task.title}`,
                    `
                        <div style="font-family: sans-serif; padding: 20px; background-color: #f0fdf4; border-radius: 10px;">
                            <h2 style="color: #047857;">1 Hour Reminder ⏱️</h2>
                            <p>Hello ${task.assignee.name},</p>
                            <p>This is a reminder that your task <strong>${task.title}</strong> is due in less than an hour.</p>
                            <p><strong>Due At:</strong> ${task.dueDate.toLocaleString()}</p>
                        </div>
                    `
                );
                await db.task.update({ where: { id: task.id }, data: { reminder1hSent: true } });
                sentCount++;
            }
        }

        return NextResponse.json({ message: "Cron executed successfully", emailsSent: sentCount });
    } catch (error) {
        console.error("Cron Execution Error:", error);
        return NextResponse.json({ error: "Failed to execute cron" }, { status: 500 });
    }
}

async function sendBrevoEmail(apiKey: string, senderEmail: string, senderName: string, toEmail: string, toName: string, subject: string, htmlContent: string) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": apiKey
        },
        body: JSON.stringify({
            sender: { name: senderName, email: senderEmail }, 
            to: [{ email: toEmail, name: toName }],
            subject,
            htmlContent
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Brevo sending failed:", err);
    }
}
