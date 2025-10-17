import * as THREE from 'three';

export function createCircuitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // A dark metallic base color
    ctx.fillStyle = '#777788';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bright circuit lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;

    // Draw a random grid of lines to simulate circuits
    const gridSize = 16;
    for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (Math.random() > 0.5) {
                ctx.lineTo(x + gridSize, y);
            } else {
                ctx.lineTo(x, y + gridSize);
            }
            if (Math.random() > 0.8) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() > 0.5 ? gridSize : -gridSize), y + (Math.random() > 0.5 ? gridSize : -gridSize));
            }
            ctx.stroke();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

export function createKeyboardTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#1e1e1e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4a4a4a'; ctx.font = '10px sans-serif';
    const keyWidth = 18, keyHeight = 18, keyGap = 4, top_offset = 10, left_offset = 10;
    const rows = ["QWERTYUIOP", "ASDFGHJKL;", "ZXCVBNM<>"];
    for(let r=0; r < rows.length; r++) {
        for (let i = 0; i < rows[r].length; i++) {
            const x = left_offset + i * (keyWidth + keyGap) + (r * 10); const y = top_offset + r * (keyHeight + keyGap);
            ctx.fillRect(x, y, keyWidth, keyHeight); ctx.fillStyle = '#dddddd'; ctx.fillText(rows[r][i], x + 5, y + 13); ctx.fillStyle = '#4a4a4a';
        }
    }
    ctx.fillRect(left_offset + 2 * (keyWidth + keyGap) + 20, top_offset + 3 * (keyHeight + keyGap), 120, keyHeight);
    return new THREE.CanvasTexture(canvas);
}

export function createCodeScreenMaterial() {
    // Use a higher-resolution canvas that matches 1280x695
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Scale helper (original code used 512x256 base)
    const scale = canvas.width / 512;

    // Background / UI blocks
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#252526';
    ctx.fillRect(0, 0, Math.round(80 * scale), canvas.height);
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(Math.round(80 * scale), 0, canvas.width - Math.round(80 * scale), Math.round(30 * scale));

    // Header text
    ctx.fillStyle = '#cccccc';
    ctx.font = `${Math.max(12, Math.round(14 * scale))}px sans-serif`;
    ctx.fillText('scene.js', Math.round(95 * scale), Math.round(20 * scale));

    // Example code block (scaled)
    const code = [
        "// ... existing code ...",
        "function animate() {",
        "  requestAnimationFrame(animate);",
        "  updatePlayer(delta);",
        "  composer.render();",
        "}",
        "",
        "init();",
        "animate();"
    ];

    ctx.font = `${Math.max(12, Math.round(16 * scale))}px monospace`;
    for (let i = 0; i < code.length; i++) {
        const y = Math.round((55 + i * 20) * scale);
        ctx.fillStyle = '#858585';
        ctx.fillText((i + 1).toString().padStart(2, ' '), Math.round(90 * scale), y);
        if (code[i].includes('function') || code[i].includes('const')) {
            ctx.fillStyle = '#569cd6';
        } else if (code[i].startsWith('//')) {
            ctx.fillStyle = '#6a9955';
        } else {
            ctx.fillStyle = '#d4d4d4';
        }
        ctx.fillText(code[i], Math.round(130 * scale), y);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // Use the same canvas as emissive map for glow
    return new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.8,
        toneMapped: false
    });
}

export function createRugTexture(color1, color2, text) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = color1; ctx.fillRect(0, 0, 256, 256);
    ctx.font = '8px monospace'; ctx.fillStyle = color2;
    for(let i=0; i < 256; i+=10) {
        for(let j=0; j < 256; j+=10) {
            ctx.fillText(text(), i, j);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

export function createBookTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let x = 0;
    while(x < canvas.width) {
        const bookWidth = Math.random() * 10 + 8;
        const r = 50 + Math.floor(Math.random() * 100);
        const g = 50 + Math.floor(Math.random() * 80);
        const b = 50 + Math.floor(Math.random() * 120);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, 0, bookWidth - 1, canvas.height);
        x += bookWidth;
    }
    return new THREE.CanvasTexture(canvas);
}

export function createPianoKeysTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    const keyWidth = 512 / 52; // 52 white keys
    for(let i = 0; i < 52; i++) {
        ctx.fillRect(i * keyWidth - 1, 0, 2, canvas.height);
    }
    // crude black keys
    for(let i = 0; i < 52; i++) {
        if (i % 7 !== 2 && i % 7 !== 6) {
            ctx.fillRect((i + 0.6) * keyWidth, 0, keyWidth * 0.8, canvas.height * 0.6);
        }
    }
    return new THREE.CanvasTexture(canvas);
}
