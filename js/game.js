/* js/game.js - Engine with Precise Ground Terrain Height Clamping */

class GameEngine {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.selectedDinoType = 'raptor';

    // Survival Stats
    this.stats = {
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      hunger: 100,
      maxHunger: 100,
      thirst: 100,
      maxThirst: 100,
      growth: 10,
      growthStage: 'Hatchling'
    };

    // Cooldowns
    this.skillCooldown = 0;
    this.attackAnimTime = 0;

    // Environment Data
    this.waterSources = [];
    this.foodBushes = [];
    this.meatCarcasses = [];

    // Inputs
    this.keys = {};
    this.scentActive = false;

    // Angles
    this.dinoAngleY = 0;
    this.cameraAngleY = 0;
    this.cameraAngleX = 0.25;

    this.initThree();
    this.initWorld();
    this.initInput();
  }

  getTerrainHeight(x, z) {
    const dist = Math.sqrt(x*x + z*z);
    let y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
    if (dist > 160) y -= (dist - 160) * 0.5;
    return y;
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2e22);
    this.scene.fog = new THREE.FogExp2(0x1a2e22, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8, 14);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.set(50, 80, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 300;
    const d = 120;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.dayTime = 0;
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initWorld() {
    // Terrain Island
    const terrainGeo = new THREE.PlaneGeometry(400, 400, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.getTerrainHeight(x, z);
      posAttr.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2d4c38,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    this.terrain = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    // Ocean
    const waterGeo = new THREE.PlaneGeometry(500, 500);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1b4f72,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const ocean = new THREE.Mesh(waterGeo, waterMat);
    ocean.position.y = -1.5;
    this.scene.add(ocean);

    // Lakes
    const lakeGeo = new THREE.CylinderGeometry(16, 16, 0.4, 24);
    const lake = new THREE.Mesh(lakeGeo, waterMat);
    lake.position.set(20, -0.1, 20);
    this.scene.add(lake);
    this.waterSources.push(lake);

    const lake2 = new THREE.Mesh(lakeGeo, waterMat);
    lake2.position.set(-60, -0.1, -40);
    this.scene.add(lake2);
    this.waterSources.push(lake2);

    // Trees & Bushes (Clamped to ground height)
    for (let i = 0; i < 90; i++) {
      const tree = ModelBuilder.createTree();
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      if (Math.hypot(x, z) < 150) {
        const y = this.getTerrainHeight(x, z);
        tree.position.set(x, y, z);
        const s = 0.7 + Math.random() * 0.6;
        tree.scale.set(s, s, s);
        this.scene.add(tree);
      }
    }

    for (let i = 0; i < 40; i++) {
      const bush = ModelBuilder.createFoodBush();
      const x = (Math.random() - 0.5) * 260;
      const z = (Math.random() - 0.5) * 260;
      if (Math.hypot(x, z) < 140) {
        const y = this.getTerrainHeight(x, z);
        bush.position.set(x, y, z);
        this.scene.add(bush);
        this.foodBushes.push(bush);
      }
    }

    this.scentSystem = new ScentSystem(this.scene);
    this.aiManager = new AIManager(this.scene);
  }

  startGame(dinoType) {
    this.selectedDinoType = dinoType;

    if (this.playerMesh) this.scene.remove(this.playerMesh);
    this.playerMesh = ModelBuilder.createDinosaur(dinoType, false);
    
    // Initial position on ground
    const startY = this.getTerrainHeight(0, 0);
    this.playerMesh.position.set(0, startY + 0.1, 0);
    this.scene.add(this.playerMesh);

    this.stats.hp = 100;
    this.stats.stamina = 100;
    this.stats.hunger = 85;
    this.stats.thirst = 85;
    this.stats.growth = 15;
    this.updateScaleByGrowth();

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('hud-screen').style.display = 'flex';
    document.getElementById('game-over-screen').classList.remove('active');

    this.aiManager.spawnInitialDinos(10);

    this.clock = new THREE.Clock();
    this.isGaming = true;

    document.body.requestPointerLock();

    this.logNotification(`Đã sửa lỗi chui xuống đất! Khủng long di chuyển vững trên mặt đất.`);
    this.animate();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyQ' && this.isGaming) {
        this.scentActive = !this.scentActive;
        this.scentSystem.toggle(this.scentActive);
        this.logNotification(this.scentActive ? 'Đã bật Đánh hơi (Scent Mode)' : 'Tắt Đánh hơi');
      }

      if (this.isGaming) {
        if (e.code === 'Digit1') window.soundEngine.playRoar('normal');
        if (e.code === 'Digit2') window.soundEngine.playRoar('apex');
        if (e.code === 'Digit3') window.soundEngine.playRoar('threat');
        if (e.code === 'Digit4') window.soundEngine.playRoar('friendly');
      }

      if (e.code === 'KeyE' && this.isGaming) {
        this.handleEatDrinkInteraction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    this.container.addEventListener('click', () => {
      if (this.isGaming && document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      }
    });

    // MOUSE LOOK & ALT FREE-LOOK
    window.addEventListener('mousemove', (e) => {
      if (!this.isGaming) return;

      const sensitivity = 0.0035;
      this.cameraAngleY -= e.movementX * sensitivity;
      this.cameraAngleX = Math.max(0.08, Math.min(1.1, this.cameraAngleX + e.movementY * sensitivity));

      const isAltHeld = this.keys['AltLeft'] || this.keys['AltRight'] || e.altKey;
      if (!isAltHeld) {
        this.dinoAngleY = this.cameraAngleY;
      }
    });

    // Mouse Buttons
    window.addEventListener('mousedown', (e) => {
      if (!this.isGaming) return;

      if (e.button === 0) {
        this.performLeftClickAttack();
      } else if (e.button === 2) {
        this.performRightClickSkill();
      }
    });
  }

  performLeftClickAttack() {
    this.attackAnimTime = 0.3;
    if (window.soundEngine) window.soundEngine.playAttack();

    const playerPos = this.playerMesh.position;
    let hitCount = 0;

    this.aiManager.dinos.forEach(ai => {
      if (!ai.isDead) {
        const dist = playerPos.distanceTo(ai.mesh.position);
        if (dist < 5.0) {
          const killed = ai.takeDamage(35);
          hitCount++;
          this.logNotification(`Đã cắn/húc ${ai.type.toUpperCase()} (-35 HP)!`);
          if (killed) {
            this.logNotification(`Hạ gục ${ai.type.toUpperCase()}! Thịt rơi ra.`);
            const carcass = ModelBuilder.createMeatCarcass();
            const groundY = this.getTerrainHeight(ai.mesh.position.x, ai.mesh.position.z);
            carcass.position.set(ai.mesh.position.x, groundY + 0.2, ai.mesh.position.z);
            this.scene.add(carcass);
            this.meatCarcasses.push(carcass);
          }
        }
      }
    });

    if (hitCount === 0) {
      this.logNotification(`Đòn đánh thường!`);
    }
  }

  performRightClickSkill() {
    if (this.skillCooldown > 0) {
      this.logNotification(`Kỹ năng đang hồi chiêu (${this.skillCooldown.toFixed(1)}s)...`);
      return;
    }

    if (this.stats.stamina < 20) {
      this.logNotification(`Không đủ Thể Lực (Cần 20 Stamina)!`);
      return;
    }

    this.stats.stamina -= 20;
    this.skillCooldown = this.selectedDinoType === 'raptor' ? 4.0 : 5.0;
    this.attackAnimTime = 0.6;
    if (window.soundEngine) window.soundEngine.playSkill();

    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.dinoAngleY);
    const leapDist = this.selectedDinoType === 'raptor' ? 9.0 : 12.0;

    this.playerMesh.position.x += forward.x * leapDist;
    this.playerMesh.position.z += forward.z * leapDist;

    // Clamp Y after skill leap!
    const groundY = this.getTerrainHeight(this.playerMesh.position.x, this.playerMesh.position.z);
    this.playerMesh.position.y = groundY + 0.1;

    const skillDamage = this.selectedDinoType === 'raptor' ? 65 : 80;
    let hit = false;

    this.aiManager.dinos.forEach(ai => {
      if (!ai.isDead && this.playerMesh.position.distanceTo(ai.mesh.position) < 6.0) {
        const killed = ai.takeDamage(skillDamage);
        hit = true;
        this.logNotification(`💥 KỸ NĂNG TRÚNG ${ai.type.toUpperCase()} (-${skillDamage} HP)!`);
        if (killed) {
          const carcass = ModelBuilder.createMeatCarcass();
          const aiGroundY = this.getTerrainHeight(ai.mesh.position.x, ai.mesh.position.z);
          carcass.position.set(ai.mesh.position.x, aiGroundY + 0.2, ai.mesh.position.z);
          this.scene.add(carcass);
          this.meatCarcasses.push(carcass);
        }
      }
    });

    if (!hit) {
      this.logNotification(this.selectedDinoType === 'raptor' ? '⚡ SKILL: Nhảy Vồ Pounce!' : '🛡️ SKILL: Tông Sừng Horn Charge!');
    }
  }

  handleEatDrinkInteraction() {
    const playerPos = this.playerMesh.position;
    let actionTaken = false;

    this.waterSources.forEach(w => {
      if (playerPos.distanceTo(w.position) < 18) {
        this.stats.thirst = Math.min(100, this.stats.thirst + 35);
        window.soundEngine.playDrink();
        this.logNotification('Đã uống nước sạch (+35 Thirst)');
        actionTaken = true;
      }
    });

    if (!actionTaken && this.selectedDinoType === 'triceratops') {
      this.foodBushes.forEach((bush) => {
        if (playerPos.distanceTo(bush.position) < 5) {
          this.stats.hunger = Math.min(100, this.stats.hunger + 30);
          window.soundEngine.playEat();
          this.logNotification('Đã ăn bụi cây mọng nước (+30 Hunger)');
          actionTaken = true;
        }
      });
    }

    if (!actionTaken && this.selectedDinoType === 'raptor') {
      this.meatCarcasses.forEach(m => {
        if (playerPos.distanceTo(m.position) < 5) {
          this.stats.hunger = Math.min(100, this.stats.hunger + 40);
          window.soundEngine.playEat();
          this.logNotification('Đã ăn thịt (+40 Hunger)');
          actionTaken = true;
        }
      });
    }
  }

  takePlayerDamage(amount, attackerType) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.logNotification(`⚠️ Bị ${attackerType.toUpperCase()} tấn công (-${amount} HP)!`);
    if (this.stats.hp <= 0) {
      this.gameOver();
    }
  }

  update(delta) {
    if (!this.isGaming) return;

    if (this.skillCooldown > 0) {
      this.skillCooldown = Math.max(0, this.skillCooldown - delta);
    }

    if (this.playerMesh) {
      this.playerMesh.rotation.y = this.dinoAngleY;
    }

    // 1. Movement Logic (WASD)
    const moveSpeed = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.stats.stamina > 5 ? 0.24 : 0.12;
    let isMoving = false;

    const inputVector = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputVector.z += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputVector.z -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputVector.x += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputVector.x -= 1;

    if (inputVector.lengthSq() > 0) {
      inputVector.normalize();
      isMoving = true;

      const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.dinoAngleY);
      const rightDir = new THREE.Vector3(-1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.dinoAngleY);

      const moveStep = forwardDir.clone().multiplyScalar(inputVector.z * moveSpeed)
        .add(rightDir.clone().multiplyScalar(inputVector.x * moveSpeed));

      this.playerMesh.position.add(moveStep);

      if (Math.random() < 0.08) window.soundEngine.playFootstep();

      if (moveSpeed > 0.15) {
        this.stats.stamina = Math.max(0, this.stats.stamina - delta * 14);
      }
    } else {
      this.stats.stamina = Math.min(100, this.stats.stamina + delta * 12);
    }

    // CLAMP PLAYER Y ALTITUDE EXACTLY TO TERRAIN HEIGHT (Sửa lỗi chui xuống đất)
    const currentGroundY = this.getTerrainHeight(this.playerMesh.position.x, this.playerMesh.position.z);
    this.playerMesh.position.y = currentGroundY + 0.1;

    // Animations
    const animTime = Date.now() * 0.008;
    if (this.playerMesh.legLeft && this.playerMesh.legRight) {
      const swing = isMoving ? Math.sin(animTime * 1.5) * 0.5 : 0;
      this.playerMesh.legLeft.rotation.x = swing;
      this.playerMesh.legRight.rotation.x = -swing;
    }

    if (this.attackAnimTime > 0) {
      this.attackAnimTime -= delta;
      if (this.playerMesh.headGroup) {
        this.playerMesh.headGroup.rotation.x = Math.sin(this.attackAnimTime * 10) * 0.4;
      }
    }

    // 2. THIRD-PERSON CAMERA
    const camDist = 12 + (this.stats.growth * 0.05);
    this.camera.position.x = this.playerMesh.position.x - Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX) * camDist;
    this.camera.position.y = this.playerMesh.position.y + Math.sin(this.cameraAngleX) * camDist + 2.5;
    this.camera.position.z = this.playerMesh.position.z - Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX) * camDist;
    this.camera.lookAt(this.playerMesh.position.x, this.playerMesh.position.y + 1.5, this.playerMesh.position.z);

    // 3. Survival Depletion
    this.stats.hunger = Math.max(0, this.stats.hunger - delta * 0.4);
    this.stats.thirst = Math.max(0, this.stats.thirst - delta * 0.6);

    if (this.stats.hunger <= 0 || this.stats.thirst <= 0) {
      this.stats.hp = Math.max(0, this.stats.hp - delta * 4);
    }

    // 4. Growth
    if (this.stats.growth < 100) {
      this.stats.growth += delta * 0.8;
      this.updateScaleByGrowth();
    }

    // 5. Interaction Prompts
    this.checkInteractionPrompts();

    // 6. Update AI & Scent
    this.aiManager.update(delta, this.playerMesh, this.selectedDinoType, this);
    this.scentSystem.update(this.playerMesh.position, this.waterSources, this.foodBushes, this.meatCarcasses, this.aiManager.dinos);

    // 7. Day / Night Lighting
    this.dayTime += delta * 0.03;
    const sunY = Math.sin(this.dayTime) * 100;
    const sunX = Math.cos(this.dayTime) * 100;
    this.sunLight.position.set(sunX, Math.max(10, sunY), 50);

    // 8. Update HUD & Minimap
    this.updateHUD();
    this.renderMinimap();

    if (this.stats.hp <= 0) {
      this.gameOver();
    }
  }

  updateScaleByGrowth() {
    let scale = 0.5 + (this.stats.growth / 100) * 0.7;
    this.playerMesh.scale.set(scale, scale, scale);

    if (this.stats.growth < 25) this.stats.growthStage = 'Hatchling (Sơ sinh)';
    else if (this.stats.growth < 60) this.stats.growthStage = 'Juvenile (Thiếu niên)';
    else if (this.stats.growth < 90) this.stats.growthStage = 'Adult (Trưởng thành)';
    else this.stats.growthStage = 'Apex (Thượng phong)';
  }

  checkInteractionPrompts() {
    const prompt = document.getElementById('action-prompt');
    const playerPos = this.playerMesh.position;
    let text = '';

    this.waterSources.forEach(w => {
      if (playerPos.distanceTo(w.position) < 18) text = '[E] Uống Nước Clean Water';
    });

    if (!text && this.selectedDinoType === 'triceratops') {
      this.foodBushes.forEach(b => {
        if (playerPos.distanceTo(b.position) < 5) text = '[E] Ăn Bụi Cây Leaf Bush';
      });
    }

    if (!text && this.selectedDinoType === 'raptor') {
      this.meatCarcasses.forEach(m => {
        if (playerPos.distanceTo(m.position) < 5) text = '[E] Ăn Thịt Meat Carcass';
      });
    }

    if (text) {
      prompt.innerText = text;
      prompt.classList.add('active');
    } else {
      prompt.classList.remove('active');
    }
  }

  updateHUD() {
    document.getElementById('hp-fill').style.width = `${this.stats.hp}%`;
    document.getElementById('stamina-fill').style.width = `${this.stats.stamina}%`;
    document.getElementById('hunger-fill').style.width = `${this.stats.hunger}%`;
    document.getElementById('thirst-fill').style.width = `${this.stats.thirst}%`;
    document.getElementById('growth-fill').style.width = `${this.stats.growth}%`;

    document.getElementById('growth-stage-text').innerText = this.stats.growthStage;
  }

  renderMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 0.6;

    // Lakes
    ctx.fillStyle = '#3498db';
    this.waterSources.forEach(w => {
      const dx = (w.position.x - this.playerMesh.position.x) * scale;
      const dy = (w.position.z - this.playerMesh.position.z) * scale;
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // AI Dinos
    this.aiManager.dinos.forEach(ai => {
      if (!ai.isDead) {
        ctx.fillStyle = ai.type !== this.selectedDinoType ? '#e74c3c' : '#f1c40f';
        const dx = (ai.mesh.position.x - this.playerMesh.position.x) * scale;
        const dy = (ai.mesh.position.z - this.playerMesh.position.z) * scale;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  logNotification(msg) {
    const log = document.getElementById('notification-log');
    if (!log) return;
    const item = document.createElement('div');
    item.className = 'log-message';
    item.innerText = msg;
    log.appendChild(item);
    setTimeout(() => item.remove(), 4000);
  }

  gameOver() {
    this.isGaming = false;
    document.exitPointerLock();
    document.getElementById('game-over-screen').classList.add('active');
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    if (!this.isGaming) return;
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }
}

window.GameEngine = GameEngine;
