import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                farms: {
                    take: 1 // Assuming single farm for main display
                }
            }
        }) as any;

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Determine Role Display
        // If user has market access active, we can show "Premium Farmer" or similar
        let displayRole = user.role || "Farmer";
        const isPremium = user.marketAccessExpiry && new Date(user.marketAccessExpiry) > new Date();

        if (isPremium) {
            displayRole = "Premium Farmer";
        }

        // Location: Could be stored in User or Farm. Checking Farm first.
        const location = user.farms[0]?.location || "Kenya";

        return NextResponse.json({
            name: user.name,
            email: user.email,
            role: displayRole,
            location: location,
            isPremium: !!isPremium,
            marketExpiry: user.marketAccessExpiry,
            notificationsEnabled: user.notificationsEnabled ?? true
        });

    } catch (error) {
        console.error("Profile API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        
        // Build data object dynamically to allow partial updates
        const dataToUpdate: any = {};
        if (body.name !== undefined) dataToUpdate.name = body.name;
        if (body.notificationsEnabled !== undefined) dataToUpdate.notificationsEnabled = body.notificationsEnabled;

        // Update User
        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: dataToUpdate
        });

        // Update Farm Location (if location provided)
        if (body.location !== undefined) {
            const farm = await db.farm.findFirst({ where: { userId: session.user.id } });
            if (farm) {
                await db.farm.update({
                    where: { id: farm.id },
                    data: { location: body.location }
                });
            }
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
