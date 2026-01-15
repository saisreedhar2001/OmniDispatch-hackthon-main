'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, RoundedBox, Edges } from '@react-three/drei'
import * as THREE from 'three'

interface FloorData {
  floor: number
  rooms: { id: string; name: string; type: string; capacity?: number }[]
  exits: { id: string; name: string; location: string; type?: string }[]
  fire_equipment: { type: string; location: string }[]
}

interface Building3DViewerProps {
  buildingName: string
  floors: number
  buildingType: string
  selectedFloor: number
  onFloorSelect: (floor: number) => void
  floorPlans?: FloorData[]
  escapeRoutes?: { waypoints: string[] }[]
}

// Room type colors - professional palette
const roomColors: Record<string, string> = {
  office: '#3b82f6',
  conference: '#8b5cf6',
  lobby: '#06b6d4',
  restroom: '#64748b',
  storage: '#78716c',
  emergency: '#ef4444',
  elevator: '#f59e0b',
  stairwell: '#22c55e',
  cafeteria: '#ec4899',
  server: '#6366f1',
  reception: '#14b8a6',
  default: '#475569'
}

// Animated Emergency Exit Sign with 3D Arrow
function EmergencyExit({ position, name }: { position: [number, number, number]; name: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.03
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15
      glowRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Outer glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.18, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Exit sign box */}
      <mesh 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.25, 0.12, 0.04]} />
        <meshStandardMaterial 
          color={hovered ? "#4ade80" : "#22c55e"} 
          emissive="#22c55e"
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Arrow pointing to exit direction */}
      <mesh position={[0, 0, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.08, 3]} />
        <meshStandardMaterial color="#ffffff" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>

      {/* Pole */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>

      {hovered && (
        <Html position={[0, 0.25, 0]} center>
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl border border-green-400">
            🚪 {name}
          </div>
        </Html>
      )}
    </group>
  )
}

// Fire Equipment with realistic design
function FireEquipment({ position, type }: { position: [number, number, number]; type: string }) {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2
    }
  })

  const isExtinguisher = type.toLowerCase().includes('extinguisher')
  const isAlarm = type.toLowerCase().includes('alarm')

  return (
    <group ref={meshRef} position={position}>
      {isExtinguisher ? (
        // Fire Extinguisher - Cylinder with handle
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.18, 12]} />
            <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.04, 8]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ) : isAlarm ? (
        // Fire Alarm - Box with blinking effect
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[0.1, 0.1, 0.03]} />
          <meshStandardMaterial 
            color="#dc2626" 
            emissive="#dc2626" 
            emissiveIntensity={0.6}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      ) : (
        // Generic safety equipment
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <octahedronGeometry args={[0.06]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.4} />
        </mesh>
      )}

      {hovered && (
        <Html position={[0, 0.35, 0]} center>
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl border border-red-400">
            🔥 {type}
          </div>
        </Html>
      )}
    </group>
  )
}

// Individual 3D Room with realistic design
function Room({ 
  position, 
  size, 
  type, 
  name 
}: { 
  position: [number, number, number]
  size: [number, number, number]
  type: string
  name: string
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  const color = roomColors[type.toLowerCase()] || roomColors.default

  useFrame(() => {
    if (meshRef.current) {
      const targetY = hovered ? position[1] + 0.02 : position[1]
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1)
    }
  })

  return (
    <group>
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.015}
        smoothness={4}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.95 : 0.8}
          metalness={0.1}
          roughness={0.6}
        />
        <Edges color={hovered ? "#ffffff" : "#1e293b"} threshold={15} />
      </RoundedBox>

      {/* Room label on top */}
      {hovered && (
        <Html position={[position[0], position[1] + size[1] / 2 + 0.15, position[2]]} center>
          <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl text-xs shadow-2xl border border-slate-600 backdrop-blur-sm">
            <div className="font-bold text-sm">{name}</div>
            <div className="text-slate-400 capitalize">{type}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Professional Floor Plate
function FloorPlate({ 
  floorNumber, 
  yPosition, 
  isSelected, 
  floorData,
  onClick,
  totalFloors
}: { 
  floorNumber: number
  yPosition: number
  isSelected: boolean
  floorData?: FloorData
  onClick: () => void
  totalFloors: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  // Room layout generation
  const roomLayout = useMemo(() => {
    if (!floorData?.rooms) return []
    const rooms = floorData.rooms.slice(0, 12)
    const positions: Array<{ room: typeof rooms[0]; position: [number, number, number]; size: [number, number, number] }> = []
    
    const gridCols = 4
    const gridRows = 3
    const cellWidth = 0.55
    const cellDepth = 0.45
    const startX = -((gridCols - 1) * cellWidth) / 2
    const startZ = -((gridRows - 1) * cellDepth) / 2

    rooms.forEach((room, i) => {
      const row = Math.floor(i / gridCols)
      const col = i % gridCols
      positions.push({
        room,
        position: [
          startX + col * cellWidth,
          0.12,
          startZ + row * cellDepth
        ],
        size: [0.45, 0.18, 0.35]
      })
    })

    return positions
  }, [floorData])

  // Exit positions - corners of the floor
  const exitPositions = useMemo(() => {
    if (!floorData?.exits) return []
    const corners = [
      [-1.4, 0.2, -0.9],
      [1.4, 0.2, -0.9],
      [-1.4, 0.2, 0.9],
      [1.4, 0.2, 0.9]
    ] as [number, number, number][]
    
    return floorData.exits.slice(0, 4).map((exit, i) => ({
      ...exit,
      position: corners[i % corners.length]
    }))
  }, [floorData])

  // Fire equipment positions - along walls
  const equipmentPositions = useMemo(() => {
    if (!floorData?.fire_equipment) return []
    const wallPositions = [
      [0, 0.15, -1.1],
      [0, 0.15, 1.1],
      [-1.6, 0.15, 0],
      [1.6, 0.15, 0]
    ] as [number, number, number][]
    
    return floorData.fire_equipment.slice(0, 4).map((eq, i) => ({
      ...eq,
      position: wallPositions[i % wallPositions.length]
    }))
  }, [floorData])

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isSelected ? yPosition + 0.15 : yPosition
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08)
    }
  })

  // Floor gradient color based on position
  const getFloorColor = () => {
    if (isSelected) return "#1e40af"
    if (hovered) return "#334155"
    const ratio = floorNumber / totalFloors
    const r = Math.round(30 + ratio * 20)
    const g = Math.round(41 + ratio * 30)
    const b = Math.round(59 + ratio * 40)
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <group ref={groupRef} position={[0, yPosition, 0]}>
      {/* Main floor plate - rectangular building shape */}
      <mesh
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[3.5, 0.06, 2.5]} />
        <meshStandardMaterial 
          color={getFloorColor()}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* Floor edges highlight */}
      <lineSegments position={[0, 0, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(3.5, 0.06, 2.5)]} />
        <lineBasicMaterial color={isSelected ? "#60a5fa" : "#475569"} />
      </lineSegments>

      {/* Wall outlines */}
      {isSelected && (
        <group position={[0, 0.15, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(3.4, 0.25, 2.4)]} />
            <lineBasicMaterial color="#64748b" transparent opacity={0.5} />
          </lineSegments>
        </group>
      )}

      {/* Floor label on side */}
      <Html position={[-2, 0.05, 0]} center>
        <div 
          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110' 
              : hovered
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800/80 text-slate-400'
          }`}
          onClick={onClick}
        >
          F{floorNumber}
        </div>
      </Html>

      {/* Room details - only on selected floor */}
      {isSelected && roomLayout.map((item, i) => (
        <Room
          key={item.room.id || i}
          position={item.position}
          size={item.size}
          type={item.room.type}
          name={item.room.name || item.room.id}
        />
      ))}

      {/* Emergency exits */}
      {isSelected && exitPositions.map((exit, i) => (
        <EmergencyExit
          key={exit.id || i}
          position={exit.position}
          name={exit.name}
        />
      ))}

      {/* Fire equipment */}
      {isSelected && equipmentPositions.map((eq, i) => (
        <FireEquipment
          key={i}
          position={eq.position}
          type={eq.type}
        />
      ))}

      {/* Selection glow effect */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.7, 2.7]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  )
}

// Elevator shaft
function ElevatorShaft({ floors }: { floors: number }) {
  const height = floors * 0.4
  const cabinRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (cabinRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 0.5) + 1) / 2
      cabinRef.current.position.y = 0.1 + t * (height - 0.2)
    }
  })

  return (
    <group position={[1.5, height / 2 + 0.05, 0]}>
      {/* Shaft */}
      <mesh>
        <boxGeometry args={[0.25, height, 0.25]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.4} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh ref={cabinRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.18, 0.12, 0.18]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Animated escape route path
function EscapeRouteVisualization({ selectedFloor, totalFloors }: { selectedFloor: number; totalFloors: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  const [particles] = useState(() => {
    const pts: number[] = []
    for (let i = 0; i < 30; i++) {
      pts.push(0, i * 0.15, 0)
    }
    return new Float32Array(pts)
  })

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < 30; i++) {
        const t = ((state.clock.elapsedTime * 0.8 + i * 0.1) % 1)
        const y = selectedFloor * 0.4 - t * selectedFloor * 0.4
        const x = -1.4 + Math.sin(t * Math.PI * 2) * 0.1
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = -0.9
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (selectedFloor <= 1) return null

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={30}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#22c55e" size={0.05} transparent opacity={0.8} />
    </points>
  )
}

// Main Scene Component
function Scene({ 
  floors, 
  selectedFloor, 
  onFloorSelect, 
  floorPlans,
  buildingName,
  buildingType
}: { 
  floors: number
  selectedFloor: number
  onFloorSelect: (floor: number) => void
  floorPlans?: FloorData[]
  buildingName: string
  buildingType: string
}) {
  const { camera } = useThree()
  const displayFloors = Math.min(floors, 12)
  
  useEffect(() => {
    camera.position.set(5, 3, 5)
    camera.lookAt(0, displayFloors * 0.2, 0)
  }, [camera, displayFloors])

  return (
    <>
      {/* Professional lighting setup */}
      <ambientLight intensity={0.35} />
      <directionalLight 
        position={[8, 12, 8]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#60a5fa" />
      <pointLight position={[0, displayFloors * 0.5, 0]} intensity={0.4} color="#f59e0b" distance={8} />
      <hemisphereLight args={['#0ea5e9', '#1e293b', 0.3]} />

      {/* Building title */}
      <Html position={[0, displayFloors * 0.45 + 0.6, 0]} center>
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-base shadow-2xl border border-white/20 backdrop-blur-sm">
          🏢 {buildingName}
        </div>
      </Html>

      {/* Building type badge */}
      <Html position={[0, displayFloors * 0.45 + 0.25, 0]} center>
        <div className="bg-slate-800/90 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium">
          {buildingType} • {floors} Floors
        </div>
      </Html>

      {/* Floor plates */}
      {Array.from({ length: displayFloors }, (_, i) => i + 1).map((floorNum) => (
        <FloorPlate
          key={floorNum}
          floorNumber={floorNum}
          yPosition={floorNum * 0.4}
          isSelected={selectedFloor === floorNum}
          floorData={floorPlans?.find(f => f.floor === floorNum)}
          onClick={() => onFloorSelect(floorNum)}
          totalFloors={displayFloors}
        />
      ))}

      {/* Elevator shaft */}
      <ElevatorShaft floors={displayFloors} />

      {/* Escape route visualization */}
      <EscapeRouteVisualization selectedFloor={selectedFloor} totalFloors={displayFloors} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Ground grid */}
      <gridHelper args={[12, 24, '#1e3a5f', '#1e3a5f']} position={[0, 0.01, 0]} />

      {/* Camera controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={18}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, displayFloors * 0.2, 0]}
      />
    </>
  )
}

// Main Export Component
export default function Building3DViewer({
  buildingName,
  floors,
  buildingType,
  selectedFloor,
  onFloorSelect,
  floorPlans,
  escapeRoutes
}: Building3DViewerProps) {
  return (
    <div className="w-full h-[550px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden relative border border-slate-700/50 shadow-2xl">
      {/* Top info bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Type</div>
            <div className="text-xs font-semibold text-white capitalize">{buildingType}</div>
          </div>
          <div className="bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Floors</div>
            <div className="text-xs font-semibold text-white">{floors}</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-blue-400/50 shadow-lg shadow-blue-500/20">
          <div className="text-[10px] text-blue-200 uppercase tracking-wide">Viewing</div>
          <div className="text-sm font-bold text-white">Floor {selectedFloor}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-16 right-3 z-10 bg-slate-900/90 backdrop-blur-sm p-2.5 rounded-xl border border-slate-700/50 text-[10px] space-y-1.5">
        <div className="font-semibold text-white text-xs mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500 shadow-sm shadow-green-500/50"></div>
          <span className="text-slate-400">Emergency Exit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm shadow-red-500/50"></div>
          <span className="text-slate-400">Fire Equipment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm shadow-blue-500/50"></div>
          <span className="text-slate-400">Room/Office</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500 shadow-sm shadow-yellow-500/50"></div>
          <span className="text-slate-400">Elevator</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-16 left-3 z-10 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] text-slate-400">
        🖱️ Drag to rotate • 🔍 Scroll to zoom • 👆 Click floor to select
      </div>

      {/* Floor quick selector */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-center gap-1.5 flex-wrap">
        {Array.from({ length: Math.min(floors, 10) }, (_, i) => i + 1).map((f) => (
          <button
            key={f}
            onClick={() => onFloorSelect(f)}
            className={`w-9 h-9 rounded-lg font-bold text-xs transition-all duration-200 ${
              selectedFloor === f
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105 ring-2 ring-blue-400/50'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
            }`}
          >
            F{f}
          </button>
        ))}
        {floors > 10 && (
          <div className="text-slate-500 text-xs self-center ml-1">+{floors - 10}</div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Scene
          floors={floors}
          selectedFloor={selectedFloor}
          onFloorSelect={onFloorSelect}
          floorPlans={floorPlans}
          buildingName={buildingName}
          buildingType={buildingType}
        />
      </Canvas>
    </div>
  )
}
