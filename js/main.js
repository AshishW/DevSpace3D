import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { gsap } from 'gsap';

import {
    DESK_SURFACE_Y, NEON_BLUE, NEON_PINK, NEON_CYAN, WARM_WHITE, WALL_HEIGHT, ROOM_WIDTH, ROOM_DEPTH, LIBRARY_DEPTH,
    PC_VIEW_DISTANCE, PC_VIEW_DURATION, PC_VIEW_EASE,
    wallMaterial, librarywallMaterial, darkMaterial, deskMaterial
} from './utils/constants.js';
import { createRugTexture } from './utils/textureGenerator.js';
import { createRobot } from './components/robot.js';
import {
    createDrawerUnit, createPlantPot, createKeyboard, createMouse, createOfficeChair, createCuteOctopus, createSofa,
    createCoffeeTable, createTVConsole, createFloorLamp, createDigitalPiano, createBookshelf
} from './components/furniture.js';
import { createMonitor, createPoster, createEmissiveBox } from './components/room.js';
import { setupCitySceneAndTexture, createFireplace, updateAnimatedTextures } from './fx/animatedTextures.js';
import { setupPostprocessing } from './fx/postprocessing.js';
import { onKeyDown, onKeyUp, onMouseMove, onMouseWheel, updateRobot } from './controls/movement.js';
import { playTvIndex } from './controls/interactions.js';
import { initChecklist } from './ui/checklist.js';

// --- SCENE GLOBALS ---
let scene, camera, renderer, composer, clock;
let tvVideoElement, tvVideoTexture;
let tvLoadingActive = true;
const TV_LOADING_FADE_SPEED = 0.03;

// --- STATE MANAGEMENT ---
window.isCameraAnimating = false;
window.isUsingPC = false;
window.isNearTV = false;
window.isNearPC = false;
window.triggeredDoor = null;

// --- THIRD-PERSON CONTROLS ---
let robot;
let colliders = [];
let interactionTooltipElement, fadeOverlayElement, tvControlsElement, websiteContainer, exitTooltip, websiteFrame, infoElement;
let floor, centerMonitor;

// --- TV STATE ---
const tvPlaylist = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    './assets/videos/BrementownMusiciansUBIwerksComiColor.mp4',
    './assets/videos/PopeyeAliBaba_512kb.mp4',
    './assets/videos/TheCrystalBrawl_512kb.mp4'
];
let tvPlaylistIndex = 0;

// --- ORBITAL CAMERA VARS ---
let cameraTarget = new THREE.Object3D();
window.cameraDistance = 8.0;
window.cameraTheta = Math.PI;
window.cameraPhi = Math.PI / 4;

function init() {
    // --- UI & LOADING ---
    const splashScreen = document.getElementById('splashScreen');
    const loadingBar = document.getElementById('loadingBar');
    infoElement = document.getElementById('info');

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        loadingBar.style.width = (itemsLoaded / itemsTotal) * 100 + '%';
    };
    loadingManager.onLoad = () => {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            infoElement.style.display = 'block';
            initChecklist(); // Initialize the checklist UI
            clock.getDelta();
            animate();
        }, 800);
    };

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const fontLoader = new FontLoader(loadingManager);

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101018);
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    robot = createRobot();
    robot.position.set(0, 0, 5);
    scene.add(robot);
    scene.add(cameraTarget);

    tvVideoElement = document.getElementById('tvVideo');
    tvVideoElement.addEventListener('ended', () => { tvPlaylistIndex = playTvIndex(tvVideoElement, tvPlaylist, tvPlaylistIndex + 1); });
    tvVideoElement.addEventListener('error', () => { tvPlaylistIndex = playTvIndex(tvVideoElement, tvPlaylist, tvPlaylistIndex + 1); });
    tvVideoTexture = new THREE.VideoTexture(tvVideoElement);
    tvVideoTexture.minFilter = THREE.LinearFilter;
    tvVideoTexture.magFilter = THREE.LinearFilter;
    tvVideoTexture.format = THREE.RGBAFormat;
    if (renderer.capabilities.isWebGL2) { tvVideoTexture.colorSpace = THREE.SRGBColorSpace; } else { tvVideoTexture.encoding = THREE.sRGBEncoding; }
    tvVideoTexture.needsUpdate = true;
    tvPlaylistIndex = playTvIndex(tvVideoElement, tvPlaylist, 0);
    renderer.toneMappingExposure = 1.0;

    const playPromise = tvVideoElement.play();
    if (playPromise !== undefined) {
        playPromise.catch((err) => {
            const resume = () => { tvVideoElement.play().catch(() => { }); window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
            window.addEventListener('pointerdown', resume);
            window.addEventListener('keydown', resume);
        });
    }
    
    tvVideoElement.addEventListener('playing', () => { tvLoadingActive = false; });
    tvVideoElement.addEventListener('waiting', () => { 
        const tvLoadingMesh = scene.getObjectByProperty('isTvLoadingMesh', true);
        if (tvLoadingMesh) { tvLoadingMesh.material.opacity = 1.0; tvLoadingMesh.visible = true; tvLoadingActive = true; }
    });
    tvVideoElement.addEventListener('ended', () => { 
        tvLoadingActive = true; 
        const tvLoadingMesh = scene.getObjectByProperty('isTvLoadingMesh', true);
        if (tvLoadingMesh) { tvLoadingMesh.material.opacity = 1.0; tvLoadingMesh.visible = true; }
    });

    let cityTexture = setupCitySceneAndTexture();
    composer = setupPostprocessing(scene, camera, renderer);

    // --- FLOORS ---
    floor = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_WIDTH, 0.2, ROOM_DEPTH + LIBRARY_DEPTH),
        new THREE.MeshStandardMaterial({ visible: false })
    );
    floor.position.set(0, -0.1, (ROOM_DEPTH / 2) - (ROOM_DEPTH / 2) + (LIBRARY_DEPTH / 2));
    scene.add(floor);
    floor.geometry.computeBoundingBox();

    const mainRoomFloor = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_WIDTH, 0.2, ROOM_DEPTH),
        new THREE.MeshStandardMaterial({ color: 0x3d2a1d })
    );
    mainRoomFloor.position.set(0, 0, 0);
    scene.add(mainRoomFloor);

    const libraryVisualFloor = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_WIDTH, 0.2, LIBRARY_DEPTH),
        new THREE.MeshStandardMaterial({ color: 0x3d2a1d })
    );
    libraryVisualFloor.position.set(0, 0, ROOM_DEPTH / 2 + LIBRARY_DEPTH / 2);
    scene.add(libraryVisualFloor);

    // --- WALLS ---
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, WALL_HEIGHT, 0.2), wallMaterial);
    backWall.position.set(0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2);
    scene.add(backWall);
    colliders.push(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_HEIGHT, ROOM_DEPTH), wallMaterial);
    leftWall.position.set(-ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0);
    scene.add(leftWall);
    colliders.push(leftWall);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_HEIGHT, ROOM_DEPTH), wallMaterial);
    rightWall.position.set(ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0);
    scene.add(rightWall);
    colliders.push(rightWall);

    const partitionZ = 0;
    const doorWidth = 3.5;
    const doorHeight = 7;
    const wallSectionWidth1 = (ROOM_WIDTH / 2) - (doorWidth / 2);
    const wallSection1 = new THREE.Mesh(new THREE.BoxGeometry(wallSectionWidth1, WALL_HEIGHT, 0.2), wallMaterial);
    wallSection1.position.set(-ROOM_WIDTH / 2 + wallSectionWidth1 / 2, WALL_HEIGHT / 2, partitionZ);
    scene.add(wallSection1);
    colliders.push(wallSection1);
    const wallSection2 = new THREE.Mesh(new THREE.BoxGeometry(wallSectionWidth1, WALL_HEIGHT, 0.2), wallMaterial);
    wallSection2.position.set(ROOM_WIDTH / 2 - wallSectionWidth1 / 2, WALL_HEIGHT / 2, partitionZ);
    scene.add(wallSection2);
    colliders.push(wallSection2);
    const wallHeader = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, WALL_HEIGHT - doorHeight, 0.2), wallMaterial);
    wallHeader.position.set(0, doorHeight + (WALL_HEIGHT - doorHeight) / 2, partitionZ);
    scene.add(wallHeader);
    colliders.push(wallHeader);
    const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 0.2, doorHeight - 0.1, 0.1), darkMaterial);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3 });
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.15);
    const handle1 = new THREE.Mesh(handleGeometry, handleMaterial);
    const handleX = (doorWidth - 0.2) / 2 - 0.4;
    handle1.position.set(handleX, 0, 0.1);
    door.add(handle1);
    const handle2 = new THREE.Mesh(handleGeometry, handleMaterial);
    handle2.position.set(handleX, 0, -0.1);
    door.add(handle2);
    door.position.set(doorWidth / 2 - 0.1, doorHeight / 2, 0);
    const doorGroup = new THREE.Group();
    doorGroup.add(door);
    doorGroup.position.set(-doorWidth / 2, 0, partitionZ);
    doorGroup.rotation.y = Math.PI / 8;
    scene.add(doorGroup);
    colliders.push(door);

    const libraryPartitionZ = ROOM_DEPTH / 2;
    const libWallSectionWidth = (ROOM_WIDTH / 2) - (doorWidth / 2);
    const libWallSection1 = new THREE.Mesh(new THREE.BoxGeometry(libWallSectionWidth, WALL_HEIGHT, 0.2), librarywallMaterial);
    libWallSection1.position.set(-ROOM_WIDTH / 2 + libWallSectionWidth / 2, WALL_HEIGHT / 2, libraryPartitionZ);
    scene.add(libWallSection1);
    colliders.push(libWallSection1);
    const libWallSection2 = new THREE.Mesh(new THREE.BoxGeometry(libWallSectionWidth, WALL_HEIGHT, 0.2), librarywallMaterial);
    libWallSection2.position.set(ROOM_WIDTH / 2 - libWallSectionWidth / 2, WALL_HEIGHT / 2, libraryPartitionZ);
    scene.add(libWallSection2);
    colliders.push(libWallSection2);
    const libWallHeader = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, WALL_HEIGHT - doorHeight, 0.2), librarywallMaterial);
    libWallHeader.position.set(0, doorHeight + (WALL_HEIGHT - doorHeight) / 2, libraryPartitionZ);
    scene.add(libWallHeader);
    colliders.push(libWallHeader);
    const libraryDoor = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 0.2, doorHeight - 0.1, 0.1), darkMaterial);
    const libHandle1 = new THREE.Mesh(handleGeometry, handleMaterial);
    libHandle1.position.set(handleX, 0, 0.1);
    libraryDoor.add(libHandle1);
    const libHandle2 = new THREE.Mesh(handleGeometry, handleMaterial);
    libHandle2.position.set(handleX, 0, -0.1);
    libraryDoor.add(libHandle2);
    libraryDoor.position.set(doorWidth / 2 - 0.1, doorHeight / 2, 0);
    const libraryDoorGroup = new THREE.Group();
    libraryDoorGroup.add(libraryDoor);
    libraryDoorGroup.position.set(-doorWidth / 2, 0, libraryPartitionZ);
    libraryDoorGroup.rotation.y = Math.PI / 8;
    scene.add(libraryDoorGroup);
    colliders.push(libraryDoor);

    const libraryFarWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, WALL_HEIGHT, 0.2), librarywallMaterial);
    libraryFarWall.position.set(0, WALL_HEIGHT / 2, ROOM_DEPTH / 2 + LIBRARY_DEPTH);
    scene.add(libraryFarWall);
    colliders.push(libraryFarWall);
    const libraryLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_HEIGHT, LIBRARY_DEPTH), librarywallMaterial);
    libraryLeftWall.position.set(-ROOM_WIDTH / 2, WALL_HEIGHT / 2, ROOM_DEPTH / 2 + LIBRARY_DEPTH / 2);
    scene.add(libraryLeftWall);
    colliders.push(libraryLeftWall);
    const libraryRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_HEIGHT, LIBRARY_DEPTH), librarywallMaterial);
    libraryRightWall.position.set(ROOM_WIDTH / 2, WALL_HEIGHT / 2, ROOM_DEPTH / 2 + LIBRARY_DEPTH / 2);
    scene.add(libraryRightWall);
    colliders.push(libraryRightWall);

    // --- FURNITURE ---
    const windowFrame = new THREE.Group();
    windowFrame.add(new THREE.Mesh(new THREE.BoxGeometry(5, 5.5, 0.25), new THREE.MeshStandardMaterial({ color: 0x111111 })));
    const cityView = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5), new THREE.MeshBasicMaterial({ map: cityTexture, side: THREE.DoubleSide }));
    cityView.position.z = 0.13;
    windowFrame.add(cityView);
    windowFrame.position.set(4, 6, -ROOM_DEPTH / 2 + 0.2);
    scene.add(windowFrame);
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 3), deskMaterial);
    deskTop.position.set(0, 3, -13.5); scene.add(deskTop);
    colliders.push(deskTop);
    const drawerUnit1 = createDrawerUnit(new THREE.Vector3(-4.5, 1.6, -13.5)); scene.add(drawerUnit1);
    colliders.push(drawerUnit1);
    const drawerUnit2 = createDrawerUnit(new THREE.Vector3(4.5, 1.6, -13.5)); scene.add(drawerUnit2);
    colliders.push(drawerUnit2);
    const pcPedestal = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 3.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    pcPedestal.position.set(6, 0.2, -13.2); scene.add(pcPedestal);
    const pcCase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 3), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    pcCase.position.set(6, 2.05, -13.2); scene.add(pcCase);
    colliders.push(pcCase);
    centerMonitor = createMonitor(scene, colliders, -0.5, -14.2, 0, true);
    createMonitor(scene, colliders, 3.3, -13.7, -Math.PI / 8);
    createMonitor(scene, colliders, -4.3, -13.7, Math.PI / 8);
    const chair = createOfficeChair(); chair.position.set(-1.5, 0.1, -10.5); chair.rotation.y = Math.PI / 1.1; scene.add(chair);
    colliders.push(chair);
    const octopus = createCuteOctopus(); octopus.position.set(-3.5, DESK_SURFACE_Y, -12.8); octopus.rotation.y = Math.PI / 4; scene.add(octopus);
    const keyboard = createKeyboard(); keyboard.position.set(-0.5, DESK_SURFACE_Y, -12.9); keyboard.rotation.y = 0.05; scene.add(keyboard);
    const mouse = createMouse(); mouse.position.set(1.5, DESK_SURFACE_Y, -12.8); mouse.rotation.y = -Math.PI / 12; scene.add(mouse);
    const officeRug = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ map: createRugTexture('#2a2a3a', 'rgba(0, 191, 255, 0.4)', () => Math.random() > 0.5 ? '1' : '0') }));
    officeRug.rotation.x = -Math.PI / 2; officeRug.position.set(-1, 0.11, -10); scene.add(officeRug);
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1.5), shelfMaterial);
    shelf1.position.set(-6.5, 8.5, -3.5); shelf1.rotation.y = Math.PI / 2; scene.add(shelf1);
    colliders.push(shelf1);
    const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1.5), shelfMaterial);
    shelf2.position.set(-6.5, 7, -3.5); shelf2.rotation.y = Math.PI / 2; scene.add(shelf2);
    colliders.push(shelf2);
    const plant1 = createPlantPot(); plant1.position.set(-6.5, 8.6, -2.5); scene.add(plant1);
    const plant2 = createPlantPot(); plant2.position.set(-6.5, 8.6, -3.5); scene.add(plant2);
    const plant3 = createPlantPot(); plant3.position.set(-6.5, 8.6, -4.5); scene.add(plant3);
    const plant4 = createPlantPot(); plant4.position.set(-6.5, 7.1, -3.5); scene.add(plant4);
    createPoster(scene, 'https://placehold.co/400x600/000000/FFFFFF?text=CODE', { x: -1, y: 7, z: -14.8 }, { w: 2.5, h: 3.5 }, textureLoader);
    createPoster(scene, 'https://placehold.co/400x300/000000/FFFFFF?text=JS', { x: -7.2, y: 4.5, z: -13.5 }, { w: 2.5, h: 1.8 }, textureLoader, Math.PI / 2);
    createPoster(scene, 'https://placehold.co/300x400/000000/FFFFFF?text=UI/UX', { x: -7.2, y: 4.5, z: -10.5 }, { w: 1.8, h: 2.5 }, textureLoader, Math.PI / 2);
    createPoster(scene, 'https://placehold.co/300x400/000000/FFFFFF?text=SYNTH', { x: -4, y: 8, z: -14.8 }, { w: 1.8, h: 2.5 }, textureLoader);
    createPoster(
        scene,
        './assets/certs/30NitesOfCode.png', // <-- your certificate image path
        { x: -7.2, y: 4.5, z: -5 }, // <-- adjust x, y, z for placement
        { w: 3.8, h: 2.2 }, // <-- same size as library certificates
        textureLoader,
        Math.PI/2, // <-- rotate to face into the room
        true
    );
    const sofa = createSofa();
    sofa.position.set(3.5, 0.1, 8);
    sofa.rotation.y = -Math.PI / 2;
    scene.add(sofa);
    colliders.push(sofa);
    const coffeeTable = createCoffeeTable();
    coffeeTable.position.set(-2.0, 0.1, 8);
    coffeeTable.rotation.y = Math.PI / 2;
    scene.add(coffeeTable);
    colliders.push(coffeeTable);
    const tvConsole = createTVConsole(tvVideoTexture);
    tvConsole.position.set(-6.5, 0.6 + 0.1, 8);
    tvConsole.rotation.y = Math.PI / 2;
    scene.add(tvConsole);
    colliders.push(tvConsole);
    const livingRoomLamp = createFloorLamp();
    livingRoomLamp.position.set(-6.5, 0.1, 3);
    scene.add(livingRoomLamp);
    colliders.push(livingRoomLamp);
    const livingRoomRug = new THREE.Mesh(new THREE.PlaneGeometry(10, 12), new THREE.MeshStandardMaterial({ map: createRugTexture('#4a3a3a', 'rgba(255, 0, 255, 0.4)', () => ['<>', '{}', '/>', '[]'][Math.floor(Math.random() * 4)]) }));
    livingRoomRug.rotation.x = -Math.PI / 2; livingRoomRug.position.set(-1, 0.11, 8); scene.add(livingRoomRug);

    const libraryRug = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 12),
        new THREE.MeshStandardMaterial({
            map: createRugTexture('#5a3d2b', 'rgba(210, 180, 140, 0.5)', () => ['~', '*', '+'][Math.floor(Math.random() * 3)])
        })
    );
    libraryRug.rotation.x = -Math.PI / 2;
    libraryRug.position.set(0, 0.11, ROOM_DEPTH / 2 + LIBRARY_DEPTH / 2);
    scene.add(libraryRug);

    const fireplace = createFireplace();
    fireplace.position.set(0, 0.1, ROOM_DEPTH / 2 + LIBRARY_DEPTH - 1.5);
    fireplace.rotation.y = Math.PI;
    scene.add(fireplace);
    colliders.push(fireplace);

    const bookshelf1 = createBookshelf();
    bookshelf1.scale.set(0.6, 1, 1);
    bookshelf1.position.set(-ROOM_WIDTH / 2 + 1.5 / 2, 4.25, ROOM_DEPTH / 2 + 5);
    bookshelf1.rotation.y = Math.PI / 2;
    scene.add(bookshelf1);
    colliders.push(bookshelf1);

    const bookshelf2 = createBookshelf();
    bookshelf2.scale.set(0.6, 1, 1);
    bookshelf2.position.set(-ROOM_WIDTH / 2 + 1.5 / 2, 4.25, ROOM_DEPTH / 2 + 11);
    bookshelf2.rotation.y = Math.PI / 2;
    scene.add(bookshelf2);
    colliders.push(bookshelf2);

    const piano = createDigitalPiano();
    piano.position.set(ROOM_WIDTH / 2 - 1.8 / 2, 0, ROOM_DEPTH / 2 + 8);
    piano.rotation.y = -Math.PI / 2;
    scene.add(piano);
    colliders.push(piano);

    (function addLibraryPhotoFrames() {
        const photoCols = 5;
        const photoRows = 2;
        const frameW = 2.8;
        const frameH = 1.8;
        const frameDepth = 0.1;
        const frameColor = 0x44281d;

        const wallX = ROOM_WIDTH / 2 - 0.11;
        const wallCenterZ = ROOM_DEPTH / 2 + LIBRARY_DEPTH / 2;
        const spacingZ = 3.0;
        const topY = 6.8;
        const spacingY = -2;

        const photoImages = [
            './assets/certs/AI_AGENTS_CREWAI.png',
            './assets/certs/Frameworkvalley_react_codedex.png',
            './assets/certs/frontendmasters_react.png',
            './assets/certs/jts_ztm.jpg',
            './assets/certs/complete_python_ztm.jpg',
            './assets/certs/cwd_ztm.jpg',
            './assets/certs/mci_dsa_ztm.jpg',
            './assets/certs/mecl_hackathon.jpg',
            './assets/certs/js_codedex.png',
            './assets/certs/researchpaper_cert.jpg'
        ];

        const frameGeometry = new THREE.BoxGeometry(frameW, frameH, frameDepth);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: frameColor,
            roughness: 0.8,
            metalness: 0.1
        });

        let count = 0;
        for (let col = 0; col < photoCols; col++) {
            for (let row = 0; row < photoRows; row++) {
                count++;
                const z = wallCenterZ + (col - (photoCols - 1) / 2) * spacingZ;
                const y = topY + row * spacingY;
                const idx = count - 1;
                const imgUrl = (photoImages[idx] && photoImages[idx].length) ? photoImages[idx] : `https://placehold.co/400x300/DDD/000?text=Photo+${count}`;

                const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
                frameMesh.position.set(wallX, y, z);
                frameMesh.rotation.y = -Math.PI / 2;
                scene.add(frameMesh);

                createPoster(
                    scene,
                    imgUrl,
                    { x: wallX - (frameDepth / 2 + 0.01), y: y, z: z },
                    { w: frameW - 0.15, h: frameH - 0.15 },
                    textureLoader,
                    -Math.PI / 2
                );
            }
        }
    })();

    // --- LIGHTING ---
    const libraryLight = new THREE.PointLight(WARM_WHITE, 25, 30, 1.2);
    libraryLight.position.set(0, 7, ROOM_DEPTH / 2 + LIBRARY_DEPTH / 2);
    scene.add(libraryLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.HemisphereLight(NEON_BLUE, NEON_PINK, 1.8));
    const deskLight = new THREE.PointLight(NEON_BLUE, 3, 15, 1.0); deskLight.position.set(-1, 0.5, -12.5); scene.add(deskLight);
    const windowLight = new THREE.PointLight(NEON_PINK, 15, 20, 1); windowLight.position.set(4, 5, -13); scene.add(windowLight);
    const syntaxLight = new THREE.PointLight(NEON_CYAN, 5, 18, 1.2); syntaxLight.position.set(-7, 8, -10); scene.add(syntaxLight);
    createEmissiveBox(scene, NEON_BLUE, 5, new THREE.Vector3(5, 3.1, -13.5), { x: 0.1, y: 0.1, z: 3 });
    createEmissiveBox(scene, NEON_BLUE, 3, new THREE.Vector3(-7.4, 0.2, 0), { x: 0.1, y: 0.1, z: ROOM_DEPTH });
    createEmissiveBox(scene, NEON_BLUE, 3, new THREE.Vector3(0, 0.2, -14.9), { x: ROOM_WIDTH, y: 0.1, z: 0.1 });
    const fanMaterial = new THREE.MeshStandardMaterial({ color: NEON_PINK, emissive: NEON_PINK, emissiveIntensity: 5 });
    for (let i = 0; i < 3; i++) { const fan = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), fanMaterial); fan.position.set(5.25, 1.2 + i * 0.8, -13.2); fan.rotation.y = Math.PI / 2; scene.add(fan); }

    fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json', (font) => {
        const textMaterial = new THREE.MeshStandardMaterial({ color: NEON_CYAN, emissive: NEON_CYAN, emissiveIntensity: 8 });
        const textGeo1 = new TextGeometry('SYNTAX', { font, size: 0.8, height: 0.1 });
        const textMesh1 = new THREE.Mesh(textGeo1, textMaterial);
        textMesh1.position.set(-7.4, 8.5, -10.5); textMesh1.rotation.y = Math.PI / 2; scene.add(textMesh1);
        const textGeo2 = new TextGeometry('ERROR', { font, size: 0.8, height: 0.1 });
        const textMesh2 = new THREE.Mesh(textGeo2, textMaterial);
        textMesh2.position.set(-7.4, 7.5, -10); textMesh2.rotation.y = Math.PI / 2; scene.add(textMesh2);
    });

    // --- GET UI ELEMENTS ---
    interactionTooltipElement = document.getElementById('interactionTooltip');
    fadeOverlayElement = document.getElementById('fadeOverlay');
    tvControlsElement = document.getElementById('tvControls');
    websiteContainer = document.getElementById('websiteContainer');
    websiteFrame = document.getElementById('websiteFrame');
    exitTooltip = document.getElementById('exitTooltip');

    // --- TV CONTROL EVENT LISTENERS ---
    const tvPlayPauseBtn = document.getElementById('tvPlayPause');
    const tvMuteBtn = document.getElementById('tvMute');
    const tvNextBtn = document.getElementById('tvNext');
    const tvPrevBtn = document.getElementById('tvPrev');
    const tvIconPlay = document.getElementById('tvIconPlay');
    const tvIconPause = document.getElementById('tvIconPause');
    const tvIconMute = document.getElementById('tvIconMute');
    const tvIconUnmute = document.getElementById('tvIconUnmute');

    const updatePlayPauseButton = () => {
        tvIconPlay.style.display = tvVideoElement.paused ? 'block' : 'none';
        tvIconPause.style.display = tvVideoElement.paused ? 'none' : 'block';
    };
    const updateMuteButton = () => {
        tvIconMute.style.display = tvVideoElement.muted ? 'block' : 'none';
        tvIconUnmute.style.display = tvVideoElement.muted ? 'none' : 'block';
    };

    const handleTVButtonClick = (event, action) => {
        event.stopPropagation();
        action();
    };

    tvPlayPauseBtn.addEventListener('click', (e) => handleTVButtonClick(e, () => {
        if (tvVideoElement.paused) tvVideoElement.play();
        else tvVideoElement.pause();
    }));
    tvMuteBtn.addEventListener('click', (e) => handleTVButtonClick(e, () => { tvVideoElement.muted = !tvVideoElement.muted; }));
    tvNextBtn.addEventListener('click', (e) => handleTVButtonClick(e, () => { tvPlaylistIndex = playTvIndex(tvVideoElement, tvPlaylist, tvPlaylistIndex + 1); }));
    tvPrevBtn.addEventListener('click', (e) => handleTVButtonClick(e, () => { tvPlaylistIndex = playTvIndex(tvVideoElement, tvPlaylist, tvPlaylistIndex - 1); }));

    tvVideoElement.addEventListener('play', updatePlayPauseButton);
    tvVideoElement.addEventListener('pause', updatePlayPauseButton);
    tvVideoElement.addEventListener('volumechange', updateMuteButton);

    updatePlayPauseButton();
    updateMuteButton();

    // --- GENERAL EVENT LISTENERS ---
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', (e) => onKeyDown(e, interactionTooltipElement, window.isNearPC, window.isNearTV, window.triggeredDoor, robot, fadeOverlayElement, ROOM_DEPTH, camera, centerMonitor, PC_VIEW_DISTANCE, PC_VIEW_DURATION, PC_VIEW_EASE, updateIframePosition, websiteContainer, exitTooltip, websiteFrame, tvControlsElement));
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('wheel', onMouseWheel, false);
    document.body.addEventListener('click', () => {
        if (document.pointerLockElement !== document.body && !window.isUsingPC) {
            document.body.requestPointerLock();
        }
    });
    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href) && !a.target) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    if (window.isUsingPC) {
        updateIframePosition();
    }
}

function updateCamera() {
    cameraTarget.position.copy(robot.position);
    cameraTarget.position.y += 1.5;
    const offset = new THREE.Vector3();
    offset.x = window.cameraDistance * Math.sin(window.cameraPhi) * Math.sin(window.cameraTheta);
    offset.y = window.cameraDistance * Math.cos(window.cameraPhi);
    offset.z = window.cameraDistance * Math.sin(window.cameraPhi) * Math.cos(window.cameraTheta);
    const cameraPosition = cameraTarget.position.clone().add(offset);
    const raycaster = new THREE.Raycaster(cameraTarget.position, cameraPosition.clone().sub(cameraTarget.position).normalize());

    const cameraBlockers = [...colliders, floor];
    const intersects = raycaster.intersectObjects(cameraBlockers, true);
    if (intersects.length > 0 && intersects[0].distance < window.cameraDistance) {
        camera.position.lerp(intersects[0].point, 0.2);
    } else {
        camera.position.lerp(cameraPosition, 0.1);
    }
    camera.lookAt(cameraTarget.position);
}
window.updateCamera = updateCamera;

function updateIframePosition() {
    if (!centerMonitor) return;

    const screen = centerMonitor;
    screen.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(screen);

    const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z)
    ];

    const screenCorners = corners.map(corner => {
        const vector = corner.project(camera);
        return {
            x: (vector.x + 1) / 2 * window.innerWidth,
            y: (-vector.y + 1) / 2 * window.innerHeight
        };
    });

    const [bottomLeft, topRight] = screenCorners;
    const screenPixelWidth = Math.abs(topRight.x - bottomLeft.x);
    const screenPixelHeight = Math.abs(bottomLeft.y - topRight.y);

    const internalWidth = 1280;
    const dynamicInternalHeight = Math.max(1, Math.round(internalWidth * (screenPixelHeight / screenPixelWidth)));
    const scale = screenPixelWidth / internalWidth;

    const centerX = (bottomLeft.x + topRight.x) / 2;
    const centerY = (bottomLeft.y + topRight.y) / 2;

    websiteFrame.style.width = `${internalWidth}px`;
    websiteFrame.style.height = `${dynamicInternalHeight}px`;
    websiteFrame.style.left = `${Math.round(centerX)}px`;
    websiteFrame.style.top = `${Math.round(centerY)}px`;
    websiteFrame.style.transform = `translate(-50%, -50%) scale(${scale})`;
    websiteFrame.style.maxWidth = '';
    websiteFrame.style.maxHeight = '';
}

function animate() {
    requestAnimationFrame(animate);
    if (scene) scene.updateMatrixWorld(true);
    // const delta = clock.getDelta();

    // Cap delta to 0.1s (max 10 fps), prevents physics bugs after tab switch
    let delta = clock.getDelta();
    delta = Math.min(delta, 0.1); // Cap delta to 100ms

    if (!window.isUsingPC && !window.isCameraAnimating && robot) {
        updateRobot(robot, camera, delta, colliders, floor, interactionTooltipElement, tvControlsElement, ROOM_DEPTH);
        updateCamera();
    }

    if (tvVideoElement && tvVideoElement.readyState >= tvVideoElement.HAVE_CURRENT_DATA) { tvVideoTexture.needsUpdate = true; }
    
    const tvLoadingMesh = scene.getObjectByProperty('isTvLoadingMesh', true);
    if (tvLoadingMesh && (tvLoadingActive || tvLoadingMesh.material.opacity > 0)) {
        const ctx = tvLoadingMesh.userData.canvas.getContext('2d');
        const w = tvLoadingMesh.userData.canvas.width;
        const h = tvLoadingMesh.userData.canvas.height;
        const t = performance.now() * 0.001;
        ctx.clearRect(0, 0, w, h);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        const baseA = 16 + Math.floor(8 * Math.sin(t * 2));
        g.addColorStop(0, `rgba(${30 + baseA},${12 + baseA},${40 + baseA},1)`);
        g.addColorStop(1, `rgba(${8 + baseA},${6 + baseA},${18 + baseA},1)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let i = 0; i < 24; i++) {
            const yy = ((i / 24) * h) + (Math.sin(t * 3 + i) * 4);
            ctx.fillRect(0, yy, w, 1.2);
        }
        ctx.globalCompositeOperation = 'source-over';
        const cx = w * 0.5, cy = h * 0.5, r = Math.min(w, h) * 0.12;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(200,240,255,0.95)';
        ctx.lineWidth = Math.max(2, w * 0.008);
        ctx.arc(cx, cy, r, t * 2, t * 2 + Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = `rgba(100,220,255,${0.5 + 0.5 * Math.sin(t * 6)})`;
        ctx.arc(cx, cy, Math.max(2, w * 0.005) + 2 * Math.abs(Math.sin(t * 3)), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(180,220,255,0.9)';
        ctx.font = `${Math.max(12, Math.round(w * 0.03))}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('LOADING • 3D CHANNEL', cx, h - 26);
        tvLoadingMesh.userData.texture.needsUpdate = true;
        if (!tvLoadingActive) {
            tvLoadingMesh.material.opacity = Math.max(0, tvLoadingMesh.material.opacity - TV_LOADING_FADE_SPEED);
            if (tvLoadingMesh.material.opacity <= 0.001) tvLoadingMesh.visible = false;
        }
    }

    updateAnimatedTextures();
    composer.render();
}

(function checkDeviceType() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.body.classList.add('is-mobile');
        return;
    }
    init();
})();