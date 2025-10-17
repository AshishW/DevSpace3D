import * as THREE from 'three';
import { startTeleport, enterPCView, toggleTVControls, exitPCView } from './interactions.js';

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let playerVelocity = new THREE.Vector3();
const playerSpeed = 8.0;
const robotHeight = 2.0;
const gravity = 30.0;
let playerOnFloor = false;

export function onKeyDown(event, interactionTooltipElement, isNearPC, isNearTV, triggeredDoor, robot, fadeOverlayElement, ROOM_DEPTH, camera, centerMonitor, PC_VIEW_DISTANCE, PC_VIEW_DURATION, PC_VIEW_EASE, updateIframePosition, websiteContainer, exitTooltip, websiteFrame, tvControlsElement) {
    if (window.isCameraAnimating) return;

    if (window.isUsingPC) {
        if (event.code === 'Escape') {
            exitPCView(PC_VIEW_DURATION, PC_VIEW_EASE, window.updateCamera, websiteContainer, exitTooltip, websiteFrame);
        }
        return;
    }

    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Enter':
            if (interactionTooltipElement.style.opacity === '1') {
                if (isNearPC) {
                    enterPCView(camera, centerMonitor, PC_VIEW_DISTANCE, PC_VIEW_DURATION, PC_VIEW_EASE, updateIframePosition, websiteContainer, exitTooltip, websiteFrame);
                } else if (isNearTV) {
                    toggleTVControls(tvControlsElement);
                } else if (triggeredDoor) { 
                    startTeleport(robot, fadeOverlayElement, triggeredDoor, ROOM_DEPTH);
                }
            }
            break;
    }
}
export function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
}
export function onMouseMove(event) {
    if (document.pointerLockElement === document.body) {
        window.cameraTheta -= event.movementX * 0.002;
        window.cameraPhi -= event.movementY * 0.002;
        window.cameraPhi = Math.max(0.1, Math.min(Math.PI / 2.2, window.cameraPhi));
    }
}
export function onMouseWheel(event) {
    if(window.isUsingPC) return;
    window.cameraDistance += event.deltaY * 0.01;
    window.cameraDistance = Math.max(4, Math.min(15, window.cameraDistance));
}

function handleCollisions(robot, delta, moveVector, colliders, floor) {
    const robotCollider = robot.userData.collisionBox;
    robotCollider.updateWorldMatrix(true, false);
    const robotBox = new THREE.Box3().setFromObject(robotCollider);
    if (playerOnFloor) { playerVelocity.y = Math.max(0, playerVelocity.y); }
    const verticalCheckPos = robotBox.clone().translate(new THREE.Vector3(0, playerVelocity.y * delta, 0));
    playerOnFloor = false;
    let verticalCollision = false;
    const floorBox = new THREE.Box3().setFromObject(floor);
    if (verticalCheckPos.intersectsBox(floorBox)) {
        if (playerVelocity.y < 0) {
            playerVelocity.y = 0;
            robot.position.y = floorBox.max.y;
            playerOnFloor = true;
        }
        verticalCollision = true;
    }
    if (!verticalCollision) { robot.position.y += playerVelocity.y * delta; }
    robotCollider.updateWorldMatrix(true, false);
    const currentRobotBox = new THREE.Box3().setFromObject(robotCollider);
    const tempRobotBoxX = currentRobotBox.clone().translate(new THREE.Vector3(moveVector.x, 0, 0));
    const tempRobotBoxZ = currentRobotBox.clone().translate(new THREE.Vector3(0, 0, moveVector.z));
    let collisionX = false, collisionZ = false;
    for(const collider of colliders) {
        const colliderBox = new THREE.Box3().setFromObject(collider);
        if(tempRobotBoxX.intersectsBox(colliderBox)) collisionX = true;
        if(tempRobotBoxZ.intersectsBox(colliderBox)) collisionZ = true;
    }
    if(!collisionX) robot.position.x += moveVector.x;
    if(!collisionZ) robot.position.z += moveVector.z;
}

export function updateRobot(robot, camera, delta, colliders, floor, interactionTooltipElement, tvControlsElement, ROOM_DEPTH) {
    if (!playerOnFloor) { playerVelocity.y -= gravity * delta; }
    
    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));
    
    const moveDirection = new THREE.Vector3();
    if (moveForward) moveDirection.add(cameraForward);
    if (moveBackward) moveDirection.sub(cameraForward);
    if (moveLeft) moveDirection.sub(cameraRight); 
    if (moveRight) moveDirection.add(cameraRight);
    
    if (moveDirection.lengthSq() > 0.001) {
        moveDirection.normalize();
        const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
        const targetQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        robot.quaternion.slerp(targetQuaternion, 0.2);
    }

    const moveVector = moveDirection.clone().multiplyScalar(playerSpeed * delta);
    handleCollisions(robot, delta, moveVector, colliders, floor);

    // --- INTERACTION LOGIC ---
    const pos = robot.position;
    const doorTriggerZ = 4.0; 
    const doorTriggerX = 2.5;
    const isNearOfficeDoor = Math.abs(pos.z) < doorTriggerZ && Math.abs(pos.x) < doorTriggerX;

    const libraryDoorTriggerZ = ROOM_DEPTH / 2;
    const isNearLibraryDoor = Math.abs(pos.z - libraryDoorTriggerZ) < doorTriggerZ && Math.abs(pos.x) < doorTriggerX;

    const tvTriggerMin = new THREE.Vector3(-9, 0, 5);
    const tvTriggerMax = new THREE.Vector3(-4, 5, 11);
    const tvTriggerBox = new THREE.Box3(tvTriggerMin, tvTriggerMax);
    window.isNearTV = tvTriggerBox.containsPoint(pos);

    const pcTriggerMin = new THREE.Vector3(-4, 0, -12);
    const pcTriggerMax = new THREE.Vector3(2, 5, -8);
    const pcTriggerBox = new THREE.Box3(pcTriggerMin, pcTriggerMax);
    window.isNearPC = pcTriggerBox.containsPoint(pos);
    
    window.triggeredDoor = null;

    if (window.isCameraAnimating) return;

    if (window.isNearPC) {
        interactionTooltipElement.textContent = `Press [Enter] to use PC`;
        interactionTooltipElement.style.opacity = '1';
    } else if (window.isNearTV) {
        interactionTooltipElement.textContent = `Press [Enter] to use TV`;
        interactionTooltipElement.style.opacity = '1';
    } else if (isNearOfficeDoor) {
        window.triggeredDoor = 'office';
        const isInLivingRoom = pos.z > 0;
        const newTooltipText = isInLivingRoom ? "Enter Office" : "Enter Living Room";
        interactionTooltipElement.textContent = `Press [Enter] to ${newTooltipText}`;
        interactionTooltipElement.style.opacity = '1';
    } else if (isNearLibraryDoor) {
        window.triggeredDoor = 'library';
        const isInLibrary = pos.z > libraryDoorTriggerZ;
        const newTooltipText = isInLibrary ? "Enter Living Room" : "Enter Library";
        interactionTooltipElement.textContent = `Press [Enter] to ${newTooltipText}`;
        interactionTooltipElement.style.opacity = '1';
    } else {
        interactionTooltipElement.style.opacity = '0';
    }

    if (!window.isNearTV && tvControlsElement.style.display === 'flex') {
        tvControlsElement.style.display = 'none';
    }
}
