"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, ContactShadows } from "@react-three/drei";
import { Maximize2, Minimize2 } from "lucide-react";
import FarmBlock3D from "./farm-block-3d";

type FarmBlock = {
    id: number | string;
    cropName: string;
    blockName: string;
    color: string;
    progress: number;
    gridPosition: {
        row: number;
        col: number;
        rowSpan: number;
        colSpan: number;
    };
    structure: 'field' | 'barn' | 'house' | 'greenhouse' | 'irrigation' | 'storage';
    description?: string;
    // ... other props
};

type Farm3DViewProps = {
    blocks: FarmBlock[];
    onBlockClick: (block: FarmBlock) => void;
};

const Farm3DView = ({ blocks, onBlockClick }: Farm3DViewProps) => {
    // Grid settings
    const gridSize = 4; // Assuming a 4x4 or 5x5 grid
    const spacing = 2.5; // Space between blocks
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div ref={containerRef} className="w-full h-[600px] rounded-3xl overflow-hidden border border-[#1e293b] shadow-2xl relative bg-[#0f172a]">
            <Canvas shadows camera={{ position: [12, 12, 12], fov: 45 }}>
                {/* Dark Background */}
                <color attach="background" args={['#0f172a']} />

                {/* Fog for depth */}
                <fog attach="fog" args={['#0f172a', 10, 40]} />

                <Suspense fallback={null}>
                    {/* Lighting: Studio-like setup for tech look */}
                    <ambientLight intensity={0.4} color="#ffffff" />
                    <directionalLight
                        position={[10, 20, 10]}
                        intensity={1.2}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                    />
                    <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" /> {/* Cool backfill */}

                    {/* Floor Grid */}
                    <Grid
                        position={[0, -0.01, 0]}
                        args={[40, 40]}
                        cellSize={1}
                        cellThickness={0.5}
                        cellColor="#334155"
                        sectionSize={5}
                        sectionThickness={1}
                        sectionColor="#475569"
                        fadeDistance={25}
                        fadeStrength={1}
                        infiniteGrid
                    />

                    <group position={[-gridSize, 0, -gridSize]}>
                        {blocks.map((block) => {
                            const x = (block.gridPosition.col - 1) * spacing;
                            const z = (block.gridPosition.row - 1) * spacing;

                            const width = block.gridPosition.colSpan * spacing;
                            const depth = block.gridPosition.rowSpan * spacing;

                            // Center the block
                            const xCenter = x + (width - spacing) / 2;
                            const zCenter = z + (depth - spacing) / 2;

                            return (
                                <FarmBlock3D
                                    key={block.id}
                                    position={[xCenter, 0, zCenter]}
                                    size={[width * 0.9, 0.2, depth * 0.9]} // Base is flat platform
                                    color={block.color}
                                    type={block.structure}
                                    label={block.blockName}
                                    subLabel={block.cropName !== "Unknown" ? block.cropName : ""}
                                    progress={block.progress || Math.floor(Math.random() * 100)} // Mock progress if missing
                                    onClick={() => onBlockClick(block)}
                                />
                            );
                        })}
                    </group>

                    <OrbitControls
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2.1}
                        enableDamping
                        dampingFactor={0.05}
                    />
                </Suspense>
            </Canvas>

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur border border-white/10 px-4 py-2 rounded-xl text-xs font-medium text-white pointer-events-none">
                <span className="text-[#c0ff01] font-bold">LIVE Digital Twin</span> • System Online
            </div>
            
            <button 
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 bg-black/50 hover:bg-[#22c55e]/80 backdrop-blur border border-white/20 p-2.5 rounded-xl text-white transition-all z-50 pointer-events-auto shadow-lg"
                title="Toggle Fullscreen"
            >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 font-mono pointer-events-none">
                lat: -1.286 • lon: 36.817
            </div>
        </div>
    );
};

export default Farm3DView;
