import * as THREE from 'three';
import { gsap } from 'gsap';

let isTeleporting = false;

export function startTeleport(robot, fadeOverlayElement, doorType, ROOM_DEPTH) {
    if (isTeleporting) return;
    isTeleporting = true;
    fadeOverlayElement.style.opacity = '1';
    
    setTimeout(() => {
        if (doorType === 'office') {
            const isInLivingRoom = robot.position.z > 0;
            if (isInLivingRoom) {
                robot.position.set(0, 0, -3); 
                robot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); 
            } else {
                robot.position.set(0, 0, 3);
                robot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
            }
        } else if (doorType === 'library') {
            const isInLibrary = robot.position.z > ROOM_DEPTH / 2;
            if (isInLibrary) {
                robot.position.set(0, 0, ROOM_DEPTH / 2 - 3);
                robot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
            } else { // Is in Living Room
                robot.position.set(0, 0, ROOM_DEPTH / 2 + 3);
                robot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
            }
        }
        
        setTimeout(() => {
            fadeOverlayElement.style.opacity = '0';
            setTimeout(() => { isTeleporting = false; }, 500);
        }, 100);
    }, 500);
}

export function enterPCView(camera, centerMonitor, PC_VIEW_DISTANCE, PC_VIEW_DURATION, PC_VIEW_EASE, updateIframePosition, websiteContainer, exitTooltip, websiteFrame) {
    if (window.isCameraAnimating) return;
    window.isCameraAnimating = true;
    window.isUsingPC = true;
    document.exitPointerLock();

    const monitorWorldPos = new THREE.Vector3();
    centerMonitor.getWorldPosition(monitorWorldPos);

    const screenDir = new THREE.Vector3();
    centerMonitor.getWorldDirection(screenDir).normalize();

    const targetPos = monitorWorldPos.clone().add(screenDir.multiplyScalar(PC_VIEW_DISTANCE));

    gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: PC_VIEW_DURATION,
        ease: PC_VIEW_EASE,
    });

    const tempTarget = new THREE.Vector3();
    gsap.to(tempTarget, {
        x: monitorWorldPos.x,
        y: monitorWorldPos.y,
        z: monitorWorldPos.z,
        duration: PC_VIEW_DURATION,
        ease: PC_VIEW_EASE,
        onUpdate: () => {
            camera.lookAt(tempTarget);
            updateIframePosition();
        },
        onComplete: () => {
            window.isCameraAnimating = false;
            updateIframePosition();
            websiteContainer.style.display = 'block';
            exitTooltip.style.display = 'block';
            websiteFrame.src = "https://ashishwaikar.netlify.app";
        }
    });
}

export function exitPCView(PC_VIEW_DURATION, PC_VIEW_EASE, updateCamera, websiteContainer, exitTooltip, websiteFrame) {
    if (window.isCameraAnimating) return;
    window.isCameraAnimating = true;

    websiteContainer.style.display = 'none';
    exitTooltip.style.display = 'none';
    websiteFrame.src = "about:blank";

    gsap.to({}, {
        duration: PC_VIEW_DURATION,
        ease: PC_VIEW_EASE,
        onUpdate: () => updateCamera(),
        onComplete: () => {
            window.isCameraAnimating = false;
            window.isUsingPC = false;
        }
    });
}

export function toggleTVControls(tvControlsElement) {
    const isVisible = tvControlsElement.style.display === 'flex';
    if (isVisible) {
        tvControlsElement.style.display = 'none';
        document.body.requestPointerLock();
    } else {
        tvControlsElement.style.display = 'flex';
        document.exitPointerLock();
    }
}

export function playTvIndex(tvVideoElement, tvPlaylist, tvPlaylistIndex) {
    let newIndex = ((tvPlaylistIndex % tvPlaylist.length) + tvPlaylist.length) % tvPlaylist.length;
    tvVideoElement.src = tvPlaylist[newIndex];
    tvVideoElement.load();
    const p = tvVideoElement.play();
    if (p !== undefined) {
        p.catch(() => {
            const resume = () => { tvVideoElement.play().catch(()=>{}); window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
            window.addEventListener('pointerdown', resume);
            window.addEventListener('keydown', resume);
        });
    }
    return newIndex;
}
