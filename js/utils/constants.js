import * as THREE from 'three';

// --- CONSTANTS ---
export const DESK_SURFACE_Y = 3.25;
export const NEON_BLUE = 0x00bfff;
export const NEON_PINK = 0xff00ff;
export const NEON_CYAN = 0x00ffff;
export const WARM_WHITE = 0xfff5e1;
export const WALL_HEIGHT = 10;
export const ROOM_WIDTH = 15;
export const ROOM_DEPTH = 30;
export const LIBRARY_DEPTH = 20;

// PC view (zoom) configuration
export const PC_VIEW_DISTANCE = 2.7;
export const PC_VIEW_DURATION = 1.5;
export const PC_VIEW_EASE = "power2.inOut";

// --- MATERIALS ---
export const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.95 });
export const librarywallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5d50, roughness: 0.95 });
export const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.4 });
export const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
export const darkPartMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
export const accentGlowMaterial = new THREE.MeshStandardMaterial({ color: NEON_CYAN, emissive: NEON_CYAN, emissiveIntensity: 10 });
