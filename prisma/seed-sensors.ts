
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding sensor data...")

    // 1. Get all blocks
    const blocks = await prisma.block.findMany()

    if (blocks.length === 0) {
        console.log("No blocks found. Create some blocks first!")
        return
    }

    console.log(`Found ${blocks.length} blocks. Adding sensors and readings...`)

    for (const block of blocks) {
        // 2. Create Sensors (if not exist)
        // Soil Moisture
        const moistureSensor = await prisma.sensor.upsert({
            where: { id: `sensor-${block.id}-moisture` }, // Predictable ID for demo
            update: {},
            create: {
                id: `sensor-${block.id}-moisture`,
                name: `Soil Moisture - ${block.name}`,
                type: 'moisture',
                blockId: block.id,
                status: 'active'
            }
        })

        // Concatenated ID for temperature sensor to avoid changing schema constraint if unique name enforced (it's not, but good practice)
        // Using upsert to avoid duplicates
        const tempSensor = await prisma.sensor.upsert({
            where: { id: `sensor-${block.id}-temp` },
            update: {},
            create: {
                id: `sensor-${block.id}-temp`,
                name: `Temperature - ${block.name}`,
                type: 'temperature',
                blockId: block.id,
                status: 'active'
            }
        })

        // 3. Add Readings
        // Simulate slightly different values per crop type
        let baseMoisture = 60;
        let baseTemp = 24;

        if (block.cropType?.toLowerCase().includes('maize')) { baseMoisture = 55; }
        if (block.cropType?.toLowerCase().includes('rice')) { baseMoisture = 80; }
        if (block.cropType?.toLowerCase().includes('beans')) { baseMoisture = 45; }

        const readingsToCreate = [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Generate 48 readings for today (every 30 mins)
        for (let i = 0; i < 48; i++) {
            const time = new Date(startOfDay.getTime() + i * 30 * 60 * 1000);
            
            // Add some random variance that gently flows
            const variance = Math.sin(i / 4) * 5; 
            const moisture = baseMoisture + variance + (Math.random() * 4 - 2);
            const temp = baseTemp + (variance * 0.5) + (Math.random() * 2 - 1);

            readingsToCreate.push({
                sensorId: moistureSensor.id,
                blockId: block.id,
                moisture: parseFloat(moisture.toFixed(1)),
                temp: parseFloat(temp.toFixed(1)),
                timestamp: time
            });
        }

        await prisma.sensorReading.createMany({
            data: readingsToCreate
        });
    }

    console.log("✅ Sensor data seeded successfully!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
