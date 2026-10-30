import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EnvironmentState, VfsNode, SentimentType } from '../types';
import { audioVoiceService } from '../services/audioVoiceService';
import { vfs } from '../services/vfsService';
import { navigatorService } from '../services/navigatorService';
import { geoNexusService, GeoTelemetry } from '../services/geoNexusService';
import { EarthNasaOverlay } from './EarthNasaOverlay';
import { computeRgbLedState } from '../services/colorProfileService';
import { causalCore } from '../services/causalCore.mjs';
import { fragmentShader, vertexShader, librationMarkers, shaderPulseFromMetrics } from '../services/nexusCauldronscope.mjs';
import { pllmSensorAgent } from '../services/pllmSensorAgent.mjs';
import { axsResourceGovernor, octaveTrace } from '../services/axsResourceGovernor.mjs';
import { advancedMathEngine } from '../services/advancedMathEngine';
import { alphaFoldService, ProteinModel } from '../services/alphaFoldService';

export interface SentimentPaletteConfig {
  primary: THREE.Color;
  secondary: THREE.Color;
  ambient: THREE.Color;
  fog: THREE.Color;
  particleSpeedMod: number;
  topologyScaleMod: number;
  jitterFrequency: number;
  rotationSpeedMod: number;
  label: string;
  harmonicBand: string;
}

export const SENTIMENT_PALETTES: Record<SentimentType, SentimentPaletteConfig> = {
  analytical: {
    primary: new THREE.Color(0x00f2ff),   // Cyber Cyan
    secondary: new THREE.Color(0x818cf8), // Indigo Precision
    ambient: new THREE.Color(0x021424),
    fog: new THREE.Color(0x020914),
    particleSpeedMod: 1.0,
    topologyScaleMod: 1.0,
    jitterFrequency: 0.1,
    rotationSpeedMod: 1.0,
    label: 'ANALYTICAL MATRIX',
    harmonicBand: '963Hz LOGIC CARRIER'
  },
  energetic: {
    primary: new THREE.Color(0xf59e0b),   // Solar Flare Gold
    secondary: new THREE.Color(0xef4444), // Crimson Burst
    ambient: new THREE.Color(0x241002),
    fog: new THREE.Color(0x180802),
    particleSpeedMod: 1.85,
    topologyScaleMod: 1.18,
    jitterFrequency: 1.5,
    rotationSpeedMod: 1.7,
    label: 'ENERGETIC SURGE',
    harmonicBand: '528Hz SOLAR TRANSDUCTION'
  },
  alarm: {
    primary: new THREE.Color(0xef4444),   // Critical Crimson
    secondary: new THREE.Color(0xf97316), // Safety Orange
    ambient: new THREE.Color(0x240206),
    fog: new THREE.Color(0x190204),
    particleSpeedMod: 2.2,
    topologyScaleMod: 1.25,
    jitterFrequency: 3.5,
    rotationSpeedMod: 2.1,
    label: 'CRITICAL VECTOR ALERT',
    harmonicBand: 'HIGH-FREQUENCY STRESS PULSE'
  },
  tranquil: {
    primary: new THREE.Color(0x10b981),   // Emerald Stasis
    secondary: new THREE.Color(0x06b6d4), // Cyan Stasis
    ambient: new THREE.Color(0x022416),
    fog: new THREE.Color(0x02140c),
    particleSpeedMod: 0.55,
    topologyScaleMod: 0.95,
    jitterFrequency: 0.05,
    rotationSpeedMod: 0.65,
    label: 'TRANQUIL HARMONIC',
    harmonicBand: '432Hz HARMONIC STASIS'
  },
  cosmic: {
    primary: new THREE.Color(0xa855f7),   // Relativistic Ultraviolet Void
    secondary: new THREE.Color(0x6366f1), // Stellar Violet
    ambient: new THREE.Color(0x160224),
    fog: new THREE.Color(0x0d0216),
    particleSpeedMod: 1.3,
    topologyScaleMod: 1.2,
    jitterFrequency: 0.35,
    rotationSpeedMod: 1.25,
    label: 'COSMIC RELATIVITY',
    harmonicBand: '1080Hz FRAME-DRAGGING'
  },
  chaos: {
    primary: new THREE.Color(0xec4899),   // Prismatic Pink
    secondary: new THREE.Color(0xeab308), // Electric Yellow
    ambient: new THREE.Color(0x240217),
    fog: new THREE.Color(0x18020e),
    particleSpeedMod: 2.5,
    topologyScaleMod: 1.35,
    jitterFrequency: 4.8,
    rotationSpeedMod: 2.4,
    label: 'PRISMATIC ENTROPY',
    harmonicBand: 'CHAOTIC ENTROPY FLUX'
  },
  creative: {
    primary: new THREE.Color(0xc084fc),   // Synaptic Violet-Magenta
    secondary: new THREE.Color(0x00f2ff), // Ethereal Cyan
    ambient: new THREE.Color(0x150826),
    fog: new THREE.Color(0x0d0517),
    particleSpeedMod: 1.15,
    topologyScaleMod: 1.08,
    jitterFrequency: 0.6,
    rotationSpeedMod: 1.1,
    label: 'CREATIVE SYNAPSE',
    harmonicBand: '528Hz NEURAL BLOSSOM'
  },
  nature: {
    primary: new THREE.Color(0x10b981),   // Emerald Biosphere
    secondary: new THREE.Color(0x84cc16), // Flora Lime
    ambient: new THREE.Color(0x042414),
    fog: new THREE.Color(0x02170d),
    particleSpeedMod: 0.75,
    topologyScaleMod: 1.05,
    jitterFrequency: 0.15,
    rotationSpeedMod: 0.7,
    label: 'BIOSPHERIC GAIA // NATURE',
    harmonicBand: '432Hz GAIA BIO-RESONANCE'
  },
  cyberpunk: {
    primary: new THREE.Color(0x00f3ff),   // Electric Neon Cyan
    secondary: new THREE.Color(0xff007f), // Cyber Hot Pink
    ambient: new THREE.Color(0x180028),
    fog: new THREE.Color(0x0a0014),
    particleSpeedMod: 1.9,
    topologyScaleMod: 1.25,
    jitterFrequency: 2.2,
    rotationSpeedMod: 1.8,
    label: 'CYBERPUNK MATRIX // SYNTH CITY',
    harmonicBand: '741Hz CYBERNETIC OVERDRIVE'
  },
  'in-session': {
    primary: new THREE.Color(0x3b82f6),
    secondary: new THREE.Color(0x1e40af),
    ambient: new THREE.Color(0x050a1a),
    fog: new THREE.Color(0x02050b),
    particleSpeedMod: 0.8,
    topologyScaleMod: 1.0,
    jitterFrequency: 0.2,
    rotationSpeedMod: 0.5,
    label: 'SESSION ACTIVE // FOCUSED',
    harmonicBand: '528Hz FOCUS RESONANCE'
  }
};

interface VisualRenderer3DProps {
  envState: EnvironmentState;
  onSceneClick?: () => void;
}

interface VfsStarNode {
  mesh: THREE.Mesh;
  label: string;
  path: string;
  type: 'file' | 'directory';
  data: any;
  velocity: THREE.Vector3;
  originalPos: THREE.Vector3;
}

export const VisualRenderer3D: React.FC<VisualRenderer3DProps> = ({ envState, onSceneClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const envRef = useRef<EnvironmentState>(envState);
  const [geoTelemetry, setGeoTelemetry] = useState<GeoTelemetry>(geoNexusService.getTelemetry());

  useEffect(() => {
    return geoNexusService.onTelemetryChange(setGeoTelemetry);
  }, []);
  const telemetryHistory = useRef<{
    packets: number[];
    throughput: number[];
    jitter: number[];
  }>({
    packets: new Array(60).fill(0),
    throughput: new Array(60).fill(0),
    jitter: new Array(60).fill(0)
  });

  // Keep envRef updated so render loop accesses the latest values without recreation
  useEffect(() => {
    envRef.current = envState;
  }, [envState]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050b, 0.0025);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
    camera.position.set(0, 0, 140);
    camera.rotation.order = 'YXZ';

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f2ff, 1.8);
    keyLight.position.set(60, 80, 70);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.4);
    rimLight.position.set(-60, -40, -50);
    scene.add(rimLight);

    // 3. Procedural Topologies Group
    const topologiesGroup = new THREE.Group();
    scene.add(topologiesGroup);

    // Topology A: Torus Knot (Neuti-ba Knot)
    const torusGeo = new THREE.TorusKnotGeometry(32, 6.8, 240, 32, 3, 5);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    topologiesGroup.add(torusMesh);

    // The Cauldronscope is a real GPU shader, not a fabricated telemetry layer.
    // Pulse can be steered by an actual local SQE phase and opt-in frame samples.
    const cauldronGeometry=new THREE.PlaneGeometry(85,85,12,12);
    const cauldronMaterial=new THREE.ShaderMaterial({
      vertexShader,fragmentShader,
      uniforms:{
        u_time:{value:0},
        u_tensorPulse:{value:0},
        u_accentColor:{value:new THREE.Color(0x00e5ff)}
      },
      transparent:true,depthWrite:false,
      blending:THREE.AdditiveBlending,
      side:THREE.DoubleSide
    });
    const cauldronPlane=new THREE.Mesh(cauldronGeometry,cauldronMaterial);
    cauldronPlane.position.z=-48;
    topologiesGroup.add(cauldronPlane);
    const markerGeometry=new THREE.SphereGeometry(1.6,12,8);
    const marker4Material=new THREE.MeshBasicMaterial({color:0xffcc00});
    const marker5Material=new THREE.MeshBasicMaterial({color:0x00e5ff});
    const marker4=new THREE.Mesh(markerGeometry,marker4Material);
    const marker5=new THREE.Mesh(markerGeometry,marker5Material);
    marker4.position.z=-37;marker5.position.z=-37;
    topologiesGroup.add(marker4,marker5);

    // Exact mathematical octave trace: decorative geometry, no generated OS/physics telemetry.
    const tracePoints = Array.from({length:257}, (_,i) => {
      const {x,y}=octaveTrace(i*Math.PI*2/256);
      return new THREE.Vector3(x*13,y*13,-46);
    });
    const octaveGeometry=new THREE.BufferGeometry().setFromPoints(tracePoints);
    const octaveMaterial=new THREE.LineBasicMaterial({color:0xffcc00,transparent:true,opacity:0.54,depthWrite:false});
    const octavePath=new THREE.Line(octaveGeometry,octaveMaterial);
    topologiesGroup.add(octavePath);

    // Real relation geometry: no links are drawn until the terminal observes events.
    // Coordinates are deterministic display positions, NOT physical-device locations.
    const graphEdgeLimit = 64;
    const relationPositions = new Float32Array(graphEdgeLimit * 4 * 3);
    const relationGeometry = new THREE.BufferGeometry();
    relationGeometry.setAttribute('position', new THREE.BufferAttribute(relationPositions, 3));
    relationGeometry.setDrawRange(0, 0);
    const relationMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.32, depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const observedRelations = new THREE.LineSegments(relationGeometry, relationMaterial);
    topologiesGroup.add(observedRelations);
    let observedSeq = -1;
    const updateObservedRelations = () => {
      if (observedSeq === causalCore.seq) return;
      observedSeq = causalCore.seq;
      const graph = causalCore.graph();
      const n = graph.vertices.length;
      const point = (index: number) => {
        const theta = n ? 2 * Math.PI * index / n : 0;
        return [48 * Math.cos(theta), 28 * Math.sin(theta), 16 * Math.sin(theta * 2)];
      };
      let offset = 0;
      for (const edge of graph.entries.slice(0, graphEdgeLimit)) {
        const pa = point(edge.a), pb = point(edge.b), pc = point(edge.c);
        for (const [from, to] of [[pa, pc], [pb, pc]]) {
          relationPositions.set(from, offset);
          relationPositions.set(to, offset + 3);
          offset += 6;
        }
      }
      relationGeometry.setDrawRange(0, offset / 3);
      relationGeometry.attributes.position.needsUpdate = true;
    };

    // Topology B: 4D Tesseract (Hypercube Wireframe)
    const tesseractGroup = new THREE.Group();
    const hypercube4D: number[][] = [];
    for (let i = 0; i < 16; i++) {
      hypercube4D.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }
    const tesseractEdges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) if (hypercube4D[i][k] !== hypercube4D[j][k]) diff++;
        if (diff === 1) tesseractEdges.push([i, j]);
      }
    }
    const tessLineGeo = new THREE.BufferGeometry();
    const tessPositions = new Float32Array(tesseractEdges.length * 6);
    tessLineGeo.setAttribute('position', new THREE.BufferAttribute(tessPositions, 3));
    const tessLineMat = new THREE.LineBasicMaterial({
      color: 0xff003c,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });
    const tesseractLines = new THREE.LineSegments(tessLineGeo, tessLineMat);
    tesseractGroup.add(tesseractLines);
    topologiesGroup.add(tesseractGroup);

    // Topology C: Singularity Core (Accretion Disc + Lensing Rings)
    const singularityGroup = new THREE.Group();
    const coreSphereGeo = new THREE.SphereGeometry(14, 32, 32);
    const coreSphereMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    singularityGroup.add(coreSphere);

    const accretionGeo = new THREE.RingGeometry(18, 48, 64);
    const accretionMat = new THREE.MeshBasicMaterial({
      color: 0xff003c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const accretionRing = new THREE.Mesh(accretionGeo, accretionMat);
    accretionRing.rotation.x = Math.PI * 0.42;
    singularityGroup.add(accretionRing);
    topologiesGroup.add(singularityGroup);

    // Topology D: Neural Synaptic Mesh
    const neuralGroup = new THREE.Group();
    const neuronCount = 42;
    const neuronPositions: THREE.Vector3[] = [];
    const neuronMat = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.8 });
    for (let i = 0; i < neuronCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      neuronPositions.push(pos);
      const nGeo = new THREE.SphereGeometry(1.8, 12, 12);
      const nMesh = new THREE.Mesh(nGeo, neuronMat);
      nMesh.position.copy(pos);
      neuralGroup.add(nMesh);
    }
    const axonGeo = new THREE.BufferGeometry();
    const axonPosList: number[] = [];
    for (let i = 0; i < neuronCount; i++) {
      for (let j = i + 1; j < neuronCount; j++) {
        if (neuronPositions[i].distanceTo(neuronPositions[j]) < 28) {
          axonPosList.push(
            neuronPositions[i].x, neuronPositions[i].y, neuronPositions[i].z,
            neuronPositions[j].x, neuronPositions[j].y, neuronPositions[j].z
          );
        }
      }
    }
    axonGeo.setAttribute('position', new THREE.Float32BufferAttribute(axonPosList, 3));
    const axonMat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending });
    const axonLines = new THREE.LineSegments(axonGeo, axonMat);
    neuralGroup.add(axonLines);
    topologiesGroup.add(neuralGroup);

    // Topology E: 7-Galaxy Relativistic Orbitals
    const galaxyGroup = new THREE.Group();
    const orbitalRings = [30, 48, 66, 84, 102, 120, 138];
    orbitalRings.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0xa855f7 : 0x00f2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const rMesh = new THREE.Mesh(ringGeo, ringMat);
      rMesh.rotation.x = Math.PI * 0.35 + idx * 0.08;
      rMesh.rotation.y = idx * 0.18;
      galaxyGroup.add(rMesh);
    });
    topologiesGroup.add(galaxyGroup);

    // Topology F: DNA Double Helix
    const dnaGroup = new THREE.Group();
    const dnaSteps = 40;
    const strandRadius = 14;
    const strandLength = 80;
    const dnaPoints: number[] = [];
    for (let i = 0; i < dnaSteps; i++) {
      const t = (i / dnaSteps) * Math.PI * 4;
      const y = (i / dnaSteps) * strandLength - strandLength / 2;
      const x1 = Math.cos(t) * strandRadius;
      const z1 = Math.sin(t) * strandRadius;
      const x2 = Math.cos(t + Math.PI) * strandRadius;
      const z2 = Math.sin(t + Math.PI) * strandRadius;
      // Base pair connector
      dnaPoints.push(x1, y, z1, x2, y, z2);
    }
    const dnaGeo = new THREE.BufferGeometry();
    dnaGeo.setAttribute('position', new THREE.Float32BufferAttribute(dnaPoints, 3));
    const dnaMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const dnaMesh = new THREE.LineSegments(dnaGeo, dnaMat);
    dnaGroup.add(dnaMesh);
    topologiesGroup.add(dnaGroup);

    // Topology G: Filesystem Galaxy (VFS)
    const galaxyVfsGroup = new THREE.Group();
    const vfsNodes: VfsStarNode[] = [];
    scene.add(galaxyVfsGroup);

    function buildFilesystemGalaxy() {
      // Clear existing
      while (galaxyVfsGroup.children.length > 0) {
        const child = galaxyVfsGroup.children[0];
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
        galaxyVfsGroup.remove(child);
      }
      vfsNodes.length = 0;

      const flatNodes: { name: string; node: VfsNode; path: string; depth: number }[] = [];
      const recurse = (curr: VfsNode, path: string, depth: number) => {
        if (!curr.children) return;
        Object.entries(curr.children).forEach(([name, child]) => {
          const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;
          flatNodes.push({ name, node: child, path: fullPath, depth });
          if (child.type === 'directory') recurse(child, fullPath, depth + 1);
        });
      };
      recurse(vfs.getNode('/', '/').node!, '/', 0);

      // Layout in a spiral galaxy formation
      flatNodes.forEach((item, idx) => {
        const phi = Math.acos(-1 + (2 * idx) / flatNodes.length);
        const theta = Math.sqrt(flatNodes.length * Math.PI) * phi;
        
        // Cluster logic: distance from center based on depth + some randomness
        const spiralFactor = idx * 0.15;
        const radius = 25 + item.depth * 50 + Math.random() * 20 + spiralFactor;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const isDir = item.node.type === 'directory';
        const geo = isDir 
          ? new THREE.IcosahedronGeometry(3, 1) 
          : new THREE.BoxGeometry(2, 2, 2);
        
        const color = isDir ? 0xa855f7 : 0x00f2ff;
        const mat = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8,
          shininess: 100,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        galaxyVfsGroup.add(mesh);

        vfsNodes.push({
          mesh,
          label: item.name,
          path: item.path,
          type: item.node.type,
          data: item.node,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1),
          originalPos: mesh.position.clone(),
        });
      });
    }

    buildFilesystemGalaxy();

    // Topology H: Robotics Lab (Laser Grid + Manipulators)
    const roboticsLabGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(200, 20, 0x00f2ff, 0x02050b);
    gridHelper.position.y = -50;
    roboticsLabGroup.add(gridHelper);
    const armGeo = new THREE.BoxGeometry(4, 30, 4);
    const armMat = new THREE.MeshPhongMaterial({ color: 0x64748b, emissive: 0x334155 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, -35, 0);
    roboticsLabGroup.add(arm);
    topologiesGroup.add(roboticsLabGroup);

    // Topology I: Protein Fold (AlphaFold Cinematic Flow Ribbon & Secondary Structures)
    const proteinFoldGroup = new THREE.Group();
    const proteinModel = alphaFoldService.getActiveModel();
    const proteinCurve = new THREE.CatmullRomCurve3(proteinModel.points, false, 'centripetal', 0.5);

    // Primary backbone ribbon tube
    const proteinGeo = new THREE.TubeGeometry(proteinCurve, 200, 1.8, 12, false);
    const proteinMat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      specular: 0x38bdf8,
      shininess: 80,
      wireframe: false,
      transparent: true,
      opacity: 0.92,
    });
    const proteinMesh = new THREE.Mesh(proteinGeo, proteinMat);
    proteinFoldGroup.add(proteinMesh);

    // Secondary holographic outer glow ribbon (flat wireframe envelope)
    const outerRibbonGeo = new THREE.TubeGeometry(proteinCurve, 200, 3.2, 6, false);
    const outerRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const outerRibbonMesh = new THREE.Mesh(outerRibbonGeo, outerRibbonMat);
    proteinFoldGroup.add(outerRibbonMesh);

    // Residue CA atom beads & secondary structure color nodes
    const residueBeadsGroup = new THREE.Group();
    const beadGeo = new THREE.SphereGeometry(1.2, 10, 10);
    const beadInstances = proteinModel.residues.filter((_, idx) => idx % 2 === 0);
    beadInstances.forEach((r) => {
      const beadMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(r.colorHex),
        emissive: new THREE.Color(r.colorHex),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
      });
      const beadMesh = new THREE.Mesh(beadGeo, beadMat);
      beadMesh.position.set(r.position[0], r.position[1], r.position[2]);
      residueBeadsGroup.add(beadMesh);
    });
    proteinFoldGroup.add(residueBeadsGroup);

    // Helical hydrogen bond rung cross struts
    const hBondGroup = new THREE.Group();
    const hBondMat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const hBondPoints: number[] = [];
    for (let i = 0; i < proteinModel.points.length - 4; i += 3) {
      const p1 = proteinModel.points[i];
      const p2 = proteinModel.points[i + 4];
      if (p1 && p2 && p1.distanceTo(p2) < 14) {
        hBondPoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    const hBondGeo = new THREE.BufferGeometry();
    hBondGeo.setAttribute('position', new THREE.Float32BufferAttribute(hBondPoints, 3));
    const hBondLines = new THREE.LineSegments(hBondGeo, hBondMat);
    hBondGroup.add(hBondLines);
    proteinFoldGroup.add(hBondGroup);

    topologiesGroup.add(proteinFoldGroup);

    // Topology J: Earth NASA (Planetary Mesh + Satellites)
    const earthNasaGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(40, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ 
      color: 0x1e3a8a, 
      emissive: 0x1d4ed8, 
      emissiveIntensity: 0.2,
      wireframe: true 
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthNasaGroup.add(earth);
    // Add satellite rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(55 + i * 10, 0.2, 8, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5);
      ring.rotation.y = (Math.random() - 0.5);
      earthNasaGroup.add(ring);
    }
    topologiesGroup.add(earthNasaGroup);

    // Topology: Spindle
    const spindleGroup = new THREE.Group();
    const spindleTopGeo = new THREE.ConeGeometry(14, 40, 24);
    const spindleBotGeo = new THREE.ConeGeometry(14, 40, 24);
    const spindleMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const spindleTop = new THREE.Mesh(spindleTopGeo, spindleMat);
    spindleTop.position.y = 18;
    spindleGroup.add(spindleTop);
    const spindleBot = new THREE.Mesh(spindleBotGeo, spindleMat);
    spindleBot.position.y = -18;
    spindleBot.rotation.x = Math.PI;
    spindleGroup.add(spindleBot);

    const spindleRingGeo = new THREE.TorusGeometry(22, 0.5, 16, 64);
    const spindleRingMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.6 });
    const spindleRing = new THREE.Mesh(spindleRingGeo, spindleRingMat);
    spindleRing.rotation.x = Math.PI / 2;
    spindleGroup.add(spindleRing);
    topologiesGroup.add(spindleGroup);

    // Topology K: Forest (Organic Biosphere / Nature)
    const forestGroup = new THREE.Group();
    const terrainGeo = new THREE.PlaneGeometry(200, 200, 32, 32);
    const terrainPos = terrainGeo.attributes.position;
    for (let i = 0; i < terrainPos.count; i++) {
      const vx = terrainPos.getX(i);
      const vy = terrainPos.getY(i);
      const vz = Math.sin(vx * 0.05) * Math.cos(vy * 0.05) * 8 + Math.sin(vx * 0.1) * 3;
      terrainPos.setZ(i, vz);
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: false,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -35;
    forestGroup.add(terrainMesh);

    const treeGroup = new THREE.Group();
    forestGroup.add(treeGroup);
    const treeCount = 32;
    const treeTrunkGeo = new THREE.CylinderGeometry(0.8, 1.4, 10, 6);
    const treeCanopy1Geo = new THREE.ConeGeometry(6, 9, 6);
    const treeCanopy2Geo = new THREE.ConeGeometry(4.5, 7.5, 6);
    const treeCanopy3Geo = new THREE.ConeGeometry(3, 6, 6);

    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeCanopyMat1 = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.6, flatShading: true });
    const treeCanopyMat2 = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5, flatShading: true });
    const treeCanopyMat3 = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.4, flatShading: true });

    interface TreeInstance {
      group: THREE.Group;
      canopyGroup: THREE.Group;
      baseX: number;
      baseZ: number;
      swaySpeed: number;
      swayOffset: number;
    }
    const treeInstances: TreeInstance[] = [];

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (i % 3) * 0.6;
      const radius = 22 + (i * 4.2) % 70;
      const tx = Math.cos(angle) * radius + (Math.sin(i * 77) * 6);
      const tz = Math.sin(angle) * radius + (Math.cos(i * 43) * 6);
      const ty = -35 + (Math.sin(tx * 0.05) * Math.cos(-tz * 0.05) * 8 + Math.sin(tx * 0.1) * 3);

      const tGroup = new THREE.Group();
      const heightScale = 0.7 + (i % 5) * 0.15;
      tGroup.position.set(tx, ty, tz);

      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 5 * heightScale;
      trunk.scale.set(heightScale, heightScale, heightScale);
      tGroup.add(trunk);

      const canopyGroup = new THREE.Group();
      const c1 = new THREE.Mesh(treeCanopy1Geo, treeCanopyMat1);
      c1.position.y = 12 * heightScale;
      c1.scale.set(heightScale, heightScale, heightScale);
      canopyGroup.add(c1);

      const c2 = new THREE.Mesh(treeCanopy2Geo, treeCanopyMat2);
      c2.position.y = 17 * heightScale;
      c2.scale.set(heightScale, heightScale, heightScale);
      canopyGroup.add(c2);

      const c3 = new THREE.Mesh(treeCanopy3Geo, treeCanopyMat3);
      c3.position.y = 21 * heightScale;
      c3.scale.set(heightScale, heightScale, heightScale);
      canopyGroup.add(c3);

      tGroup.add(canopyGroup);
      treeGroup.add(tGroup);

      treeInstances.push({
        group: tGroup,
        canopyGroup,
        baseX: tx,
        baseZ: tz,
        swaySpeed: 1.0 + (i % 4) * 0.35,
        swayOffset: i * 0.8,
      });
    }

    const fireflyCount = 90;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyOrigPos: { x: number; y: number; z: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < fireflyCount; i++) {
      const fx = (Math.random() - 0.5) * 150;
      const fy = -25 + Math.random() * 55;
      const fz = (Math.random() - 0.5) * 150;
      fireflyPos[i * 3] = fx;
      fireflyPos[i * 3 + 1] = fy;
      fireflyPos[i * 3 + 2] = fz;
      fireflyOrigPos.push({
        x: fx, y: fy, z: fz,
        speed: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2
      });
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xa7f3d0,
      size: 2.8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
    forestGroup.add(fireflyPoints);
    topologiesGroup.add(forestGroup);

    // Topology L: Cybercity (Technology / Cyberpunk Matrix)
    const cybercityGroup = new THREE.Group();
    const cityGroundGrid = new THREE.GridHelper(240, 24, 0x00f3ff, 0x1e1b4b);
    cityGroundGrid.position.y = -35;
    cybercityGroup.add(cityGroundGrid);

    const bldgMatBase = new THREE.MeshPhongMaterial({
      color: 0x090d16,
      emissive: 0x020617,
      specular: 0x00f2ff,
      shininess: 30,
    });
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const spireMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

    const buildings: {
      mesh: THREE.Mesh;
      spire?: THREE.Mesh;
      baseHeight: number;
      eqIndex: number;
      pulseRate: number;
    }[] = [];
    const cityGeos: THREE.BufferGeometry[] = [];

    let cSeed = 42;
    const cRandom = () => {
      const x = Math.sin(cSeed++) * 10000;
      return x - Math.floor(x);
    };

    for (let r = -3; r <= 3; r++) {
      for (let c = -3; c <= 3; c++) {
        if (Math.abs(r) <= 1 && Math.abs(c) <= 1) continue;
        const bx = c * 26 + (cRandom() - 0.5) * 6;
        const bz = r * 26 + (cRandom() - 0.5) * 6;
        const bw = 9 + cRandom() * 8;
        const bd = 9 + cRandom() * 8;
        const bh = 25 + cRandom() * 65;

        const bldgGeo = new THREE.BoxGeometry(bw, bh, bd);
        cityGeos.push(bldgGeo);
        const bldg = new THREE.Mesh(bldgGeo, bldgMatBase);
        bldg.position.set(bx, -35 + bh / 2, bz);

        const wireGeo = new THREE.BoxGeometry(bw + 0.3, bh + 0.3, bd + 0.3);
        cityGeos.push(wireGeo);
        const wire = new THREE.Mesh(wireGeo, windowMat);
        bldg.add(wire);

        let spireMesh: THREE.Mesh | undefined;
        if (bh > 45) {
          const spireGeo = new THREE.CylinderGeometry(0.2, 0.6, 12, 6);
          cityGeos.push(spireGeo);
          spireMesh = new THREE.Mesh(spireGeo, spireMat);
          spireMesh.position.set(0, bh / 2 + 6, 0);

          const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
          cityGeos.push(beaconGeo);
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(0, 6, 0);
          spireMesh.add(beacon);
          bldg.add(spireMesh);
        }

        cybercityGroup.add(bldg);
        buildings.push({
          mesh: bldg,
          spire: spireMesh,
          baseHeight: bh,
          eqIndex: (r + 3) * 7 + (c + 3),
          pulseRate: 1.0 + cRandom() * 2.0,
        });
      }
    }

    const trafficCount = 120;
    const trafficGeo = new THREE.BufferGeometry();
    const trafficPos = new Float32Array(trafficCount * 3);
    const trafficVel: { x: number; z: number; speed: number }[] = [];

    for (let i = 0; i < trafficCount; i++) {
      const isXDirection = Math.random() > 0.5;
      const laneCoord = (Math.floor(Math.random() * 7) - 3) * 26;
      const laneY = -33 + (Math.floor(Math.random() * 3) * 15);
      const span = (Math.random() - 0.5) * 190;
      const speed = (0.6 + Math.random() * 1.6) * (Math.random() > 0.5 ? 1 : -1);

      if (isXDirection) {
        trafficPos[i * 3] = span;
        trafficPos[i * 3 + 1] = laneY;
        trafficPos[i * 3 + 2] = laneCoord;
        trafficVel.push({ x: speed, z: 0, speed });
      } else {
        trafficPos[i * 3] = laneCoord;
        trafficPos[i * 3 + 1] = laneY;
        trafficPos[i * 3 + 2] = span;
        trafficVel.push({ x: 0, z: speed, speed });
      }
    }
    trafficGeo.setAttribute('position', new THREE.BufferAttribute(trafficPos, 3));
    const trafficMat = new THREE.PointsMaterial({
      color: 0xff007f,
      size: 2.4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const trafficPoints = new THREE.Points(trafficGeo, trafficMat);
    cybercityGroup.add(trafficPoints);
    topologiesGroup.add(cybercityGroup);

    // =========================================================================
    // VISUAL FEEDBACK LAYER: REAL-TIME SENTIMENT SHIFTER & QUADRATIC ATTRACTORS
    // =========================================================================
    const sentimentFeedbackGroup = new THREE.Group();
    scene.add(sentimentFeedbackGroup);

    // 1. Dynamic Sentiment Feedback Aura Shell (64-face geodesic faceted wireframe)
    const auraGeo = new THREE.IcosahedronGeometry(68, 2);
    const auraBasePositions = auraGeo.attributes.position.clone();
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    sentimentFeedbackGroup.add(auraMesh);

    // 2. Quadratic Equation (4x² - 5x - 12 = 0) Orbital Attractors
    // Roots: x1 = (5+√217)/8 ≈ 2.466, x2 = (5-√217)/8 ≈ -1.216
    const quadAttractorGroup = new THREE.Group();
    sentimentFeedbackGroup.add(quadAttractorGroup);

    // Singularity Node 1 (Root 1: +2.466)
    const root1Geo = new THREE.SphereGeometry(3.2, 16, 16);
    const root1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });
    const root1Mesh = new THREE.Mesh(root1Geo, root1Mat);
    quadAttractorGroup.add(root1Mesh);

    // Singularity Node 2 (Root 2: -1.216)
    const root2Geo = new THREE.SphereGeometry(2.4, 16, 16);
    const root2Mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });
    const root2Mesh = new THREE.Mesh(root2Geo, root2Mat);
    quadAttractorGroup.add(root2Mesh);

    // Harmonic Trail connecting roots to active topology
    const rootTrailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(64 * 3);
    rootTrailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const rootTrailMat = new THREE.LineBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const rootTrailLine = new THREE.Line(rootTrailGeo, rootTrailMat);
    quadAttractorGroup.add(rootTrailLine);

    // 4. 4,000 Interactive Vector Flow Particles
    const PARTICLE_COUNT = 4000;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pColors = new Float32Array(PARTICLE_COUNT * 3);
    const pBase: { theta: number; phi: number; r: number; speed: number; waveOffset: number }[] = [];

    const c1 = new THREE.Color(0x00f2ff);
    const c2 = new THREE.Color(0xa855f7);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 35 + Math.random() * 150;

      pBase.push({ theta, phi, r, speed: 0.3 + Math.random() * 0.8, waveOffset: Math.random() * 10 });
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);

      const lerped = c1.clone().lerp(c2, Math.random());
      pColors[i * 3] = lerped.r;
      pColors[i * 3 + 1] = lerped.g;
      pColors[i * 3 + 2] = lerped.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(pGeo, pMat);
    scene.add(particleField);
    let activeParticleCount = PARTICLE_COUNT;
    let activePixelRatio = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    pGeo.setDrawRange(0, activeParticleCount);

    // =========================================================================
    // 3D VOID FREQUENCY WAVEFORM MATRIX & AUDIO SPECTRUM HORIZON RIBBON
    // =========================================================================
    const voidWaveformGroup = new THREE.Group();
    scene.add(voidWaveformGroup);

    // 1. 3D Cylindrical Audio Frequency Horizon Ribbon (128 Frequency Bins)
    const waveSegments = 128;
    const ribbonRadius = 90;
    const ribbonHeight = 32;
    const ribbonGeo = new THREE.CylinderGeometry(ribbonRadius, ribbonRadius + 6, ribbonHeight, waveSegments, 4, true);
    const ribbonBasePositions = ribbonGeo.attributes.position.clone();
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    voidWaveformGroup.add(ribbonMesh);

    // 2. 48 Radial 3D Spectrum Frequency Equalizer Pillars in the Void
    const pillarCount = 48;
    const pillarMeshes: THREE.Mesh[] = [];
    const pillarGeo = new THREE.CylinderGeometry(0.8, 1.2, 1, 8);
    const pillarRadius = 112;
    const pillarGroup = new THREE.Group();
    voidWaveformGroup.add(pillarGroup);

    for (let p = 0; p < pillarCount; p++) {
      const angle = (p / pillarCount) * Math.PI * 2;
      const px = Math.cos(angle) * pillarRadius;
      const pz = Math.sin(angle) * pillarRadius;
      const pMat = new THREE.MeshBasicMaterial({
        color: p % 2 === 0 ? 0x00f2ff : 0xa855f7,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(pillarGeo, pMat);
      mesh.position.set(px, 0, pz);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(px, 0, pz).normalize());
      pillarGroup.add(mesh);
      pillarMeshes.push(mesh);
    }

    // 3. Expanding Sonic Shockwave Rings in Void
    const shockwaveRings: { mesh: THREE.Mesh; scale: number; maxScale: number; speed: number; opacity: number }[] = [];
    const ringGeo = new THREE.RingGeometry(16, 18.5, 64);
    for (let s = 0; s < 3; s++) {
      const sMat = new THREE.MeshBasicMaterial({
        color: 0x00f2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const sMesh = new THREE.Mesh(ringGeo, sMat);
      sMesh.rotation.x = Math.PI * 0.5;
      voidWaveformGroup.add(sMesh);
      shockwaveRings.push({
        mesh: sMesh,
        scale: 1 + s * 2,
        maxScale: 14,
        speed: 0.08 + s * 0.03,
        opacity: 0,
      });
    }

    // 5. Floating 3D Holographic Speech Banner
    const speechCanvas = document.createElement('canvas');
    speechCanvas.width = 1024;
    speechCanvas.height = 256;
    const speechTexture = new THREE.CanvasTexture(speechCanvas);
    speechTexture.colorSpace = THREE.SRGBColorSpace;
    const speechMat = new THREE.MeshBasicMaterial({
      map: speechTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const speechGeo = new THREE.PlaneGeometry(70, 17.5);
    const speechPlane = new THREE.Mesh(speechGeo, speechMat);
    speechPlane.position.set(0, 56, 10);

    // 3D Acoustic resonator halo around speech plane
    const speechHaloGroup = new THREE.Group();
    const speechHaloGeo = new THREE.RingGeometry(35.5, 37, 64);
    const speechHaloMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const speechHalo = new THREE.Mesh(speechHaloGeo, speechHaloMat);
    speechHaloGroup.add(speechHalo);

    const speechWaveGeo = new THREE.RingGeometry(37.5, 38.5, 64);
    const speechWaveMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const speechWave = new THREE.Mesh(speechWaveGeo, speechWaveMat);
    speechHaloGroup.add(speechWave);
    speechPlane.add(speechHaloGroup);
    scene.add(speechPlane);

    function updateSpeechHologramTexture(
      text: string,
      env: EnvironmentState,
      voiceData: import('../services/audioVoiceService').VoiceAudioData | null,
      _timeVal: number
    ) {
      const sCtx = speechCanvas.getContext('2d');
      if (!sCtx) return;
      sCtx.clearRect(0, 0, 1024, 256);

      const isSpeaking = voiceData?.isSpeaking ?? false;
      if (!text && !isSpeaking) {
        speechTexture.needsUpdate = true;
        return;
      }

      const activeText = text || (voiceData?.activeText ?? 'Neural Voice Core Ready');
      const sentiment = env.sentiment || 'analytical';
      const tone = env.activeSpeechTone || (voiceData?.tone ?? 'Harmonic');
      const activeWord = (voiceData?.activeWord || env.activeSpeechWord || '').trim();
      const currentWordIdx = voiceData?.wordIndex ?? -1;

      // Theme-specific styling palette & typography
      let themePrimary = '#00f2ff';
      let themeSecondary = '#818cf8';
      let bgGradStart = 'rgba(2, 6, 23, 0.92)';
      let bgGradEnd = 'rgba(15, 23, 42, 0.96)';
      let fontFamily = '"JetBrains Mono", monospace';
      let themeType = 'tech';

      if (sentiment === 'nature') {
        themePrimary = '#10b981';
        themeSecondary = '#84cc16';
        bgGradStart = 'rgba(4, 34, 18, 0.94)';
        bgGradEnd = 'rgba(2, 20, 10, 0.98)';
        fontFamily = 'Georgia, "Playfair Display", serif';
        themeType = 'nature';
      } else if (sentiment === 'cyberpunk') {
        themePrimary = '#00f2ff';
        themeSecondary = '#ff007f';
        bgGradStart = 'rgba(20, 0, 40, 0.94)';
        bgGradEnd = 'rgba(8, 0, 20, 0.98)';
        fontFamily = '"Fira Code", monospace';
        themeType = 'cyberpunk';
      } else if (sentiment === 'alarm') {
        themePrimary = '#ef4444';
        themeSecondary = '#f97316';
        bgGradStart = 'rgba(40, 4, 8, 0.94)';
        bgGradEnd = 'rgba(22, 2, 4, 0.98)';
        fontFamily = '"Orbitron", sans-serif';
        themeType = 'alarm';
      } else if (sentiment === 'cosmic') {
        themePrimary = '#c084fc';
        themeSecondary = '#6366f1';
        bgGradStart = 'rgba(24, 4, 45, 0.94)';
        bgGradEnd = 'rgba(10, 2, 24, 0.98)';
        fontFamily = '"Orbitron", sans-serif';
        themeType = 'cosmic';
      } else if (sentiment === 'energetic') {
        themePrimary = '#f59e0b';
        themeSecondary = '#ef4444';
        bgGradStart = 'rgba(42, 20, 3, 0.94)';
        bgGradEnd = 'rgba(24, 10, 2, 0.98)';
        fontFamily = '"Orbitron", sans-serif';
        themeType = 'energetic';
      } else if (sentiment === 'tranquil') {
        themePrimary = '#06b6d4';
        themeSecondary = '#10b981';
        bgGradStart = 'rgba(3, 30, 32, 0.94)';
        bgGradEnd = 'rgba(1, 16, 20, 0.98)';
        fontFamily = 'system-ui, sans-serif';
        themeType = 'tranquil';
      }

      // Background rounded banner
      const bgGrad = sCtx.createLinearGradient(0, 0, 1024, 256);
      bgGrad.addColorStop(0, bgGradStart);
      bgGrad.addColorStop(1, bgGradEnd);
      sCtx.fillStyle = bgGrad;
      sCtx.strokeStyle = themePrimary;
      sCtx.lineWidth = 3.5;
      sCtx.beginPath();
      sCtx.roundRect(16, 16, 992, 224, 20);
      sCtx.fill();
      sCtx.stroke();

      // Thematic Accents
      if (themeType === 'cyberpunk') {
        sCtx.strokeStyle = themeSecondary;
        sCtx.lineWidth = 4;
        sCtx.beginPath(); sCtx.moveTo(24, 48); sCtx.lineTo(24, 24); sCtx.lineTo(48, 24); sCtx.stroke();
        sCtx.beginPath(); sCtx.moveTo(1000, 48); sCtx.lineTo(1000, 24); sCtx.lineTo(976, 24); sCtx.stroke();
        sCtx.beginPath(); sCtx.moveTo(24, 208); sCtx.lineTo(24, 232); sCtx.lineTo(48, 232); sCtx.stroke();
        sCtx.beginPath(); sCtx.moveTo(1000, 208); sCtx.lineTo(1000, 232); sCtx.lineTo(976, 232); sCtx.stroke();
        sCtx.fillStyle = 'rgba(0, 242, 255, 0.05)';
        for (let y = 20; y < 236; y += 8) {
          sCtx.fillRect(18, y, 988, 2);
        }
      } else if (themeType === 'alarm') {
        sCtx.save();
        sCtx.beginPath();
        sCtx.rect(16, 16, 992, 24);
        sCtx.clip();
        sCtx.fillStyle = '#f59e0b';
        for (let x = 0; x < 1024; x += 36) {
          sCtx.beginPath();
          sCtx.moveTo(x, 16);
          sCtx.lineTo(x + 18, 16);
          sCtx.lineTo(x + 6, 40);
          sCtx.lineTo(x - 12, 40);
          sCtx.closePath();
          sCtx.fill();
        }
        sCtx.restore();
      } else if (themeType === 'nature') {
        sCtx.fillStyle = '#84cc16';
        sCtx.beginPath();
        sCtx.arc(42, 42, 5, 0, Math.PI * 2);
        sCtx.arc(982, 42, 5, 0, Math.PI * 2);
        sCtx.fill();
      }

      // Live Audio Equalizer Bars at bottom
      if (voiceData && isSpeaking && voiceData.frequencyData) {
        const freq = voiceData.frequencyData;
        const numBars = 48;
        const barW = 15;
        const gap = 4;
        const totalW = numBars * (barW + gap);
        const startX = (1024 - totalW) / 2;
        const baseY = 224;

        for (let b = 0; b < numBars; b++) {
          const val = freq[b % freq.length] || 0;
          const barH = Math.min(42, Math.max(3, (val / 255) * 42));
          sCtx.fillStyle = b % 2 === 0 ? themePrimary : themeSecondary;
          sCtx.globalAlpha = 0.5 + (val / 255) * 0.5;
          sCtx.fillRect(startX + b * (barW + gap), baseY - barH, barW, barH);
        }
        sCtx.globalAlpha = 1.0;
      }

      // Header Tagline & Glyph
      sCtx.font = `bold 36px ${fontFamily}`;
      sCtx.fillStyle = themePrimary;
      sCtx.textAlign = 'left';
      sCtx.fillText(env.floatingGlyph || '⨋', 40, 64);

      sCtx.font = `bold 16px ${fontFamily}`;
      sCtx.fillStyle = '#ffffff';
      const profName = (voiceData?.profile || env.voiceProfile || 'Sovereign').toUpperCase();
      sCtx.fillText(`[VOICE: ${profName}]`, 92, 52);

      sCtx.font = `13px ${fontFamily}`;
      sCtx.fillStyle = themeSecondary;
      sCtx.fillText(`TONE: ${tone.toUpperCase()}  |  SENTIMENT: ${sentiment.toUpperCase()}`, 92, 74);

      sCtx.textAlign = 'right';
      sCtx.font = `bold 13px ${fontFamily}`;
      sCtx.fillStyle = isSpeaking ? '#22c55e' : '#94a3b8';
      sCtx.fillText(isSpeaking ? '● VOCALIZING' : '○ READY', 980, 58);

      // Spoken text with word-level highlight
      const words = activeText.split(/\s+/).filter(Boolean);
      const maxWordsToShow = 14;
      const windowStart = Math.max(0, Math.min(currentWordIdx - 3, Math.max(0, words.length - maxWordsToShow)));
      const windowWords = words.slice(windowStart, windowStart + maxWordsToShow);

      let textX = 42;
      const textY = 138;
      sCtx.textAlign = 'left';

      windowWords.forEach((word, wIdx) => {
        const absIdx = windowStart + wIdx;
        const isCurrent = isSpeaking && (absIdx === currentWordIdx || (activeWord && word.toLowerCase().replace(/[^a-z0-9]/g, '') === activeWord.toLowerCase().replace(/[^a-z0-9]/g, '')));
        const isPast = absIdx < currentWordIdx;

        sCtx.font = isCurrent ? `bold 30px ${fontFamily}` : `24px ${fontFamily}`;
        const measured = sCtx.measureText(word + ' ');

        if (isCurrent) {
          sCtx.fillStyle = themePrimary;
          sCtx.globalAlpha = 0.35;
          sCtx.beginPath();
          sCtx.roundRect(textX - 4, textY - 28, measured.width + 4, 38, 8);
          sCtx.fill();
          sCtx.globalAlpha = 1.0;

          sCtx.shadowColor = themePrimary;
          sCtx.shadowBlur = 12;
          sCtx.fillStyle = '#ffffff';
          sCtx.fillText(word, textX, textY);
          sCtx.shadowBlur = 0;
        } else if (isPast) {
          sCtx.fillStyle = '#ffffff';
          sCtx.fillText(word, textX, textY);
        } else {
          sCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          sCtx.fillText(word, textX, textY);
        }

        textX += measured.width;
      });

      speechTexture.needsUpdate = true;
    }

    // 6. Interactive Mouse & Gesture Advection
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragRotX = 0;
    let dragRotY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredNodeId: string | null = null;

    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    // Scene navigation never responds to keys typed into terminal controls.
    const isTextEntry = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      !!target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]');
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextEntry(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (Object.prototype.hasOwnProperty.call(keys, e.key)) (keys as any)[e.key] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (Object.prototype.hasOwnProperty.call(keys, e.key)) (keys as any)[e.key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Only explicit interactions on the actual WebGL canvas steer the scene.
    // Buttons, terminal editor, modals and embedded services are never intercepted.
    const isSceneTarget = (target: EventTarget | null): boolean =>
      target instanceof Node && container.contains(target);
    const onMouseDown = (e: MouseEvent) => {
      if (!isSceneTarget(e.target)) return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onTouchStart = (e: TouchEvent) => {
      if (!isSceneTarget(e.target)) return;
      if (e.touches.length > 0) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };
    const onTouchEnd = () => { isDragging = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!isSceneTarget(e.target)) { isDragging = false; return; }
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - lastX;
        const deltaY = e.touches[0].clientY - lastY;
        dragRotY += deltaX * 0.005;
        dragRotX += deltaY * 0.005;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove);

    const onPointerMove = (e: MouseEvent) => {
      if (!isSceneTarget(e.target)) { isDragging = false; mouse.set(2, 2); return; }
      const nx = (e.clientX - width / 2) / (width / 2);
      const ny = (e.clientY - height / 2) / (height / 2);
      mouseX = nx;
      mouseY = ny;
      
      // Default parallax tilt (non-persistent)
      targetRotY = nx * 0.45;
      targetRotX = ny * 0.35;

      if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        dragRotY += deltaX * 0.005;
        dragRotX += deltaY * 0.005;
        lastX = e.clientX;
        lastY = e.clientY;
      }

      // Update mouse for raycasting
      mouse.x = (e.clientX / width) * 2 - 1;
      mouse.y = -(e.clientY / height) * 2 + 1;
    };
    window.addEventListener('mousemove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 7. Master Continuous Render Loop
    let animId: number;
    let lastTime = performance.now();
    let smoothedAudio = 0;
    let lastSpokenText = '';
    let lastPresentedAt = 0;
    let targetFrameRate = 60;
    axsResourceGovernor.reset();

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      // Adaptive render cadence is based on measured work duration.
      // It never blocks terminal input, graph filtering or event ingestion.
      if (now - lastPresentedAt < (1000 / targetFrameRate) - 2) return;
      lastPresentedAt = now;
      const frameStart = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const sqePhase = causalCore.tick(delta);
      updateObservedRelations();

      const currentEnv = envRef.current;
      const t = (now * 0.0008 * currentEnv.speed) % 86400;

      // Real-time Web Audio analyser polling: combine AI voice output stream, mic, and tones
      const combinedFreq = audioVoiceService.getCombinedAudioFrequencyData();
      const voiceAudioData = audioVoiceService.getVoiceAudioData();
      const isVoiceActive = voiceAudioData ? voiceAudioData.isSpeaking : false;

      let audioVolume = 0;
      if (combinedFreq && combinedFreq.length > 0) {
        let sum = 0;
        for (let i = 0; i < combinedFreq.length; i++) sum += combinedFreq[i];
        audioVolume = (sum / combinedFreq.length) / 255;
      }
      if (voiceAudioData && voiceAudioData.volume > audioVolume) {
        audioVolume = voiceAudioData.volume;
      }
      smoothedAudio += (audioVolume - smoothedAudio) * 0.22;

      // Update 3D Holographic Speech Texture
      const currentActiveWord = voiceAudioData?.activeWord || currentEnv.activeSpeechWord || '';
      if (isVoiceActive || currentEnv.activeSpeechText) {
        updateSpeechHologramTexture(currentEnv.activeSpeechText, currentEnv, voiceAudioData, t);
      } else if (lastSpokenText) {
        lastSpokenText = '';
        updateSpeechHologramTexture('', currentEnv, null, t);
      }

      // Smooth camera and group orientation
      if (currentEnv.topology === 'galaxy_vfs') {
        // In galaxy mode, drag rotates the camera look direction
        camera.rotation.y = dragRotY + targetRotY * 0.2;
        camera.rotation.x = -dragRotX + targetRotX * 0.2;
      } else {
        // In object modes, drag rotates the topology group
        topologiesGroup.rotation.y += (dragRotY + targetRotY - topologiesGroup.rotation.y) * 0.05;
        topologiesGroup.rotation.x += (dragRotX + targetRotX - topologiesGroup.rotation.x) * 0.05;
      }

      // Visibility toggles based on active topology
      torusMesh.visible = currentEnv.topology === 'torus';
      tesseractGroup.visible = currentEnv.topology === 'tesseract';
      singularityGroup.visible = currentEnv.topology === 'singularity';
      neuralGroup.visible = currentEnv.topology === 'neural';
      galaxyGroup.visible = currentEnv.topology === 'galaxy';
      dnaGroup.visible = currentEnv.topology === 'dna';
      galaxyVfsGroup.visible = currentEnv.topology === 'galaxy_vfs';
      roboticsLabGroup.visible = currentEnv.topology === 'robotics_lab';
      proteinFoldGroup.visible = currentEnv.topology === 'protein_fold';
      earthNasaGroup.visible = currentEnv.topology === 'earth_nasa';
      forestGroup.visible = currentEnv.topology === 'forest';
      cybercityGroup.visible = currentEnv.topology === 'cybercity';
      spindleGroup.visible = currentEnv.topology === 'spindle';

      // Camera Movement for Galaxy VFS
      if (currentEnv.topology === 'galaxy_vfs') {
        const moveSpeed = 1.2 * currentEnv.speed;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        if (keys.w || keys.ArrowUp) camera.position.addScaledVector(dir, moveSpeed);
        if (keys.s || keys.ArrowDown) camera.position.addScaledVector(dir, -moveSpeed);
        
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        if (keys.a || keys.ArrowLeft) camera.position.addScaledVector(side, moveSpeed);
        if (keys.d || keys.ArrowRight) camera.position.addScaledVector(side, -moveSpeed);

        // Keep camera from going too far or sinking into nothingness
        const dist = camera.position.length();
        if (dist > 1500) camera.position.setLength(1500);

        // Raycasting for hover detection
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(galaxyVfsGroup.children);
        if (intersects.length > 0) {
          const hoveredMesh = intersects[0].object as THREE.Mesh;
          const node = vfsNodes.find(n => n.mesh === hoveredMesh);
          hoveredNodeId = node ? node.path : null;
        } else {
          hoveredNodeId = null;
        }

        // Individual node animations
        let closestNode: VfsStarNode | null = null;
        let minDistance = Infinity;

        vfsNodes.forEach((n) => {
          n.mesh.rotation.x += n.velocity.x;
          n.mesh.rotation.y += n.velocity.y;
          
          const pulse = 1 + Math.sin(t * 2 + n.originalPos.x) * 0.1 + smoothedAudio * 0.2;
          n.mesh.scale.setScalar(pulse);

          const d = n.mesh.position.distanceTo(camera.position);
          if (d < minDistance) {
            minDistance = d;
            closestNode = n;
          }

          // Highlight hovered node
          if (n.path === hoveredNodeId) {
            (n.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.5;
          } else {
            (n.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
          }
        });

        // Trigger Gemini Navigator if close enough to a node
        if (closestNode && minDistance < 50) {
          navigatorService.navigateToNode(
            (closestNode as VfsStarNode).label,
            (closestNode as VfsStarNode).path,
            (closestNode as VfsStarNode).type,
            (closestNode as VfsStarNode).data.content
          );
        }
      } else {
        // Reset camera if not in VFS mode
        const targetPos = new THREE.Vector3(0, 0, 140);
        camera.position.lerp(targetPos, 0.02);
        camera.lookAt(0, 0, 0);
      }

      // REAL-TIME SENTIMENT COLOR PALETTE & ATMOSPHERE SHIFTER
      const activeSentiment = currentEnv.sentiment || 'analytical';
      const sentimentCfg = SENTIMENT_PALETTES[activeSentiment] || SENTIMENT_PALETTES.analytical;

      // Primary color update for active material
      const bloom = currentEnv.bloomIntensity;
      const ledState = currentEnv.rgbLed ? computeRgbLedState(t, currentEnv.rgbLed, smoothedAudio) : null;
      const targetCol = ledState
        ? new THREE.Color(ledState.primaryHex)
        : sentimentCfg.primary.clone().lerp(new THREE.Color(currentEnv.primaryColor), 0.35);
      const secondaryCol = ledState
        ? new THREE.Color(ledState.secondaryHex)
        : sentimentCfg.secondary.clone().lerp(new THREE.Color(currentEnv.secondaryColor), 0.35);

      // Real-time sentiment-driven lights and atmospheric fog
      if (scene.fog) {
        scene.fog.color.lerp(sentimentCfg.fog, 0.05);
      }
      ambientLight.color.lerp(sentimentCfg.ambient, 0.08);
      keyLight.color.lerp(targetCol, 0.08);
      rimLight.color.lerp(secondaryCol, 0.08);

      if (ledState) {
        ambientLight.intensity = 0.5 * ledState.intensity;
        keyLight.intensity = 1.8 * bloom * ledState.intensity;
        rimLight.intensity = 1.4 * bloom * ledState.intensity;
      } else {
        keyLight.intensity = 1.8 * bloom;
        rimLight.intensity = 1.4 * bloom;
      }

      // Real-time sentiment-driven aura shell modulation & vertex displacement
      const jitterMod = sentimentCfg.jitterFrequency;
      auraMesh.rotation.y = t * 0.35 * sentimentCfg.rotationSpeedMod;
      auraMesh.rotation.x = t * 0.22 * sentimentCfg.rotationSpeedMod;
      auraMat.color.lerp(targetCol, 0.08);
      auraMat.opacity = Math.min(0.65, (0.28 + smoothedAudio * 0.45) * bloom);

      const auraPosAttr = auraGeo.attributes.position;
      const auraBase = auraBasePositions;
      const auraCount = auraPosAttr.count;
      for (let av = 0; av < auraCount; av++) {
        const bx = auraBase.getX(av);
        const by = auraBase.getY(av);
        const bz = auraBase.getZ(av);
        const wave = Math.sin(t * (3.0 + jitterMod) + bx * 0.06 + by * 0.06) * (2.2 + jitterMod * 1.8) + (smoothedAudio * 8.5);
        const scaleFact = sentimentCfg.topologyScaleMod + (wave / 68);
        auraPosAttr.setXYZ(av, bx * scaleFact, by * scaleFact, bz * scaleFact);
      }
      auraPosAttr.needsUpdate = true;

      // Animate Quadratic Equation (4x² - 5x - 12 = 0) Orbital Attractors
      const r1Angle = t * 1.4 * sentimentCfg.rotationSpeedMod;
      const r1Dist = 52 + Math.sin(t * 2.5) * 6;
      root1Mesh.position.set(Math.cos(r1Angle) * r1Dist, Math.sin(r1Angle * 0.7) * 22, Math.sin(r1Angle) * r1Dist);
      root1Mat.color.lerp(targetCol, 0.08);

      const r2Angle = -t * 1.8 * sentimentCfg.rotationSpeedMod + Math.PI;
      const r2Dist = 38 + Math.cos(t * 3.0) * 5;
      root2Mesh.position.set(Math.cos(r2Angle) * r2Dist, Math.sin(r2Angle * 0.6) * 26, Math.sin(r2Angle) * r2Dist);
      root2Mat.color.lerp(secondaryCol, 0.08);

      const trailAttr = rootTrailGeo.attributes.position;
      for (let tp = 0; tp < 64; tp++) {
        const frac = tp / 63;
        const curX = THREE.MathUtils.lerp(root1Mesh.position.x, root2Mesh.position.x, frac) + Math.sin(t * 4 + tp * 0.2) * (2.5 * jitterMod);
        const curY = THREE.MathUtils.lerp(root1Mesh.position.y, root2Mesh.position.y, frac) + Math.cos(t * 3 + tp * 0.2) * (1.8 * jitterMod);
        const curZ = THREE.MathUtils.lerp(root1Mesh.position.z, root2Mesh.position.z, frac);
        trailAttr.setXYZ(tp, curX, curY, curZ);
      }
      trailAttr.needsUpdate = true;

      const samples = pllmSensorAgent.summary().recent;
      const observed = samples.length ? shaderPulseFromMetrics(samples[samples.length-1]) : 0;
      const phasePulse = Math.min(1,Math.abs(sqePhase.p)/2);
      const pulse = Math.max(observed,phasePulse);
      cauldronMaterial.uniforms.u_time.value=t;
      cauldronMaterial.uniforms.u_tensorPulse.value=pulse;
      cauldronMaterial.uniforms.u_accentColor.value.copy(targetCol);
      cauldronPlane.visible=currentEnv.topology==='torus';
      const markers=librationMarkers(t*0.4,Math.max(0,Math.min(15,Math.round(pulse*15))));
      marker4.visible=cauldronPlane.visible;
      marker5.visible=cauldronPlane.visible;
      marker4.position.set(markers.L4.x,markers.L4.y,-37);
      marker5.position.set(markers.L5.x,markers.L5.y,-37);

      // Animate active topology with real-time sentiment scale and rotation modulation
      if (currentEnv.topology === 'torus') {
        torusMat.color.lerp(targetCol, 0.08);
        torusMat.opacity = 0.55 * bloom;
        torusMesh.rotation.x = (t * 0.5 + sqePhase.q * 0.16) * sentimentCfg.rotationSpeedMod;
        torusMesh.rotation.y = (t * 0.7 + sqePhase.p * 0.16) * sentimentCfg.rotationSpeedMod;
        const scale = (1 + Math.sin(t * (3 + jitterMod)) * (0.06 + jitterMod * 0.02) + smoothedAudio * 0.35) * sentimentCfg.topologyScaleMod;
        torusMesh.scale.setScalar(scale);
      } else if (currentEnv.topology === 'tesseract') {
        tessLineMat.color.lerp(targetCol, 0.08);
        tessLineMat.opacity = 0.85 * bloom;
        // 4D Givens rotation
        const angleXW = t * 0.7;
        const angleYZ = t * 0.5;
        const cosXW = Math.cos(angleXW), sinXW = Math.sin(angleXW);
        const cosYZ = Math.cos(angleYZ), sinYZ = Math.sin(angleYZ);

        const posAttr = tesseractLines.geometry.attributes.position;
        let lineIdx = 0;
        for (let e = 0; e < tesseractEdges.length; e++) {
          const v1 = hypercube4D[tesseractEdges[e][0]];
          const v2 = hypercube4D[tesseractEdges[e][1]];

          // Rotate v1
          const x1 = v1[0] * cosXW - v1[3] * sinXW;
          const w1 = v1[0] * sinXW + v1[3] * cosXW;
          const y1 = v1[1] * cosYZ - v1[2] * sinYZ;
          const z1 = v1[1] * sinYZ + v1[2] * cosYZ;
          const s1 = (38 / (3.2 - w1 * 0.7)) * (1 + smoothedAudio * 0.3);

          // Rotate v2
          const x2 = v2[0] * cosXW - v2[3] * sinXW;
          const w2 = v2[0] * sinXW + v2[3] * cosXW;
          const y2 = v2[1] * cosYZ - v2[2] * sinYZ;
          const z2 = v2[1] * sinYZ + v2[2] * cosYZ;
          const s2 = (38 / (3.2 - w2 * 0.7)) * (1 + smoothedAudio * 0.3);

          posAttr.setXYZ(lineIdx++, x1 * s1, y1 * s1, z1 * s1);
          posAttr.setXYZ(lineIdx++, x2 * s2, y2 * s2, z2 * s2);
        }
        posAttr.needsUpdate = true;
      } else if (currentEnv.topology === 'singularity') {
        accretionMat.color.lerp(targetCol, 0.08);
        accretionMat.opacity = 0.65 * bloom;
        accretionRing.rotation.z = t * 1.5;
        const pulse = 1 + Math.sin(t * 4) * 0.08 + smoothedAudio * 0.5;
        accretionRing.scale.setScalar(pulse);
      } else if (currentEnv.topology === 'neural') {
        axonMat.color.lerp(targetCol, 0.08);
        axonMat.opacity = 0.45 * bloom;
        neuronMat.color.lerp(secondaryCol, 0.08);
        neuronMat.opacity = 0.8 * bloom;
        neuralGroup.rotation.y = t * 0.4;
      } else if (currentEnv.topology === 'galaxy') {
        galaxyGroup.rotation.z = t * 0.3;
        galaxyGroup.rotation.y = t * 0.2;
        // ring opacities could be modulated too but they were individual
      } else if (currentEnv.topology === 'dna') {
        dnaMat.color.lerp(targetCol, 0.08);
        dnaMat.opacity = 0.7 * bloom;
        dnaGroup.rotation.y = t * 0.8;
      } else if (currentEnv.topology === 'galaxy_vfs') {
        // Master rotation of the galaxy
        galaxyVfsGroup.rotation.y = t * 0.05;
      } else if (currentEnv.topology === 'robotics_lab') {
        arm.rotation.y = t * 2;
        arm.position.x = Math.sin(t) * 20;
        gridHelper.material.opacity = 0.4 * bloom;
      } else if (currentEnv.topology === 'protein_fold') {
        proteinMat.color.lerp(targetCol, 0.08);
        outerRibbonMat.color.lerp(secondaryCol, 0.08);
        outerRibbonMat.opacity = (0.28 + smoothedAudio * 0.45) * bloom;
        hBondMat.opacity = (0.35 + Math.sin(t * 4) * 0.15 + smoothedAudio * 0.3) * bloom;

        // Cinematic 3-axis continuous gimbal flow
        proteinFoldGroup.rotation.y = t * 0.25 * currentEnv.speed;
        proteinFoldGroup.rotation.x = Math.sin(t * 0.35) * 0.22;
        proteinFoldGroup.rotation.z = Math.cos(t * 0.28) * 0.18;

        // Counter-rotation of outer holographic envelope
        outerRibbonMesh.rotation.y = -t * 0.4 * currentEnv.speed;
        outerRibbonMesh.rotation.z = Math.sin(t * 0.6) * 0.15;

        // Resonant bio-harmonic breath pulsation
        const pulse = (1 + Math.sin(t * 2.4) * 0.08 + smoothedAudio * 0.35) * sentimentCfg.topologyScaleMod;
        proteinFoldGroup.scale.setScalar(pulse);
      } else if (currentEnv.topology === 'earth_nasa') {
        earth.rotation.y = t * 0.2;
        earthMat.color.lerp(targetCol, 0.08);
        earthNasaGroup.children.forEach((child, idx) => {
          if (idx > 0) { // skip earth
            child.rotation.z += 0.01 * currentEnv.speed;
          }
        });
      } else if (currentEnv.topology === 'forest') {
        forestGroup.rotation.y = t * 0.04;
        treeInstances.forEach((tInst) => {
          tInst.canopyGroup.rotation.z = Math.sin(t * tInst.swaySpeed + tInst.swayOffset) * (0.04 + smoothedAudio * 0.08);
          tInst.canopyGroup.rotation.x = Math.cos(t * tInst.swaySpeed * 0.8 + tInst.swayOffset) * (0.03 + smoothedAudio * 0.05);
        });
        const fPos = fireflyGeo.attributes.position;
        for (let i = 0; i < fireflyCount; i++) {
          const o = fireflyOrigPos[i];
          const ny = o.y + Math.sin(t * o.speed + o.phase) * 6 + (smoothedAudio * 15);
          const nx = o.x + Math.cos(t * 0.4 + o.phase) * 4;
          const nz = o.z + Math.sin(t * 0.4 + o.phase) * 4;
          fPos.setXYZ(i, nx, ny, nz);
        }
        fPos.needsUpdate = true;
        fireflyMat.size = 2.8 + smoothedAudio * 3.5;
        fireflyMat.color.lerp(targetCol, 0.05);
      } else if (currentEnv.topology === 'cybercity') {
        cybercityGroup.rotation.y = t * 0.06;
        buildings.forEach((bldg) => {
          const freqVal = combinedFreq ? (combinedFreq[bldg.eqIndex % 128] || 0) / 255 : 0;
          const targetScaleY = 1 + freqVal * 0.5 * reactiveLevel + smoothedAudio * 0.25;
          bldg.mesh.scale.set(1, targetScaleY, 1);
          bldg.mesh.position.y = -35 + (bldg.baseHeight * targetScaleY) / 2;
          if (bldg.spire) {
            const mat = bldg.spire.material as THREE.MeshBasicMaterial;
            mat.color.setHex(Math.sin(t * bldg.pulseRate * 4) > 0 ? 0x00f2ff : 0xff007f);
          }
        });
        const trafPos = trafficGeo.attributes.position;
        for (let i = 0; i < trafficCount; i++) {
          let tx = trafPos.getX(i);
          let tz = trafPos.getZ(i);
          const vel = trafficVel[i];
          if (vel.x !== 0) {
            tx += vel.x * (1 + smoothedAudio * 2.5);
            if (tx > 100) tx = -100;
            if (tx < -100) tx = 100;
            trafPos.setX(i, tx);
          } else {
            tz += vel.z * (1 + smoothedAudio * 2.5);
            if (tz > 100) tz = -100;
            if (tz < -100) tz = 100;
            trafPos.setZ(i, tz);
          }
        }
        trafPos.needsUpdate = true;
        trafficMat.color.lerp(secondaryCol, 0.05);
      } else if (currentEnv.topology === 'spindle') {
        spindleGroup.rotation.y = t * 1.5;
        spindleGroup.rotation.z = Math.sin(t * 0.8) * 0.2;
        const scale = 1 + Math.sin(t * 3) * 0.08 + smoothedAudio * 0.4;
        spindleGroup.scale.setScalar(scale);
        spindleRing.rotation.z = t * 3.0;
        spindleMat.color.lerp(targetCol, 0.08);
      }

      // =========================================================================
      // ANIMATE 3D VOID FREQUENCY WAVEFORM MATRIX & AUDIO SPECTRUM HORIZON
      // =========================================================================
      const reactiveLevel = currentEnv.audioReactiveLevel || 1.0;
      voidWaveformGroup.rotation.y = t * 0.18;

      // 1. Modulate 3D Cylindrical Wave Ribbon vertices with real-time frequency bins
      if (combinedFreq) {
        const posAttr = ribbonGeo.attributes.position;
        const baseAttr = ribbonBasePositions;
        const vertexCount = posAttr.count;

        for (let v = 0; v < vertexCount; v++) {
          const bx = baseAttr.getX(v);
          const by = baseAttr.getY(v);
          const bz = baseAttr.getZ(v);

          // Map vertex polar angle to 128 Web Audio frequency bins
          const angle = Math.atan2(bz, bx) + Math.PI; // 0 to 2*PI
          const binIdx = Math.floor((angle / (Math.PI * 2)) * 128) % 128;
          const freqNorm = (combinedFreq[binIdx] || 0) / 255;

          // Compute 3D audio displacement in the void
          const radialAmp = 1 + (freqNorm * 0.42 * reactiveLevel) + (smoothedAudio * 0.22);
          const heightDisp = Math.sin(t * 3.2 + binIdx * 0.18) * 3 + (freqNorm * 26 * reactiveLevel);

          posAttr.setXYZ(v, bx * radialAmp, by + (by > 0 ? heightDisp : -heightDisp), bz * radialAmp);
        }
        posAttr.needsUpdate = true;

        // Color & Opacity reactivity in the void
        ribbonMat.color.lerp(isVoiceActive ? new THREE.Color(0x00f2ff) : targetCol, 0.1);
        ribbonMat.opacity = Math.min(0.95, (0.42 + smoothedAudio * 0.55) * bloom);
      }

      // 2. Animate 48 Spectral Equalizer Pillars in the Void
      pillarMeshes.forEach((pMesh, pIdx) => {
        const freqIndex = Math.min(127, Math.floor((pIdx / pillarCount) * 124));
        const freqNorm = combinedFreq ? (combinedFreq[freqIndex] || 0) / 255 : 0;
        const targetPillarHeight = Math.max(1.2, freqNorm * 42 * reactiveLevel + smoothedAudio * 16);
        pMesh.scale.y += (targetPillarHeight - pMesh.scale.y) * 0.26;

        // Pillar material color shift matching active palette
        const mat = pMesh.material as THREE.MeshBasicMaterial;
        mat.color.lerp(pIdx % 2 === 0 ? targetCol : secondaryCol, 0.1);
        mat.opacity = Math.min(0.92, (0.32 + freqNorm * 0.65) * bloom);
      });

      // 3. Shockwave rings pulse outwards into 3D void when voice volume spikes
      shockwaveRings.forEach((ring, rIdx) => {
        if (smoothedAudio > 0.11 && ring.opacity <= 0.05) {
          ring.opacity = Math.min(0.85, smoothedAudio * 1.6);
          ring.scale = 1 + rIdx * 1.8;
        }

        if (ring.opacity > 0.02) {
          ring.scale += ring.speed * (1 + smoothedAudio * 2.2);
          ring.opacity *= 0.94;
          ring.mesh.scale.setScalar(ring.scale);
          (ring.mesh.material as THREE.MeshBasicMaterial).opacity = ring.opacity * bloom;
          (ring.mesh.material as THREE.MeshBasicMaterial).color.lerp(targetCol, 0.1);
        } else {
          ring.opacity = 0;
          (ring.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      });

      // Key and Rim lights pulse in real-time with audio volume
      keyLight.intensity = (1.8 + smoothedAudio * 2.4) * bloom;
      rimLight.intensity = (1.4 + smoothedAudio * 1.8) * bloom;

      // Animate Particles with Gravity & Audio reactivity
      const pPosArr = particleField.geometry.attributes.position.array as Float32Array;
      const pColArr = particleField.geometry.attributes.color.array as Float32Array;
      const grav = currentEnv.gravity;
      const turb = currentEnv.turbulence;

      for (let i = 0; i < activeParticleCount; i++) {
        const d = pBase[i];
        const angle = d.theta + t * 0.2 * d.speed * grav;
        const wave = Math.sin(d.phi * 5 + t * 2 + d.waveOffset) * 10 * turb;
        const r = (d.r + wave) * (1 + smoothedAudio * 0.25);

        const x = r * Math.sin(d.phi) * Math.cos(angle);
        const y = r * Math.sin(d.phi) * Math.sin(angle);
        const z = r * Math.cos(d.phi);

        const i3 = i * 3;
        pPosArr[i3] = x;
        pPosArr[i3 + 1] = y;
        pPosArr[i3 + 2] = z;

        // Color modulation with high-end gamut dispersion
        if (ledState && i % 3 === 0) {
          const tertCol = new THREE.Color(ledState.tertiaryHex);
          pColArr[i3] = tertCol.r * (0.8 + smoothedAudio * 0.5) * bloom;
          pColArr[i3 + 1] = tertCol.g * (0.8 + smoothedAudio * 0.5) * bloom;
          pColArr[i3 + 2] = tertCol.b * (0.8 + smoothedAudio * 0.5) * bloom;
        } else {
          pColArr[i3] = targetCol.r * (0.8 + smoothedAudio * 0.5) * bloom;
          pColArr[i3 + 1] = targetCol.g * (0.8 + smoothedAudio * 0.5) * bloom;
          pColArr[i3 + 2] = secondaryCol.b * (0.8 + smoothedAudio * 0.5) * bloom;
        }
      }
      particleField.geometry.attributes.position.needsUpdate = true;
      particleField.geometry.attributes.color.needsUpdate = true;
      pMat.opacity = 0.85 * Math.min(1.0, bloom);

      // Floating speech plane gentle hover & audio reactive pulsing
      if (speechPlane.visible) {
        const voiceVol = voiceAudioData ? voiceAudioData.volume : 0;
        speechPlane.position.y = 54 + Math.sin(t * 1.5) * 3 + voiceVol * 2.5;
        speechPlane.rotation.y = Math.sin(t * 0.8) * 0.08;
        const scaleFact = 1 + voiceVol * 0.1;
        speechPlane.scale.set(scaleFact, scaleFact, scaleFact);
        speechHalo.rotation.z = t * 0.6;
        speechHalo.scale.setScalar(1 + voiceVol * 0.45);
        speechHaloMat.color.copy(targetCol);
        speechHaloMat.opacity = Math.min(0.85, 0.25 + voiceVol * 0.6);
        speechWave.rotation.z = -t * 0.4;
        speechWave.scale.setScalar(1.15 + ((t * 1.2) % 1) * 0.4 + voiceVol * 0.3);
        speechWaveMat.color.copy(secondaryCol);
        speechWaveMat.opacity = Math.max(0, (1 - ((t * 1.2) % 1)) * (0.2 + voiceVol * 0.5));
      }

      // Update Telemetry History (Sample every frame for smoothness)
      if (currentEnv.d3Stream.active) {
        const hist = telemetryHistory.current;
        // Shift and push new values with slight aesthetic jitter
        const pkts = currentEnv.d3Stream.packetRate;
        const tp = currentEnv.d3Stream.throughputMbps;
        const jt = currentEnv.d3Stream.jitterMs;

        hist.packets.shift(); hist.packets.push(pkts);
        hist.throughput.shift(); hist.throughput.push(tp);
        hist.jitter.shift(); hist.jitter.push(jt);
      }

      // Render 2D Stratum 0 HUD Overlay
      renderHudCanvas(now, currentEnv, combinedFreq, camera, vfsNodes, hoveredNodeId, ledState);

      renderer.render(scene, camera);
      const actualRenderWorkMs=performance.now()-frameStart;
      causalCore.sampleFrame(actualRenderWorkMs); // preserve existing SQE/core diagnostics
      const axsBudget=(axsResourceGovernor as any).observe(actualRenderWorkMs,now);
      targetFrameRate=axsBudget.fpsCap;
      if(axsBudget.particleCount!==activeParticleCount){
        activeParticleCount=axsBudget.particleCount;
        pGeo.setDrawRange(0,activeParticleCount);
      }
      const requestedDpr=isHeadless?1:Math.min(window.devicePixelRatio||1,axsBudget.pixelRatioCap);
      if(requestedDpr!==activePixelRatio){
        activePixelRatio=requestedDpr;
        renderer.setPixelRatio(activePixelRatio);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      cauldronGeometry.dispose();
      cauldronMaterial.dispose();
      markerGeometry.dispose();
      marker4Material.dispose();
      marker5Material.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      octaveGeometry.dispose();
      octaveMaterial.dispose();
      relationGeometry.dispose();
      relationMaterial.dispose();
      pGeo.dispose();
      pMat.dispose();
      speechGeo.dispose();
      speechMat.dispose();
      speechTexture.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      root1Geo.dispose();
      root1Mat.dispose();
      root2Geo.dispose();
      root2Mat.dispose();
      rootTrailGeo.dispose();
      rootTrailMat.dispose();
      spindleTopGeo.dispose();
      spindleBotGeo.dispose();
      spindleMat.dispose();
      spindleRingGeo.dispose();
      spindleRingMat.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      treeTrunkGeo.dispose();
      treeCanopy1Geo.dispose();
      treeCanopy2Geo.dispose();
      treeCanopy3Geo.dispose();
      treeTrunkMat.dispose();
      treeCanopyMat1.dispose();
      treeCanopyMat2.dispose();
      treeCanopyMat3.dispose();
      fireflyGeo.dispose();
      fireflyMat.dispose();
      cityGroundGrid.dispose();
      bldgMatBase.dispose();
      windowMat.dispose();
      spireMat.dispose();
      beaconMat.dispose();
      cityGeos.forEach((g) => g.dispose());
      trafficGeo.dispose();
      trafficMat.dispose();
      speechHaloGeo.dispose();
      speechHaloMat.dispose();
      speechWaveGeo.dispose();
      speechWaveMat.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2D Canvas Holographic Radar & Audio Spectrum HUD (Stratum 0)
  const renderHudCanvas = (
    now: number, 
    env: EnvironmentState, 
    audioBytes: Uint8Array | null, 
    camera: THREE.Camera,
    vfsNodes: VfsStarNode[],
    hoveredNodeId: string | null,
    ledState: ReturnType<typeof computeRgbLedState> | null
  ) => {
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    const activePrimary = ledState ? ledState.primaryHex : env.primaryColor;
    const activeSecondary = ledState ? ledState.secondaryHex : env.secondaryColor;
    const activeTertiary = ledState ? ledState.tertiaryHex : '#fbbf24';

    // 0. Top Edge RGB-LED HSL% Hue Gradient Spectrum Ribbon
    if (ledState) {
      // 1. High-fidelity spectral ribbon across top viewport
      const ribbonGrad = ctx.createLinearGradient(0, 0, w, 0);
      if (ledState.palette && ledState.palette.length > 1) {
        ledState.palette.forEach((col, idx) => {
          ribbonGrad.addColorStop(idx / (ledState.palette.length - 1), col);
        });
      } else {
        ribbonGrad.addColorStop(0, ledState.primaryHex);
        ribbonGrad.addColorStop(0.5, ledState.secondaryHex);
        ribbonGrad.addColorStop(1, ledState.tertiaryHex);
      }

      ctx.fillStyle = ribbonGrad;
      ctx.fillRect(0, 0, w, 3);

      // Ambient glow reflection right beneath ribbon
      const glowGrad = ctx.createLinearGradient(0, 3, 0, 16);
      glowGrad.addColorStop(0, `${activePrimary}44`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 3, w, 13);

      // Live needle indicator pip for current Hue%
      const pipX = (ledState.currentHuePercent / 100) * w;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pipX, 3.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = activePrimary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top-Center Cybernetic RGB-LED HUD Chip
      const chipW = 380;
      const chipH = 22;
      const chipX = cx - chipW / 2;
      const chipY = 8;

      ctx.fillStyle = 'rgba(2, 6, 18, 0.75)';
      ctx.strokeStyle = `${activePrimary}44`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 6);
      ctx.fill();
      ctx.stroke();

      // Chip Text
      ctx.font = 'bold 8.5px "Orbitron", sans-serif';
      ctx.fillStyle = activePrimary;
      ctx.textAlign = 'left';
      ctx.fillText(`RGB-LED: ${ledState.profile.id}`, chipX + 10, chipY + 14);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`HSL: ${ledState.currentHuePercent.toFixed(1)}% (${Math.round(ledState.activeHueDeg)}°)`, chipX + 120, chipY + 14);
      ctx.fillText(`MODE: ${env.rgbLed.mode.toUpperCase()}`, chipX + 230, chipY + 14);

      // Render profile gamut anchor gems inside chip
      if (ledState.palette) {
        ledState.palette.forEach((pCol, i) => {
          ctx.fillStyle = pCol;
          ctx.beginPath();
          ctx.arc(chipX + chipW - 60 + i * 11, chipY + 11, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff55';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      }
    }

    // VFS Node Labels (Project 3D to 2D)
    if (env.topology === 'galaxy_vfs') {
      ctx.textAlign = 'center';
      vfsNodes.forEach((node) => {
        const isHovered = node.path === hoveredNodeId;
        const vector = node.mesh.position.clone();
        vector.project(camera);

        const x = (vector.x + 1) * w / 2;
        const y = -(vector.y - 1) * h / 2;

        const dist = node.mesh.position.distanceTo(camera.position);
        
        // Show label if within proximity OR hovered
        if (vector.z < 1.0 && (dist < 300 || isHovered)) {
          const proximityOpacity = Math.max(0, 1 - dist / 300);
          const opacity = isHovered ? 1.0 : proximityOpacity;
          
          if (opacity > 0.05) {
            const hexOpacity = Math.floor(opacity * 255).toString(16).padStart(2, '0');
            
            // Hover highlight effect
            if (isHovered) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = activePrimary;
            } else {
              ctx.shadowBlur = 0;
            }

            ctx.fillStyle = `${node.type === 'directory' ? activeSecondary : '#ffffff'}${hexOpacity}`;
            const fontSize = isHovered ? 18 : Math.max(10, 16 - dist / 30);
            ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
            ctx.fillText(node.label.toUpperCase(), x, y - 10);
            
            // Show full path on proximity or hover
            if (dist < 80 || isHovered) {
              ctx.font = '10px "JetBrains Mono", monospace';
              ctx.fillStyle = `${activePrimary}${Math.floor(opacity * 180).toString(16).padStart(2, '0')}`;
              ctx.fillText(node.path, x, y + 10);
            }
            
            ctx.shadowBlur = 0;
          }
        }
      });
    }

    // Outer cybernetic radar rings
    ctx.strokeStyle = `${activePrimary}22`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `${activeSecondary}18`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    // Telemetry Oscilloscope HUD (Bottom Left)
    if (env.d3Stream.active) {
      const hist = telemetryHistory.current;
      const boxW = 210;
      const boxH = 120;
      const bx = 24;
      const by = h - boxH - 70; // Positioned above the audio wave

      // Backdrop
      ctx.fillStyle = 'rgba(3, 8, 20, 0.88)';
      ctx.strokeStyle = `${activePrimary}55`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      // Top accent strip on oscilloscope box
      const boxStrip = ctx.createLinearGradient(bx, by, bx + boxW, by);
      boxStrip.addColorStop(0, activePrimary);
      boxStrip.addColorStop(1, activeSecondary);
      ctx.fillStyle = boxStrip;
      ctx.fillRect(bx + 12, by, boxW - 24, 2);

      // Grid lines inside scope
      ctx.strokeStyle = `${activePrimary}11`;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const gy = by + (boxH / 4) * i;
        ctx.moveTo(bx + 5, gy);
        ctx.lineTo(bx + boxW - 5, gy);
      }
      ctx.stroke();

      // Title & Live Metrics
      ctx.font = 'bold 9px "Orbitron", sans-serif';
      ctx.fillStyle = activePrimary;
      ctx.textAlign = 'left';
      ctx.fillText(`TELEMETRY // ${ledState ? ledState.profile.id : 'STD'}`, bx + 12, by + 18);

      const drawScope = (data: number[], color: string, label: string, yOffset: number, maxVal: number, unit: string) => {
        const latest = data[data.length - 1];
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = `${color}cc`;
        ctx.fillText(`${label}: ${latest.toFixed(latest < 10 ? 2 : 0)}${unit}`, bx + 12, by + yOffset);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const step = (boxW - 24) / (data.length - 1);
        data.forEach((val, i) => {
          const x = bx + 12 + i * step;
          const norm = Math.min(1, val / maxVal);
          const y = (by + boxH - 15) - norm * 60; // Scaled to fit in bottom half of box
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      // Draw layered waves with RGB-LED profile colors
      drawScope(hist.packets, activePrimary, 'PKTS', 32, 5000, '/s');
      drawScope(hist.throughput, activeSecondary, 'TRPT', 44, 1000, 'MB');
      drawScope(hist.jitter, activeTertiary, 'JITR', 56, 5, 'ms');
    }

    // Live Audio Spectrum Oscilloscope Wave at bottom
    if (audioBytes && audioBytes.length > 0) {
      const audioGrad = ctx.createLinearGradient(0, h - 50, w, h);
      audioGrad.addColorStop(0, activePrimary);
      audioGrad.addColorStop(0.5, activeSecondary);
      audioGrad.addColorStop(1, activeTertiary);

      ctx.strokeStyle = audioGrad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const sliceWidth = w / audioBytes.length;
      let x = 0;
      for (let i = 0; i < audioBytes.length; i++) {
        const v = audioBytes[i] / 255.0;
        const y = h - 12 - v * 42;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    }

    // Top Right Telemetry Stamp & Sentiment Visual Feedback Layer
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = `${activePrimary}cc`;
    ctx.textAlign = 'right';
    ctx.fillText(`TOPOLOGY: ${env.topology.toUpperCase()}`, w - 24, 28);
    const curSentCfg = SENTIMENT_PALETTES[env.sentiment] || SENTIMENT_PALETTES.analytical;
    ctx.fillStyle = `${activeSecondary}dd`;
    ctx.fillText(`SENTIMENT: ${env.sentiment.toUpperCase()} // ${curSentCfg.label}`, w - 24, 42);
    ctx.fillStyle = '#38bdf8cc';
    ctx.fillText(`HARMONIC BAND: ${curSentCfg.harmonicBand}`, w - 24, 56);
    ctx.fillStyle = '#a7f3d0cc';
    ctx.fillText('QUADRATIC ROOTS (4x²-5x-12=0): x₁≈2.47, x₂≈-1.22', w - 24, 70);
    ctx.fillStyle = '#64748b';
    ctx.fillText(`16K SUPERSAMPLING ACTIVE | G: ${env.gravity.toFixed(2)} | V: ${env.speed.toFixed(2)}x`, w - 24, 84);
    if (env.voiceProfile || env.activeSpeechTone) {
      ctx.fillStyle = '#f472b6cc';
      ctx.fillText(`VOICE SYNTHESIS: ${(env.voiceProfile || 'DEFAULT').toUpperCase()} [${(env.activeSpeechTone || 'NORMAL').toUpperCase()}]`, w - 24, 98);
    }
    if (ledState) {
      ctx.fillStyle = `${activeTertiary}bb`;
      ctx.fillText(`RGB-LED: ${ledState.profile.id} [${ledState.currentHuePercent.toFixed(0)}%]`, w - 24, env.voiceProfile ? 112 : 98);
    }

    // Physical Geolocation Tracker (Top Left)
    if (geoTelemetry.status === 'active') {
      ctx.textAlign = 'left';
      ctx.fillStyle = `${activePrimary}88`;
      ctx.font = 'bold 9px "Orbitron", sans-serif';
      ctx.fillText('TERRASPHERE · BROWSER FIX (NOT ATTESTED)', 24, 28);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffffaa';
      ctx.fillText(`LAT: ${geoTelemetry.lat.toFixed(2)}`, 24, 40);
      ctx.fillText(`LNG: ${geoTelemetry.lng.toFixed(2)}`, 24, 50);
      ctx.fillStyle = `${activeSecondary}aa`;
      ctx.fillText(`ACCURACY: ${geoTelemetry.accuracyMeters?.toFixed(0) || 'unknown'}m · SESSION-ONLY`, 24, 60);
    }

    // Solfeggio indicator
    if (env.solfeggio963) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('963 HZ SOLFEGGIO: ACTIVE', w - 24, ledState ? 92 : 76);
    }

    // AlphaFold Protein Folding HUD telemetry
    if (env.topology === 'protein_fold') {
      const afModel = alphaFoldService.getActiveModel();
      const afBoxW = 280;
      const afBoxH = 76;
      const afX = w - afBoxW - 24;
      const afY = 126;

      ctx.fillStyle = 'rgba(2, 6, 18, 0.88)';
      ctx.strokeStyle = '#10b98166';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(afX, afY, afBoxW, afBoxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 9px "Orbitron", sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`ALPHAFOLD // ${afModel.name.toUpperCase()}`, afX + 10, afY + 16);

      ctx.font = '8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`pLDDT Confidence: ${afModel.plddtConfidence}% (Very High)`, afX + 10, afY + 30);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Residues: ${afModel.residueCount} CA Nodes | Crystalline Flow`, afX + 10, afY + 44);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`α-Helix: ${afModel.secondaryComposition.helixPct}% | β-Sheet: ${afModel.secondaryComposition.sheetPct}% | Loop: ${afModel.secondaryComposition.loopPct}%`, afX + 10, afY + 58);
    }
  };

  const isVideoBackground = envState.youtube?.active && envState.youtube?.displayMode === 'background';
  const show3DLayer = !isVideoBackground || envState.youtube?.blendWith3D;

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden select-none pointer-events-none transition-colors duration-700 ${
        isVideoBackground ? 'bg-transparent' : 'bg-[#02050b]'
      }`}
      onClick={onSceneClick}
    >
      {/* Three.js 3D/4D WebGL Canvas Layer */}
      <div
        ref={mountRef}
        className={`fixed inset-0 w-full h-full z-0 cursor-default transition-opacity duration-700 ${
          show3DLayer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2D Canvas Holographic HUD Overlay */}
      <canvas
        ref={hudCanvasRef}
        className={`fixed inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-700 ${
          show3DLayer ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Photorealistic 3D Earth Overlay (Google Maps Platform) */}
      <EarthNasaOverlay active={envState.topology === 'earth_nasa'} />

      {/* Scanline CRT texture */}
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-35"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
};
