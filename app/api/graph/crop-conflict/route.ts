import { NextRequest, NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

type BlockPosition = {
  id: string | number;
  cropName: string;
  gridPosition: { row: number; col: number; rowSpan: number; colSpan: number };
};

function areAdjacent(a: BlockPosition, b: BlockPosition): boolean {
  const aRowEnd = a.gridPosition.row + a.gridPosition.rowSpan - 1;
  const aColEnd = a.gridPosition.col + a.gridPosition.colSpan - 1;
  const bRowEnd = b.gridPosition.row + b.gridPosition.rowSpan - 1;
  const bColEnd = b.gridPosition.col + b.gridPosition.colSpan - 1;

  const horizontallyAdjacent =
    (aColEnd + 1 === b.gridPosition.col || bColEnd + 1 === a.gridPosition.col) &&
    !(a.gridPosition.row > bRowEnd + 1 || b.gridPosition.row > aRowEnd + 1);

  const verticallyAdjacent =
    (aRowEnd + 1 === b.gridPosition.row || bRowEnd + 1 === a.gridPosition.row) &&
    !(a.gridPosition.col > bColEnd + 1 || b.gridPosition.col > aColEnd + 1);

  return horizontallyAdjacent || verticallyAdjacent;
}

export async function POST(req: NextRequest) {
  let session;
  try {
    const body = await req.json();
    const blocks: BlockPosition[] = body.blocks ?? [];

    if (blocks.length < 2) {
      return NextResponse.json({ conflicts: [], conflictingBlockIds: [] });
    }

    const adjacentPairs: { blockId1: string | number; blockId2: string | number; crop1: string; crop2: string }[] = [];
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (areAdjacent(blocks[i], blocks[j])) {
          adjacentPairs.push({
            blockId1: blocks[i].id,
            blockId2: blocks[j].id,
            crop1: blocks[i].cropName,
            crop2: blocks[j].cropName,
          });
        }
      }
    }

    if (adjacentPairs.length === 0) {
      return NextResponse.json({ conflicts: [], conflictingBlockIds: [] });
    }

    const driver = getNeo4jDriver();
    session = driver.session();

    const allAdjacentCropNames = Array.from(
      new Set(adjacentPairs.flatMap((p) => [p.crop1.trim(), p.crop2.trim()]))
    );

    const result = await session.run(
      `MATCH (a:Crop)-[:ANTAGONIST_TO]->(b:Crop)
       WHERE toLower(a.name) IN $cropNames AND toLower(b.name) IN $cropNames
       RETURN a.name AS crop1, b.name AS crop2`,
      { cropNames: allAdjacentCropNames.map((n) => n.toLowerCase()) }
    );

    const antagonistPairs = new Set<string>();
    result.records.forEach((record) => {
      const c1 = record.get("crop1").toLowerCase();
      const c2 = record.get("crop2").toLowerCase();
      antagonistPairs.add(`${c1}|${c2}`);
      antagonistPairs.add(`${c2}|${c1}`);
    });

    const conflictingBlockIds = new Set<string | number>();
    const conflictDetails: { blockId1: string | number; blockId2: string | number; crop1: string; crop2: string; reason: string }[] = [];

    adjacentPairs.forEach((pair) => {
      const key = `${pair.crop1.toLowerCase()}|${pair.crop2.toLowerCase()}`;
      if (antagonistPairs.has(key)) {
        conflictingBlockIds.add(pair.blockId1);
        conflictingBlockIds.add(pair.blockId2);
        conflictDetails.push({
          ...pair,
          reason: `${pair.crop1} and ${pair.crop2} are incompatible companions — they inhibit each other when planted adjacently.`,
        });
      }
    });

    return NextResponse.json({
      conflicts: conflictDetails,
      conflictingBlockIds: Array.from(conflictingBlockIds),
    });
  } catch (error: any) {
    console.error("[crop-conflict] Error:", error);
    return NextResponse.json({ conflicts: [], conflictingBlockIds: [], error: error.message }, { status: 500 });
  } finally {
    if (session) await session.close();
  }
}
