import * as THREE from 'three';
import { darkMaterial, DESK_SURFACE_Y } from '../utils/constants.js';
import { createCodeScreenMaterial } from '../utils/textureGenerator.js';

export function createMonitor(scene, colliders, x, z, rotationY, isCenter = false) {
    const monitorGroup = new THREE.Group();
    const monitorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.1, 0.15), darkMaterial);
    monitorGroup.add(monitorFrame);
    
    const monitorScreen = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 0.1), createCodeScreenMaterial());
    monitorScreen.position.z = 0.03;
    monitorGroup.add(monitorScreen);
    
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 16), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    stand.position.y = -1.3;
    monitorGroup.add(stand);
    monitorGroup.position.set(x, DESK_SURFACE_Y + 1.05, z);
    monitorGroup.rotation.y = rotationY;
    scene.add(monitorGroup);
    colliders.push(monitorGroup);
    
    if (isCenter) {
        return monitorScreen;
    }
    return null;
}

export function createPoster(scene, imageUrl, position, size, textureLoader, rotationY = 0, useBasicMaterial = false) {
    textureLoader.load(imageUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        if (useBasicMaterial) {
            // Create a group for the poster with a border
            const frameGroup = new THREE.Group();

            // Create the border
            const borderSize = 0.1;
            const frameGeometry = new THREE.PlaneGeometry(size.w + borderSize, size.h + borderSize);
            const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frameGroup.add(frame);

            // Create the poster image, slightly in front of the border
            const posterMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, color: 0x888888 });
            const poster = new THREE.Mesh(new THREE.PlaneGeometry(size.w, size.h), posterMaterial);
            poster.position.z = 0.01; // Position poster in front of the frame to avoid z-fighting
            frameGroup.add(poster);

            frameGroup.position.copy(position);
            frameGroup.rotation.y = rotationY;
            scene.add(frameGroup);
        } else {
            const posterMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
            const poster = new THREE.Mesh(new THREE.PlaneGeometry(size.w, size.h), posterMaterial);
            poster.position.set(position.x, position.y, position.z);
            poster.rotation.y = rotationY;
            scene.add(poster);
        }
    });
}

export function createEmissiveBox(scene, color, intensity, position, size) {
    const material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: intensity });
    const box = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
    box.position.copy(position);
    scene.add(box);
}
