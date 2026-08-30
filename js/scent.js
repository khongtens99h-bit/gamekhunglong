/* js/scent.js - Scent Tracking System (The Isle Scent Mechanic) */

class ScentSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.scentGroup = new THREE.Group();
    this.scene.add(this.scentGroup);

    this.particleTexture = this.createParticleTexture();
  }

  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  toggle(activeState) {
    this.active = activeState;
    const overlay = document.getElementById('scent-overlay');
    if (overlay) {
      if (this.active) overlay.classList.add('active');
      else overlay.classList.remove('active');
    }
    if (window.soundEngine) {
      window.soundEngine.playScentToggle(this.active);
    }
  }

  update(playerPos, waterSources, foodBushes, meatCarcasses, aiDinos) {
    // Clear old scent particles
    while (this.scentGroup.children.length > 0) {
      const child = this.scentGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
    }

    if (!this.active) return;

    // 1. Water Sources (Blue Scent Pillars)
    waterSources.forEach(w => {
      const dist = playerPos.distanceTo(w.position);
      if (dist < 150) {
        this.createScentPillar(w.position, 0x3498db, 'NƯỚC (WATER)');
      }
    });

    // 2. Food Bushes / Plants (Green Scent Particles)
    foodBushes.forEach(b => {
      const dist = playerPos.distanceTo(b.position);
      if (dist < 80) {
        this.createScentPillar(b.position, 0x2ecc71, 'THỨC ĂN (PLANTS)');
      }
    });

    // 3. Meat Carcasses (Red Scent)
    meatCarcasses.forEach(m => {
      const dist = playerPos.distanceTo(m.position);
      if (dist < 100) {
        this.createScentPillar(m.position, 0xe74c3c, 'THỊT (MEAT)');
      }
    });

    // 4. AI Dinosaurs (Yellow/Purple Scent Trail)
    aiDinos.forEach(ai => {
      const dist = playerPos.distanceTo(ai.mesh.position);
      if (dist < 120) {
        this.createScentPillar(ai.mesh.position, 0xf39c12, `KHỦNG LONG (${ai.type.toUpperCase()})`);
      }
    });
  }

  createScentPillar(pos, colorHex, labelText) {
    const particleCount = 25;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
      const x = pos.x + (Math.random() - 0.5) * 3;
      const y = pos.y + Math.random() * 12;
      const z = pos.z + (Math.random() - 0.5) * 3;
      positions.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: colorHex,
      size: 1.5,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    this.scentGroup.add(points);
  }
}

window.ScentSystem = ScentSystem;
