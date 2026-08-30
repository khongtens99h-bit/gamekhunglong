/* js/models.js - 3D Dinosaur Models, Environment & Lootable Weapons & Airdrop Builders */

class ModelBuilder {
  static createDinosaur(type = 'raptor', isAI = false) {
    const dinoGroup = new THREE.Group();

    // Color choices
    let mainColor = 0x27ae60;
    let bellyColor = 0xf1c40f;
    let hornColor = 0xeaeaea;

    if (type === 'raptor') {
      mainColor = isAI ? 0xc0392b : 0x27ae60;
      bellyColor = 0xf1c40f;
    } else if (type === 'triceratops') {
      mainColor = isAI ? 0xd35400 : 0x8e44ad;
      bellyColor = 0xd2b4de;
    } else if (type === 'trex') {
      mainColor = isAI ? 0x7f8c8d : 0xa04000;
      bellyColor = 0xedbb99;
    } else if (type === 'stegosaurus') {
      mainColor = isAI ? 0x16a085 : 0x2e4053;
      bellyColor = 0xa3e4d7;
    } else if (type === 'dogerex') {
      mainColor = 0xd4a359;
      bellyColor = 0xfff8e7;
    }

    const mainMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.6,
      metalness: 0.1,
      flatShading: true
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: bellyColor,
      roughness: 0.7,
      flatShading: true
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.3 });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.4, flatShading: true });
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff6b81, roughness: 0.4 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });

    if (type === 'dogerex') {
      // DOGE-REX MEME KING
      const bodyGeo = new THREE.SphereGeometry(1.2, 10, 10);
      bodyGeo.scale(1.1, 1.25, 1.8);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = 1.9;
      body.castShadow = true;
      dinoGroup.add(body);

      const bellyGeo = new THREE.SphereGeometry(0.9, 8, 8);
      bellyGeo.scale(0.9, 1.0, 1.4);
      const belly = new THREE.Mesh(bellyGeo, bellyMat);
      belly.position.set(0, 1.6, 0.3);
      dinoGroup.add(belly);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.5, 1.2);

      const skull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.0), mainMat);
      skull.position.set(0, 0.4, 0.6);
      headGroup.add(skull);

      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.9), mainMat);
      snout.position.set(0, 0.25, 1.35);
      headGroup.add(snout);

      const dogNose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), noseMat);
      dogNose.position.set(0, 0.45, 1.8);
      headGroup.add(dogNose);

      const earGeo = new THREE.ConeGeometry(0.2, 0.7, 4);
      earGeo.rotateZ(Math.PI / 3);
      const earL = new THREE.Mesh(earGeo, mainMat); earL.position.set(0.55, 0.5, 0.4);
      const earR = new THREE.Mesh(earGeo, mainMat); earR.position.set(-0.55, 0.5, 0.4);
      earR.rotation.z = -Math.PI / 3;
      headGroup.add(earL, earR);

      const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.6), tongueMat);
      tongue.position.set(0, 0.05, 1.4);
      tongue.rotation.x = 0.15;
      headGroup.add(tongue);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat); eyeL.position.set(0.44, 0.55, 0.9);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat); eyeR.position.set(-0.44, 0.55, 0.9);
      headGroup.add(eyeL, eyeR);

      const armGeo = new THREE.CylinderGeometry(0.1, 0.06, 0.6, 6);
      armGeo.rotateX(Math.PI / 4);
      const armL = new THREE.Mesh(armGeo, mainMat); armL.position.set(0.6, 1.5, 1.1);
      const armR = new THREE.Mesh(armGeo, mainMat); armR.position.set(-0.6, 1.5, 1.1);
      dinoGroup.add(armL, armR);

      dinoGroup.add(headGroup);
      dinoGroup.headGroup = headGroup;

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 1.8, -1.6);
      const tailGeo = new THREE.ConeGeometry(0.55, 3.0, 8);
      tailGeo.rotateX(-Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, mainMat);
      tail.position.set(0, 0.2, -1.4);
      tailGroup.add(tail);
      dinoGroup.add(tailGroup);

      const legL = this.createLeg(mainMat, bellyMat); legL.position.set(0.85, 1.7, -0.3); legL.scale.set(1.3, 1.3, 1.3);
      const legR = this.createLeg(mainMat, bellyMat); legR.position.set(-0.85, 1.7, -0.3); legR.scale.set(1.3, 1.3, 1.3);
      dinoGroup.add(legL, legR);
      dinoGroup.legLeft = legL; dinoGroup.legRight = legR;

    } else if (type === 'raptor') {
      const bodyGeo = new THREE.ConeGeometry(0.8, 2.2, 7);
      bodyGeo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = 1.3;
      body.castShadow = true;
      dinoGroup.add(body);

      const bellyGeo = new THREE.SphereGeometry(0.7, 8, 8);
      bellyGeo.scale(0.9, 0.7, 1.2);
      const belly = new THREE.Mesh(bellyGeo, bellyMat);
      belly.position.set(0, 1.1, 0.1);
      dinoGroup.add(belly);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.6, 0.9);

      const neckGeo = new THREE.CylinderGeometry(0.4, 0.6, 0.8, 6);
      neckGeo.rotateX(-Math.PI / 4);
      const neck = new THREE.Mesh(neckGeo, mainMat);
      neck.position.set(0, 0.3, 0.2);
      headGroup.add(neck);

      const skullGeo = new THREE.BoxGeometry(0.65, 0.6, 1.1);
      const skull = new THREE.Mesh(skullGeo, mainMat);
      skull.position.set(0, 0.7, 0.6);
      headGroup.add(skull);

      const snoutGeo = new THREE.BoxGeometry(0.55, 0.45, 0.9);
      const snout = new THREE.Mesh(snoutGeo, mainMat);
      snout.position.set(0, 0.6, 1.3);
      headGroup.add(snout);

      const eyeGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.3, 0.8, 0.7);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.3, 0.8, 0.7);
      headGroup.add(eyeL, eyeR);

      dinoGroup.add(headGroup);
      dinoGroup.headGroup = headGroup;

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 1.3, -1.0);
      const tailGeo = new THREE.ConeGeometry(0.45, 2.5, 6);
      tailGeo.rotateX(-Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, mainMat);
      tail.position.set(0, 0, -1.2);
      tailGroup.add(tail);
      dinoGroup.add(tailGroup);

      const legLeft = this.createLeg(mainMat, bellyMat); legLeft.position.set(0.6, 1.2, -0.2);
      const legRight = this.createLeg(mainMat, bellyMat); legRight.position.set(-0.6, 1.2, -0.2);
      dinoGroup.add(legLeft, legRight);
      dinoGroup.legLeft = legLeft; dinoGroup.legRight = legRight;

    } else if (type === 'trex') {
      const bodyGeo = new THREE.SphereGeometry(1.3, 10, 10);
      bodyGeo.scale(1.2, 1.3, 2.0);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = 2.0;
      body.castShadow = true;
      dinoGroup.add(body);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.6, 1.4);

      const skullGeo = new THREE.BoxGeometry(1.1, 1.0, 1.8);
      const skull = new THREE.Mesh(skullGeo, mainMat);
      skull.position.set(0, 0.5, 0.8);
      headGroup.add(skull);

      for (let i = -0.35; i <= 0.35; i += 0.2) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), toothMat);
        tooth.rotation.x = Math.PI;
        tooth.position.set(i, 0.0, 1.5);
        headGroup.add(tooth);
      }

      const eyeGeo = new THREE.SphereGeometry(0.16, 6, 6);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.55, 0.8, 0.9);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.55, 0.8, 0.9);
      headGroup.add(eyeL, eyeR);

      dinoGroup.add(headGroup);
      dinoGroup.headGroup = headGroup;

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 2.0, -1.8);
      const tailGeo = new THREE.ConeGeometry(0.7, 3.2, 8);
      tailGeo.rotateX(-Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, mainMat);
      tail.position.set(0, -0.2, -1.5);
      tailGroup.add(tail);
      dinoGroup.add(tailGroup);

      const legL = this.createLeg(mainMat, bellyMat); legL.position.set(0.9, 1.8, -0.4); legL.scale.set(1.4, 1.4, 1.4);
      const legR = this.createLeg(mainMat, bellyMat); legR.position.set(-0.9, 1.8, -0.4); legR.scale.set(1.4, 1.4, 1.4);
      dinoGroup.add(legL, legR);
      dinoGroup.legLeft = legL; dinoGroup.legRight = legR;

    } else if (type === 'stegosaurus') {
      const bodyGeo = new THREE.SphereGeometry(1.3, 10, 10);
      bodyGeo.scale(1.0, 1.1, 1.9);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = 1.4;
      body.castShadow = true;
      dinoGroup.add(body);

      for (let z = -1.2; z <= 1.2; z += 0.45) {
        const plateGeo = new THREE.ConeGeometry(0.4, 0.9, 4);
        plateGeo.scale(0.2, 1.0, 0.8);
        const p1 = new THREE.Mesh(plateGeo, plateMat); p1.position.set(0.25, 2.3, z);
        const p2 = new THREE.Mesh(plateGeo, plateMat); p2.position.set(-0.25, 2.3, z);
        dinoGroup.add(p1, p2);
      }

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.0, 1.8);
      const skull = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.9), mainMat);
      headGroup.add(skull);
      dinoGroup.add(headGroup);
      dinoGroup.headGroup = headGroup;

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 1.3, -1.6);
      const tailGeo = new THREE.ConeGeometry(0.4, 2.2, 6);
      tailGeo.rotateX(-Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, mainMat);
      tail.position.set(0, 0, -1.0);
      tailGroup.add(tail);

      for (let i = -0.3; i <= 0.3; i += 0.6) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 4), hornMat);
        spike.rotation.z = i > 0 ? -Math.PI / 3 : Math.PI / 3;
        spike.position.set(i, 0.2, -1.8);
        tailGroup.add(spike);
      }
      dinoGroup.add(tailGroup);

      const legFL = this.createQuadLeg(mainMat); legFL.position.set(0.8, 1.0, 1.1);
      const legFR = this.createQuadLeg(mainMat); legFR.position.set(-0.8, 1.0, 1.1);
      const legBL = this.createQuadLeg(mainMat); legBL.position.set(0.8, 1.0, -1.1);
      const legBR = this.createQuadLeg(mainMat); legBR.position.set(-0.8, 1.0, -1.1);

      dinoGroup.add(legFL, legFR, legBL, legBR);
      dinoGroup.legLeft = legFL; dinoGroup.legRight = legFR;
      dinoGroup.legBackLeft = legBL; dinoGroup.legBackRight = legBR;

    } else {
      // Triceratops Quadruped
      const bodyGeo = new THREE.SphereGeometry(1.2, 10, 10);
      bodyGeo.scale(1.1, 0.95, 1.6);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = 1.3;
      body.castShadow = true;
      dinoGroup.add(body);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.4, 1.3);

      const skullGeo = new THREE.SphereGeometry(0.7, 8, 8);
      skullGeo.scale(0.9, 0.9, 1.1);
      const skull = new THREE.Mesh(skullGeo, mainMat);
      headGroup.add(skull);

      const frillGeo = new THREE.CylinderGeometry(1.3, 0.8, 0.2, 8);
      frillGeo.rotateX(Math.PI / 3);
      const frill = new THREE.Mesh(frillGeo, mainMat);
      frill.position.set(0, 0.5, -0.4);
      headGroup.add(frill);

      const mainHornGeo = new THREE.ConeGeometry(0.15, 1.2, 6);
      mainHornGeo.rotateX(Math.PI / 3);
      const hornL = new THREE.Mesh(mainHornGeo, hornMat); hornL.position.set(0.4, 0.7, 0.4);
      const hornR = new THREE.Mesh(mainHornGeo, hornMat); hornR.position.set(-0.4, 0.7, 0.4);
      
      const noseHornGeo = new THREE.ConeGeometry(0.12, 0.6, 6);
      noseHornGeo.rotateX(Math.PI / 4);
      const noseHorn = new THREE.Mesh(noseHornGeo, hornMat); noseHorn.position.set(0, 0.2, 0.9);

      headGroup.add(hornL, hornR, noseHorn);
      dinoGroup.add(headGroup);
      dinoGroup.headGroup = headGroup;

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 1.2, -1.3);
      const tailGeo = new THREE.ConeGeometry(0.4, 1.8, 6);
      tailGeo.rotateX(-Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, mainMat);
      tail.position.set(0, -0.1, -0.8);
      tailGroup.add(tail);
      dinoGroup.add(tailGroup);

      const legFL = this.createQuadLeg(mainMat); legFL.position.set(0.8, 1.0, 0.9);
      const legFR = this.createQuadLeg(mainMat); legFR.position.set(-0.8, 1.0, 0.9);
      const legBL = this.createQuadLeg(mainMat); legBL.position.set(0.8, 1.0, -0.9);
      const legBR = this.createQuadLeg(mainMat); legBR.position.set(-0.8, 1.0, -0.9);

      dinoGroup.add(legFL, legFR, legBL, legBR);
      dinoGroup.legLeft = legFL; dinoGroup.legRight = legFR;
      dinoGroup.legBackLeft = legBL; dinoGroup.legBackRight = legBR;
    }

    dinoGroup.type = type;
    return dinoGroup;
  }

  static createAirdropCrate(gunType = 'ak47') {
    const dropGroup = new THREE.Group();

    // Supply Metal Crate (Red/Gold Military Chest)
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.4, metalness: 0.6 });
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.2, metalness: 0.9 });

    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), crateMat);
    crate.position.y = 0.8;
    crate.castShadow = true;
    dropGroup.add(crate);

    // Gold Metal Frame Straps
    const frame1 = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.2, 1.65), borderMat);
    frame1.position.y = 0.8;
    dropGroup.add(frame1);

    // Parachute Umbrella Top
    const parachuteGroup = new THREE.Group();
    parachuteGroup.position.y = 4.5;

    const chuteGeo = new THREE.ConeGeometry(2.5, 1.2, 10, 1, true);
    const chuteMat = new THREE.MeshBasicMaterial({ color: 0xecf0f1, side: THREE.DoubleSide });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    parachuteGroup.add(chute);

    // Parachute Ropes
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0x95a5a6 });
    for (let i = 0; i < 4; i++) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2), ropeMat);
      const angle = (i / 4) * Math.PI * 2;
      rope.position.set(Math.sin(angle) * 1.0, -1.6, Math.cos(angle) * 1.0);
      rope.rotation.z = Math.sin(angle) * 0.3;
      rope.rotation.x = Math.cos(angle) * 0.3;
      parachuteGroup.add(rope);
    }
    dropGroup.add(parachuteGroup);

    // Red/Gold Signal Smoke Column
    const smokeGeo = new THREE.CylinderGeometry(0.5, 0.5, 25, 12);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.55
    });
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.y = 12.5;
    dropGroup.add(smoke);

    dropGroup.gunType = gunType;
    dropGroup.parachuteGroup = parachuteGroup;
    dropGroup.crateMesh = crate;
    dropGroup.smokeMesh = smoke;
    return dropGroup;
  }

  static createGunPickup(gunType = 'ak47') {
    const pickupGroup = new THREE.Group();

    let bodyColor = 0x2c3e50;
    let auraColor = 0xf39c12;

    if (gunType === 'shotgun') {
      bodyColor = 0x8e44ad;
      auraColor = 0xe74c3c;
    } else if (gunType === 'plasma') {
      bodyColor = 0x16a085;
      auraColor = 0x00ffff;
    }

    const gunMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.8, roughness: 0.2 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });

    const gunMesh = new THREE.Group();

    if (gunType === 'ak47') {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), metalMat);
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(0, 0.3, 0.6);

      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.9), gunMat);
      receiver.position.set(0, 0.3, 0);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.25), metalMat);
      mag.position.set(0, 0.0, 0.15);
      mag.rotation.x = -0.2;

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.25, 0.7), woodMat);
      stock.position.set(0, 0.2, -0.65);

      gunMesh.add(barrel, receiver, mag, stock);
    } else if (gunType === 'shotgun') {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 8), metalMat);
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(0, 0.3, 0.5);

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.8), gunMat);
      body.position.set(0, 0.3, 0);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.6), woodMat);
      stock.position.set(0, 0.2, -0.55);

      gunMesh.add(barrel, body, stock);
    } else { // Plasma
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(0, 0.3, 0.5);

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.9), gunMat);
      body.position.set(0, 0.3, 0);

      gunMesh.add(barrel, body);
    }

    gunMesh.position.y = 0.5;
    pickupGroup.add(gunMesh);

    const auraGeo = new THREE.CylinderGeometry(0.4, 0.4, 10, 12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: auraColor,
      transparent: true,
      opacity: 0.45
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.position.y = 5;
    pickupGroup.add(aura);

    pickupGroup.gunType = gunType;
    pickupGroup.gunMesh = gunMesh;
    return pickupGroup;
  }

  static createBulletProjectile(color = 0xffe100) {
    const bulletMat = new THREE.MeshBasicMaterial({ color });
    const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
    bulletGeo.rotateX(Math.PI / 2);
    return new THREE.Mesh(bulletGeo, bulletMat);
  }

  static createLeg(mat, footMat) {
    const legGroup = new THREE.Group();
    const thighGeo = new THREE.CylinderGeometry(0.3, 0.2, 1.0, 6);
    const thigh = new THREE.Mesh(thighGeo, mat);
    thigh.position.y = -0.5;
    legGroup.add(thigh);

    const shinGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.9, 6);
    const shin = new THREE.Mesh(shinGeo, mat);
    shin.position.set(0, -1.2, 0.1);
    legGroup.add(shin);

    const footGeo = new THREE.BoxGeometry(0.35, 0.12, 0.6);
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(0, -1.6, 0.25);
    legGroup.add(foot);

    return legGroup;
  }

  static createQuadLeg(mat) {
    const legGroup = new THREE.Group();
    const legGeo = new THREE.CylinderGeometry(0.3, 0.22, 1.2, 6);
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.y = -0.6;
    legGroup.add(leg);
    return legGroup;
  }

  static createTree() {
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6, flatShading: true });
    for (let i = 0; i < 3; i++) {
      const foliageGeo = new THREE.ConeGeometry(2.5 - i * 0.5, 3 - i * 0.4, 6);
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 3.5 + i * 1.5;
      foliage.castShadow = true;
      treeGroup.add(foliage);
    }
    return treeGroup;
  }

  static createFoodBush() {
    const bushGroup = new THREE.Group();
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.5, flatShading: true });
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });

    for (let i = 0; i < 5; i++) {
      const leafGeo = new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.3);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.8);
      leaf.castShadow = true;
      bushGroup.add(leaf);
    }
    for (let i = 0; i < 4; i++) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), berryMat);
      berry.position.set((Math.random() - 0.5) * 1.0, 0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 1.0);
      bushGroup.add(berry);
    }

    bushGroup.type = 'plant';
    return bushGroup;
  }

  static createMeatCarcass() {
    const meatGroup = new THREE.Group();
    const meatMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.4, flatShading: true });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.2 });

    const meatChunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), meatMat);
    meatChunk.position.y = 0.4;
    meatGroup.add(meatChunk);

    const bone1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2), boneMat);
    bone1.rotation.z = Math.PI / 4;
    bone1.position.set(0.2, 0.4, 0);
    meatGroup.add(bone1);

    meatGroup.type = 'meat';
    return meatGroup;
  }
}

window.ModelBuilder = ModelBuilder;
