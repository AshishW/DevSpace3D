import * as THREE from 'three';

let cityCanvas, cityCtx, cityTexture, bgCanvas, bgCtx, snowflakes = [];
let fireCanvas, fireCtx, fireTexture;
let fireParticles = [];

export function setupCitySceneAndTexture() {
    cityCanvas = document.createElement('canvas'); cityCtx = cityCanvas.getContext('2d');
    cityCanvas.width = 256; cityCanvas.height = 512;
    bgCanvas = document.createElement('canvas'); bgCtx = bgCanvas.getContext('2d');
    bgCanvas.width = cityCanvas.width; bgCanvas.height = cityCanvas.height;
    const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
    gradient.addColorStop(0, '#1c0c2a'); gradient.addColorStop(1, '#6d1a6d');
    bgCtx.fillStyle = gradient; bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * bgCanvas.width; const y = bgCanvas.height * (0.2 + Math.random() * 0.8);
        const w = 15 + Math.random() * 30; const h = bgCanvas.height - y;
        bgCtx.fillStyle = `rgba(10, 5, 15, ${0.7 + Math.random() * 0.3})`;
        bgCtx.fillRect(x, y, w, h);
        for (let lightX = x + 3; lightX < x + w - 3; lightX += 6) {
            for (let lightY = y + 3; lightY < y + h - 3; lightY += 8) {
                if (Math.random() > 0.75) {
                    bgCtx.fillStyle = `rgba(255, 229, 180, ${0.8 + Math.random() * 0.2})`;
                    bgCtx.fillRect(lightX, lightY, 2, 3);
                }
            }
        }
    }
    for (let i = 0; i < 150; i++) {
        snowflakes.push({ x: Math.random() * cityCanvas.width, y: Math.random() * cityCanvas.height, radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.3 + 0.2 });
    }
    cityTexture = new THREE.CanvasTexture(cityCanvas);
    return cityTexture;
}

export function createFireplace() {
    const group = new THREE.Group();
    const fireplaceMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 2.5), fireplaceMaterial);
    hearth.position.y = 0.25;
    group.add(hearth);
    const back = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.5), fireplaceMaterial);
    back.position.set(0, 2.5, -0.75);
    group.add(back);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1.5), fireplaceMaterial);
    sideL.position.set(-1.75, 2.25, 0);
    group.add(sideL);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1.5), fireplaceMaterial);
    sideR.position.set(1.75, 2.25, 0);
    group.add(sideR);
    const top = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 1.5), fireplaceMaterial);
    top.position.set(0, 4.25, 0);
    group.add(top);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 1.5), fireplaceMaterial);
    chimney.position.set(0, 7.5, -0.25);
    group.add(chimney);

    // Fire
    fireCanvas = document.createElement('canvas');
    fireCanvas.width = 128;
    fireCanvas.height = 128;
    fireCtx = fireCanvas.getContext('2d');
    fireTexture = new THREE.CanvasTexture(fireCanvas);
    const fireMaterial = new THREE.MeshBasicMaterial({
        map: fireTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const firePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fireMaterial);
    firePlane.position.set(0, 1.5, -0.4);
    group.add(firePlane);

    const fireLight = new THREE.PointLight(0xffaa33, 30, 15, 1.5);
    fireLight.position.set(0, 1.5, 0);
    group.add(fireLight);

    for (let i = 0; i < 40; i++) {
        fireParticles.push({
            x: Math.random() * 2 - 1,
            y: Math.random() * -1,
            size: Math.random() * 20 + 5,
            speedY: Math.random() * 0.01 + 0.005,
            opacity: Math.random() * 0.5 + 0.2,
            color: `rgba(${200 + Math.floor(Math.random() * 55)}, ${50 + Math.floor(Math.random() * 100)}, 0, 1)`
        });
    }

    return group;
}

export function updateAnimatedTextures() {
    if (cityCtx) {
        cityCtx.drawImage(bgCanvas, 0, 0); cityCtx.fillStyle = 'rgba(255, 255, 255, 0.9)'; cityCtx.beginPath();
        for (const flake of snowflakes) { flake.y += flake.speed; if (flake.y > cityCanvas.height) { flake.y = -5; flake.x = Math.random() * cityCanvas.width; } cityCtx.moveTo(flake.x, flake.y); cityCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2); }
        cityCtx.fill(); cityTexture.needsUpdate = true;
    }

    if (fireCtx) {
        const w = fireCanvas.width, h = fireCanvas.height;
        fireCtx.globalCompositeOperation = 'source-over';
        fireCtx.fillStyle = 'rgba(0,0,0,0.2)'; // Fading trail
        fireCtx.fillRect(0,0,w,h);
        fireCtx.globalCompositeOperation = 'lighter';

        fireParticles.forEach(p => {
            fireCtx.beginPath();
            const grad = fireCtx.createRadialGradient(
                p.x * w/2 + w/2, h - (p.y * h), 0, 
                p.x * w/2 + w/2, h - (p.y * h), p.size
            );
            const opacity = p.opacity * Math.max(0, 1 - p.y); // Fade out at top
            grad.addColorStop(0, p.color.replace('1)', `${opacity})`));
            grad.addColorStop(1, p.color.replace('1)', '0)'));
            
            fireCtx.fillStyle = grad;
            fireCtx.arc(p.x * w/2 + w/2, h - (p.y * h), p.size, 0, Math.PI * 2);
            fireCtx.fill();

            p.y += p.speedY;
            p.x += (Math.random() - 0.5) * 0.01; // side wobble
            if (p.y > 1) {
                p.y = Math.random() * -0.1;
                p.x = (Math.random() - 0.5) * 0.5;
            }
        });
        fireTexture.needsUpdate = true;
    }
}
