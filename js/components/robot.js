import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { darkPartMaterial, accentGlowMaterial } from '../utils/constants.js';
import { createCircuitTexture } from '../utils/textureGenerator.js';

function createArm() {
    const armGroup = new THREE.Group();
    
    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.1, 4, 8), darkPartMaterial);
    upperArm.position.y = -0.35;

    const glowDetail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), accentGlowMaterial);
    glowDetail1.position.y = -0.25;
    glowDetail1.position.z = 0.01;
    upperArm.add(glowDetail1);

    const lowerArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.2, 4, 8), darkPartMaterial);
    lowerArm.position.y = -0.9;

    const glowDetail2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), accentGlowMaterial);
    glowDetail2.position.y = -0.25;
    glowDetail2.position.z = 0.01;
    lowerArm.add(glowDetail2);

    // Hand
    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), darkPartMaterial);
    const finger1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), darkPartMaterial);
    finger1.position.set(0.06, -0.05, 0);
    finger1.rotation.z = 0.3;
    const finger2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), darkPartMaterial);
    finger2.position.set(-0.06, -0.05, 0);
    finger2.rotation.z = -0.3;
    hand.add(palm, finger1, finger2);
    hand.position.y = -1.4;

    armGroup.add(upperArm, lowerArm, hand);
    return armGroup;
}

function createRoboWheel() {
    const wheelGroup = new THREE.Group();

    // --- Materials for the wheel parts ---
    const tireMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, // Very dark grey, like rubber
        roughness: 0.9,
        metalness: 0.1
    });

    const hubMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777, // Grey metal
        roughness: 0.3,
        metalness: 0.9
    });

    // We can reuse the eye's glowing material for consistency
    const accentGlowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        emissive: 0x00ffff, 
        emissiveIntensity: 8 
    });

    // --- Create the wheel parts ---

    // 1. The outer tire
    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.35, 32), // radius, radius, width of tire, segments
        tireMaterial
    );
    wheelGroup.add(tire);

    // 2. The inner metallic hub
    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16), // Slightly wider than the tire to pop out
        hubMaterial
    );
    wheelGroup.add(hub);

    // 3. The glowing accent ring on the hub
    const glowRing = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.15, 16), // innerRadius, outerRadius, segments
        accentGlowMaterial
    );
    // Position the ring on the outer surface of the hub
    glowRing.position.z = 0.205; 
    wheelGroup.add(glowRing);

    return wheelGroup;
}

export function createRobot() {
    const robotGroup = new THREE.Group();
    const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 10 });

    
    const circuitTexture = createCircuitTexture();
    circuitTexture.wrapS = THREE.RepeatWrapping;
    circuitTexture.wrapT = THREE.RepeatWrapping;
    circuitTexture.repeat.set(1, 1);

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f0f0,
        metalness: 0.8,
        roughness: 0.3,
        map: circuitTexture,
        bumpMap: circuitTexture,
        bumpScale: 0.02
    });
    const body = new THREE.Mesh(
        new RoundedBoxGeometry(1.15, 1.8, 0.9, 4, 0.3),
        bodyMaterial
    );
    body.position.y = 1.1;
    robotGroup.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 16), bodyMaterial);
    head.position.y = 2.2;
    robotGroup.add(head);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8), eyeMaterial);
    eye.position.set(0, 2.3, 0.3);
    robotGroup.add(eye);
    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), accentMaterial);
    antennaStem.position.y = 2.6;
    robotGroup.add(antennaStem);
    const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMaterial);
    antennaBall.position.y = 2.85;
    robotGroup.add(antennaBall);
    
    const wheelL = createRoboWheel();
    wheelL.rotation.z = Math.PI / 2;
    wheelL.position.set(0.65, 0.5, 0);
    robotGroup.add(wheelL);

    const wheelR = createRoboWheel();
    wheelR.rotation.z = Math.PI / 2;
    wheelR.position.set(-0.65, 0.5, 0);
    robotGroup.add(wheelR);

    const armL = createArm();
    armL.position.set(0.56, 2.1, 0);
    armL.rotation.z = 0.3;
    robotGroup.add(armL);

    const armR = createArm();
    armR.position.set(-0.56, 2.1, 0);
    armR.rotation.z = -0.3;
    robotGroup.add(armR);

    const collisionBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.0, 1.2),
        new THREE.MeshBasicMaterial({ visible: false, wireframe: true })
    );
    collisionBox.position.y = 2.0 / 2;
    robotGroup.add(collisionBox);
    robotGroup.userData.collisionBox = collisionBox;
    return robotGroup;
}
