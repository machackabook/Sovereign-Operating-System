import React, { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface DroneCameraControllerProps {
  camera: THREE.Camera;
  domElement: HTMLElement;
  active: boolean;
  speed: number;
  targetPosition?: THREE.Vector3;
  viewpoint?: 'default' | 'top-down' | 'macro' | 'full';
  soundEnabled?: boolean;
}

/**
 * 🚁 DRONE CAMERA CONTROLLER
 * High-fidelity orbital navigation for the Million-Particle Face Manifold.
 * Uses Three.js OrbitControls with enhanced auto-navigating logic.
 */
export const DroneCameraController: React.FC<DroneCameraControllerProps> = ({ 
  camera, 
  domElement, 
  active,
  speed,
  targetPosition = new THREE.Vector3(0, 0, -40),
  viewpoint = 'default',
  soundEnabled = false
}) => {
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  // 1. Initialization: Create OrbitControls only once when active
  useEffect(() => {
    if (!active) {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      // Clean up audio
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      return;
    }

    // Initialize Web Audio (only if enabled)
    let ctx: AudioContext | null = null;
    if (soundEnabled) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.Q.setValueAtTime(10, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime); // Start silent

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      filterRef.current = filter;
    }

    const controls = new OrbitControls(camera, domElement);
    controls.autoRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 1000;
    controls.target.copy(targetPosition);
    
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;
    
    controlsRef.current = controls;

    let animId: number;
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
        
        // Modulate Audio based on camera state
        if (soundEnabled && audioCtxRef.current && oscillatorRef.current && gainNodeRef.current && filterRef.current) {
          const dist = camera.position.distanceTo(targetPosition);
          const normalizedDist = Math.max(0, 1 - (dist - 30) / 300); // 1.0 at center, 0.0 at 330 units
          
          // Speed modulates base frequency
          const baseFreq = 40 + (speed * 20);
          oscillatorRef.current.frequency.setTargetAtTime(baseFreq, audioCtxRef.current.currentTime, 0.1);
          
          // Proximity modulates volume and filter resonance
          const targetVolume = active ? normalizedDist * 0.12 : 0;
          gainNodeRef.current.gain.setTargetAtTime(targetVolume, audioCtxRef.current.currentTime, 0.1);
          
          const targetFilterFreq = 200 + (normalizedDist * 2000) + (speed * 400);
          filterRef.current.frequency.setTargetAtTime(targetFilterFreq, audioCtxRef.current.currentTime, 0.1);
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      controls.dispose();
      controlsRef.current = null;
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [active, camera, domElement, soundEnabled]);

  // 2. Reactive Updates: Sync properties without re-initialization
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 2.0 * speed;
    }
  }, [speed]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetPosition);
    }
  }, [targetPosition]);

  // 3. Viewpoint Presets
  useEffect(() => {
    if (!controlsRef.current || !active) return;

    const controls = controlsRef.current;
    
    switch (viewpoint) {
      case 'top-down':
        camera.position.set(0, 300, -40);
        controls.target.set(0, 0, -40);
        break;
      case 'macro':
        camera.position.set(0, 0, 40);
        controls.target.set(0, 0, -40);
        break;
      case 'full':
        camera.position.set(0, 100, 400);
        controls.target.set(0, 0, -40);
        break;
      case 'default':
      default:
        camera.position.set(0, 0, 140);
        controls.target.set(0, 0, -40);
        break;
    }
    controls.update();
  }, [viewpoint, active, camera]);

  return null;
};
