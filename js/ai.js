/* js/ai.js - AI Dinosaur Behavior System Supporting Dynamic Difficulty Levels & Dog-Rex */

class AIDinosaur {
  constructor(scene, type, spawnPos, difficulty = 'normal') {
    this.scene = scene;
    this.type = type;
    this.difficulty = difficulty;
    this.mesh = ModelBuilder.createDinosaur(type, true);
    this.mesh.position.copy(spawnPos);
    
    const groundY = this.getTerrainHeight(spawnPos.x, spawnPos.z);
    this.mesh.position.y = groundY + 0.1;
    this.scene.add(this.mesh);

    let diffMult = 1.0;
    this.detectRadius = 35;

    if (difficulty === 'easy') {
      diffMult = 0.7; this.detectRadius = 25;
    } else if (difficulty === 'normal') {
      diffMult = 1.0; this.detectRadius = 35;
    } else if (difficulty === 'hard') {
      diffMult = 1.3; this.detectRadius = 50;
    } else if (difficulty === 'nightmare') {
      diffMult = 1.7; this.detectRadius = 70;
    }

    if (type === 'trex') {
      this.hp = 200 * diffMult; this.speed = 0.08 * diffMult; this.damage = 30 * diffMult;
    } else if (type === 'dogerex') {
      this.hp = 150 * diffMult; this.speed = 0.11 * diffMult; this.damage = 25 * diffMult;
    } else if (type === 'stegosaurus') {
      this.hp = 160 * diffMult; this.speed = 0.055 * diffMult; this.damage = 24 * diffMult;
    } else if (type === 'triceratops') {
      this.hp = 130 * diffMult; this.speed = 0.065 * diffMult; this.damage = 20 * diffMult;
    } else { // raptor
      this.hp = 80 * diffMult;  this.speed = 0.10 * diffMult;  this.damage = 18 * diffMult;
    }

    this.maxHp = this.hp;
    this.state = 'idle';
    this.targetPos = new THREE.Vector3();
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.isDead = false;
    this.animTime = Math.random() * 10;

    this.pickNewWanderTarget();
  }

  getTerrainHeight(x, z) {
    const dist = Math.sqrt(x*x + z*z);
    let y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
    if (dist > 160) y -= (dist - 160) * 0.5;
    return y;
  }

  pickNewWanderTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 35;
    this.targetPos.set(
      this.mesh.position.x + Math.sin(angle) * dist,
      0,
      this.mesh.position.z + Math.cos(angle) * dist
    );
    this.targetPos.x = Math.max(-170, Math.min(170, this.targetPos.x));
    this.targetPos.z = Math.max(-170, Math.min(170, this.targetPos.z));
  }

  update(delta, playerMesh, playerDinoType, gameEngine) {
    if (this.isDead) return;

    this.animTime += delta * 6;
    this.attackCooldown -= delta;
    const distToPlayer = this.mesh.position.distanceTo(playerMesh.position);

    const isDifferentSpecies = this.type !== playerDinoType;

    if (isDifferentSpecies && distToPlayer < this.detectRadius) {
      this.state = 'attack';
    } else if (!isDifferentSpecies && distToPlayer < 18 && this.state === 'attack_retaliate') {
      this.state = 'attack';
    } else if (this.stateTimer <= 0 && this.state !== 'attack') {
      this.stateTimer = 3 + Math.random() * 5;
      this.state = Math.random() > 0.3 ? 'wander' : 'idle';
      if (this.state === 'wander') this.pickNewWanderTarget();
    }

    let moveVector = new THREE.Vector3();

    if (this.state === 'attack') {
      moveVector.subVectors(playerMesh.position, this.mesh.position).normalize();
      this.moveTowards(moveVector, this.speed * 1.35, delta);

      if (distToPlayer < 4.8 && this.attackCooldown <= 0) {
        this.attackCooldown = 1.2;
        gameEngine.takePlayerDamage(Math.round(this.damage), this.type);
        if (this.type === 'dogerex') {
          if (window.soundEngine) window.soundEngine.playDogBark();
        } else {
          if (window.soundEngine) window.soundEngine.playAttack();
        }
      }
    } else if (this.state === 'flee') {
      moveVector.subVectors(this.mesh.position, playerMesh.position).normalize();
      this.moveTowards(moveVector, this.speed * 1.4, delta);
    } else if (this.state === 'wander') {
      moveVector.subVectors(this.targetPos, this.mesh.position);
      if (moveVector.length() < 2) {
        this.state = 'idle';
      } else {
        moveVector.normalize();
        this.moveTowards(moveVector, this.speed, delta);
      }
    } else {
      const groundY = this.getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
      this.mesh.position.y = groundY + 0.1 + Math.sin(this.animTime * 0.5) * 0.05;
    }
  }

  moveTowards(dir, currentSpeed, delta) {
    const targetAngle = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, 0.14);

    this.mesh.position.x += Math.sin(this.mesh.rotation.y) * currentSpeed;
    this.mesh.position.z += Math.cos(this.mesh.rotation.y) * currentSpeed;

    const groundY = this.getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = groundY + 0.1;

    if (this.mesh.legLeft && this.mesh.legRight) {
      const swing = Math.sin(this.animTime * 2) * 0.4;
      this.mesh.legLeft.rotation.x = swing;
      this.mesh.legRight.rotation.x = -swing;
      if (this.mesh.legBackLeft && this.mesh.legBackRight) {
        this.mesh.legBackLeft.rotation.x = -swing;
        this.mesh.legBackRight.rotation.x = swing;
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.state = 'attack';
    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.mesh.rotation.z = Math.PI / 2;
    const groundY = this.getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = groundY + 0.5;
  }
}

class AIManager {
  constructor(scene) {
    this.scene = scene;
    this.dinos = [];
  }

  spawnInitialDinos(count = 18, difficulty = 'normal') {
    const species = ['dogerex', 'raptor', 'triceratops', 'trex', 'stegosaurus'];
    for (let i = 0; i < count; i++) {
      const type = species[Math.floor(Math.random() * species.length)];
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 140;
      const pos = new THREE.Vector3(
        Math.sin(angle) * radius,
        0,
        Math.cos(angle) * radius
      );
      const ai = new AIDinosaur(this.scene, type, pos, difficulty);
      this.dinos.push(ai);
    }
  }

  update(delta, playerMesh, playerDinoType, gameEngine) {
    this.dinos.forEach(dino => dino.update(delta, playerMesh, playerDinoType, gameEngine));
  }
}

window.AIManager = AIManager;
