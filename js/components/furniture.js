import * as THREE from 'three';
import { darkMaterial, WARM_WHITE } from '../utils/constants.js';
import { createKeyboardTexture, createBookTexture, createPianoKeysTexture } from '../utils/textureGenerator.js';

export function createDrawerUnit(position) {
    const group = new THREE.Group();
    const casingMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const casing = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2.8), casingMaterial);
    group.add(casing);
    for (let i = 0; i < 3; i++) {
        const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.1), casingMaterial);
        drawerFront.position.set(0, 1 - (i * 1), 1.45);
        group.add(drawerFront);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), handleMaterial);
        handle.position.set(0, 1 - (i * 1), 1.55);
        group.add(handle);
    }
    group.position.copy(position);
    return group;
}

export function createPlantPot() {
    const group = new THREE.Group();
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 });
    const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 12), potMaterial);
    group.add(pot);
    const foliageGroup = new THREE.Group();
    for (let i = 0; i < 15; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), plantMaterial);
        const phi = Math.acos(-1 + (2 * i) / 15);
        const theta = Math.sqrt(15 * Math.PI) * phi;
        leaf.position.set(Math.cos(theta) * Math.sin(phi) * 0.2, Math.sin(theta) * Math.sin(phi) * 0.2, Math.cos(phi) * 0.2);
        foliageGroup.add(leaf);
    }
    foliageGroup.position.y = 0.35;
    group.add(foliageGroup);
    group.scale.set(0.8, 0.8, 0.8);
    return group;
}

export function createKeyboard() {
    const keyboardGroup = new THREE.Group();
    const keyMaterial = new THREE.MeshStandardMaterial({ map: createKeyboardTexture() });
    const bodyMaterial = new THREE.MeshStandardMaterial({color: 0x1a1a1a});
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1), bodyMaterial);
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), keyMaterial);
    keys.position.y = 0.051;
    keys.rotation.x = -Math.PI / 2;
    keyboardGroup.add(body, keys);
    return keyboardGroup;
}

export function createMouse() {
      const mouseMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
      const mouse = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.3, 4, 16), mouseMaterial);
      mouse.rotation.x = -Math.PI / 2;
      mouse.scale.set(1, 1, 0.7);
      return mouse;
}

export function createOfficeChair() {
    const chairGroup = new THREE.Group();
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.6 });
    const baseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), darkMaterial);
    baseHub.position.y = 0.25;
    chairGroup.add(baseHub);
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.2), darkMaterial);
        leg.position.set(Math.cos(angle) * 0.5, 0.2, Math.sin(angle) * 0.5);
        leg.rotation.y = -angle;
        chairGroup.add(leg);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), darkMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(Math.cos(angle) * 1.1, 0.15, Math.sin(angle) * 1.1);
        chairGroup.add(wheel);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16), darkMaterial);
    stem.position.y = 1.0; chairGroup.add(stem);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.5), seatMaterial);
    seat.position.y = 1.8; chairGroup.add(seat);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.2), seatMaterial);
    backrest.position.set(0, 3, 0.7); backrest.rotation.x = -0.1; chairGroup.add(backrest);
    for (let i = -1; i <= 1; i += 2) {
        const armrestGroup = new THREE.Group();
        const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), darkMaterial);
        vertical.position.y = 0.35;
        const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.2), darkMaterial);
        horizontal.position.set(0, 0.7, -0.4);
        armrestGroup.add(vertical, horizontal);
        armrestGroup.position.set(i * 0.8, 1.8, 0);
        chairGroup.add(armrestGroup);
    }
    return chairGroup;
}

export function createCuteOctopus() {
    const octopusGroup = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x77aaff, roughness: 0.2 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 16), bodyMaterial);
    body.position.y = 0.4; octopusGroup.add(body);
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMaterial);
    eye1.position.set(0.2, 0.5, 0.3); octopusGroup.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMaterial);
    eye2.position.set(-0.2, 0.5, 0.3); octopusGroup.add(eye2);
    for(let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.5, 8), bodyMaterial);
        tentacle.position.set(Math.cos(angle) * 0.3, 0.1, Math.sin(angle) * 0.3);
        tentacle.rotation.x = Math.PI / 2.5;
        tentacle.rotation.z = -angle;
        octopusGroup.add(tentacle);
    }
    return octopusGroup;
}

export function createSofa() {
    const sofaGroup = new THREE.Group();
    const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.8 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 3.5), sofaMaterial);
    base.position.y = 0.75;
    sofaGroup.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 1), sofaMaterial);
    back.position.set(0, 2.5, -1.25);
    sofaGroup.add(back);
    const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
        const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.8), cushionMaterial);
        seatCushion.position.set(-2.6 + i * 2.6, 1.7, 0.1);
        sofaGroup.add(seatCushion);
    }
    for (let i = 0; i < 2; i++) {
        const armRest = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3.5), sofaMaterial);
        armRest.position.set(-4.5 + i * 9, 2, 0);
        sofaGroup.add(armRest);
    }
    return sofaGroup;
}

export function createCoffeeTable() {
    const tableGroup = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 2.5), frameMaterial);
    topFrame.position.y = 1;
    tableGroup.add(topFrame);
    for (let x = -1; x <= 1; x += 2) {
        for (let z = -1; z <= 1; z += 2) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), frameMaterial);
            leg.position.set(x * 2.1, 0.5, z * 1.1);
            tableGroup.add(leg);
        }
    }
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeff, transparent: true, opacity: 0.2, roughness: 0.1,
    });
    const glassTop = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.3), glassMaterial);
    glassTop.rotation.x = -Math.PI / 2;
    glassTop.position.y = 1.11;
    tableGroup.add(glassTop);
    return tableGroup;
}

export function createTVConsole(tvVideoTexture) {
    const consoleGroup = new THREE.Group();
    const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 2), consoleMaterial);
    consoleGroup.add(body);
    const tvScreenMaterial = new THREE.MeshBasicMaterial({ map: tvVideoTexture, toneMapped: false });
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.7, 0.2), darkMaterial);
    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(6.3, 3.5, 0.1), tvScreenMaterial);
    tvScreen.position.z = 0.06;
    tvFrame.add(tvScreen);
    tvFrame.position.y = 0.6 + (3.7 / 2);
    consoleGroup.add(tvFrame);
    
    let tvLoadingMesh = createTvLoadingOverlay();
    tvFrame.add(tvLoadingMesh);
    consoleGroup.userData.tvLoadingMesh = tvLoadingMesh;

    return consoleGroup;
}

export function createFloorLamp() {
    const lampGroup = new THREE.Group();
    const lampMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), lampMaterial);
    lampGroup.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5, 16), lampMaterial);
    stem.position.y = 2.5;
    lampGroup.add(stem);
    const shadeMaterial = new THREE.MeshStandardMaterial({ color: WARM_WHITE, roughness: 0.9 });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1, 32, 1, true), shadeMaterial);
    shade.position.y = 5;
    lampGroup.add(shade);
    const light = new THREE.PointLight( 0xe6ddeb, 15, 12, 1.0);
    light.position.y = 5;
    lampGroup.add(light);
    return lampGroup;
}

export function createBookshelf() {
    const group = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2a1d });
    
    const frameBack = new THREE.Mesh(new THREE.BoxGeometry(10, 8.5, 0.2), woodMaterial);
    group.add(frameBack);

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8.5, 1.5), woodMaterial);
    sideL.position.x = -4.9;
    group.add(sideL);

    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8.5, 1.5), woodMaterial);
    sideR.position.x = 4.9;
    group.add(sideR);

    const bookTexture = createBookTexture();
    const bookMaterial = new THREE.MeshStandardMaterial({ map: bookTexture });

    for(let j = 0; j < 5; j++) { // 5 shelves
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.2, 1.5), woodMaterial);
        shelf.position.y = -3.4 + j * 1.7;
        group.add(shelf);
        if (j < 4) { // Books on 4 shelves
            const books = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 1.4), bookMaterial);
            books.position.set(0, -2.6 + j * 1.7, 0.65);
            group.add(books);
        }
    }
    group.position.y = 4.25;
    return group;
}

export function createDigitalPiano() {
    const group = new THREE.Group();
    const pianoMaterial = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 1.8), pianoMaterial);
    body.position.y = 2.4;
    group.add(body);
    
    const keysTexture = createPianoKeysTexture();
    const keysMaterial = new THREE.MeshStandardMaterial({ map: keysTexture });
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.8), keysMaterial);
    keys.position.set(0, 2.81, 0.1);
    keys.rotation.x = -Math.PI / 2;
    group.add(keys);
    
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 1.6), pianoMaterial);
    leg1.position.set(-1.7, 1, 0);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 1.6), pianoMaterial);
    leg2.position.set(1.7, 1, 0);
    group.add(leg2);

    const stool = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.8), pianoMaterial);
    stool.position.set(0, 1.6, 1.8);
    group.add(stool);
    const stoolLeg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.7), pianoMaterial);
    stoolLeg.position.set(0, 0.75, 1.8);
    group.add(stoolLeg);

    return group;
}

function createTvLoadingOverlay(widthMeters = 6.3, heightMeters = 3.5) {
    const aspect = widthMeters / heightMeters;
    const canvasW = 640;
    const canvasH = Math.round(canvasW / aspect);
    const tvLoadingCanvas = document.createElement('canvas');
    tvLoadingCanvas.width = canvasW;
    tvLoadingCanvas.height = canvasH;
    const tvLoadingCtx = tvLoadingCanvas.getContext('2d');
    const tvLoadingTexture = new THREE.CanvasTexture(tvLoadingCanvas);
    tvLoadingTexture.minFilter = THREE.LinearFilter;
    tvLoadingTexture.magFilter = THREE.LinearFilter;
    const mat = new THREE.MeshBasicMaterial({
        map: tvLoadingTexture,
        transparent: true,
        opacity: 1.0,
        depthWrite: false
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(widthMeters, heightMeters), mat);
    plane.position.z = 0.12;
    plane.renderOrder = 999;
    plane.isTvLoadingMesh = true; // Add this flag

    plane.userData.canvas = tvLoadingCanvas;
    plane.userData.context = tvLoadingCtx;
    plane.userData.texture = tvLoadingTexture;

    return plane;
}
