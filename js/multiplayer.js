/* js/multiplayer.js - PeerJS WebRTC P2P Multiplayer & Reliable Remote Rendering */

class MultiplayerManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = '';
    this.remotePlayers = {}; // id -> { mesh, targetPos, targetRotY, dinoType, hp, maxHp, beacon }
    this.initialized = false;
  }

  initPeer(customId = null, onReady = null) {
    if (typeof Peer === 'undefined') {
      console.error('PeerJS library not loaded!');
      return;
    }

    const peerOptions = {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    };

    if (customId) {
      this.peer = new Peer(customId, peerOptions);
    } else {
      this.peer = new Peer(peerOptions);
    }

    this.peer.on('open', (id) => {
      console.log('PeerJS Opened with ID:', id);
      this.initialized = true;
      if (onReady) onReady(id);
    });

    this.peer.on('connection', (connection) => {
      console.log('Incoming Peer connection...');
      this.setupConnection(connection);
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS Error:', err);
      if (window.gameEngine) {
        window.gameEngine.logNotification(`⚠️ Lỗi kết nối PeerJS: ${err.type}`);
      }
    });
  }

  createRoom(onSuccess) {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    this.roomCode = randomCode;
    const peerId = `dino-isle-${randomCode}`;
    this.isHost = true;

    this.initPeer(peerId, () => {
      if (onSuccess) onSuccess(this.roomCode);
    });
  }

  joinRoom(code, onSuccess, onError) {
    this.roomCode = code.trim().toUpperCase();
    const targetPeerId = `dino-isle-${this.roomCode}`;
    this.isHost = false;

    this.initPeer(null, () => {
      const conn = this.peer.connect(targetPeerId);
      this.setupConnection(conn);
      conn.on('open', () => {
        if (onSuccess) onSuccess(this.roomCode);
      });
      conn.on('error', (err) => {
        if (onError) onError(err);
      });
    });
  }

  setupConnection(connection) {
    this.conn = connection;

    this.conn.on('open', () => {
      console.log('Connected to peer:', this.conn.peer);
      if (window.gameEngine) {
        window.gameEngine.logNotification(`🟢 ĐÃ KẾT NỐI ONLINE VỚI ĐỐI THỦ!`);
      }
      this.startSyncLoop();
    });

    this.conn.on('data', (data) => {
      this.handleNetworkData(data);
    });

    this.conn.on('close', () => {
      console.log('Peer connection closed');
      if (window.gameEngine) {
        window.gameEngine.logNotification(`🔴 Đối thủ đã thoát phòng.`);
      }
    });
  }

  startSyncLoop() {
    setInterval(() => {
      if (this.conn && this.conn.open && window.gameEngine && window.gameEngine.playerMesh) {
        const engine = window.gameEngine;
        const payload = {
          type: 'transform',
          pos: {
            x: engine.playerMesh.position.x,
            y: engine.playerMesh.position.y,
            z: engine.playerMesh.position.z
          },
          rotY: engine.dinoAngleY,
          dinoType: engine.selectedDinoType,
          hp: engine.stats.hp,
          maxHp: engine.stats.maxHp,
          growth: engine.stats.growth,
          gameMode: engine.gameMode,
          isMoving: engine.keys['KeyW'] || engine.keys['KeyS'] || engine.keys['KeyA'] || engine.keys['KeyD']
        };
        this.conn.send(payload);
      }
    }, 40); // 25 updates/sec
  }

  onGameStarted(scene) {
    // Ensure all remote players are spawned into the 3D scene when game starts
    for (const peerId in this.remotePlayers) {
      const remote = this.remotePlayers[peerId];
      if (!remote.meshInScene) {
        scene.add(remote.mesh);
        remote.meshInScene = true;
      }
    }
  }

  sendEvent(eventName, eventData = {}) {
    if (this.conn && this.conn.open) {
      this.conn.send({
        type: 'event',
        event: eventName,
        data: eventData
      });
    }
  }

  sendPvPDamage(damage) {
    if (this.conn && this.conn.open) {
      this.conn.send({
        type: 'pvp_damage',
        amount: damage
      });
    }
  }

  handleNetworkData(data) {
    const peerId = this.conn ? this.conn.peer : 'remote';

    if (data.type === 'transform') {
      if (!this.remotePlayers[peerId]) {
        // Create remote dinosaur mesh
        const remoteMesh = ModelBuilder.createDinosaur(data.dinoType, true);

        // Add a glowing Cyan Beacon Pillar above opponent's head so they are 100% visible!
        const beaconGeo = new THREE.CylinderGeometry(0.1, 0.4, 12, 8);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.75
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, 7, 0);
        remoteMesh.add(beacon);

        this.remotePlayers[peerId] = {
          mesh: remoteMesh,
          meshInScene: false,
          targetPos: new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z),
          targetRotY: data.rotY,
          dinoType: data.dinoType,
          hp: data.hp,
          maxHp: data.maxHp,
          animTime: 0
        };

        if (window.gameEngine && window.gameEngine.scene && window.gameEngine.isGaming) {
          window.gameEngine.scene.add(remoteMesh);
          this.remotePlayers[peerId].meshInScene = true;
          window.gameEngine.logNotification(`⚔️ ĐÃ THẤY ĐỐI THỦ (${data.dinoType.toUpperCase()}) CÓ CỘT SÁNG XANH DƯƠNG!`);
        }
      }

      const remote = this.remotePlayers[peerId];
      if (remote) {
        remote.targetPos.set(data.pos.x, data.pos.y, data.pos.z);
        remote.targetRotY = data.rotY;
        remote.hp = data.hp;
        remote.maxHp = data.maxHp;

        // If mesh was created before game started, add to scene now
        if (window.gameEngine && window.gameEngine.scene && window.gameEngine.isGaming && !remote.meshInScene) {
          window.gameEngine.scene.add(remote.mesh);
          remote.meshInScene = true;
          window.gameEngine.logNotification(`⚔️ ĐỐI THỦ ONLINE CÓ CỘT SÁNG XANH DƯƠNG ĐÃ XUẤT HIỆN!`);
        }

        // Update 1v1 PvP HUD
        if (window.gameEngine && window.gameEngine.gameMode === 'pvp1v1') {
          const p2HpFill = document.getElementById('p2-pvp-hp-fill');
          if (p2HpFill) {
            const pct = Math.max(0, (remote.hp / remote.maxHp) * 100);
            p2HpFill.style.width = `${pct}%`;
          }
        }

        const scale = 0.5 + (data.growth / 100) * 0.7;
        remote.mesh.scale.set(scale, scale, scale);
      }
    } else if (data.type === 'pvp_damage') {
      if (window.gameEngine) {
        window.gameEngine.takePlayerDamage(data.amount, 'ĐỐI THỦ ONLINE');
        if (window.soundEngine) window.soundEngine.playAttack();
      }
    } else if (data.type === 'event') {
      if (data.event === 'attack') {
        if (window.soundEngine) window.soundEngine.playAttack();
      } else if (data.event === 'skill') {
        if (window.soundEngine) window.soundEngine.playSkill();
      } else if (data.event === 'roar') {
        if (window.soundEngine) window.soundEngine.playRoar(data.data.roarType || 'apex');
      }
    }
  }

  update(delta) {
    for (const id in this.remotePlayers) {
      const remote = this.remotePlayers[id];
      remote.mesh.position.lerp(remote.targetPos, 0.3);
      remote.mesh.rotation.y = THREE.MathUtils.lerp(remote.mesh.rotation.y, remote.targetRotY, 0.3);

      remote.animTime += delta * 6;
      if (remote.mesh.legLeft && remote.mesh.legRight) {
        const swing = Math.sin(remote.animTime * 1.5) * 0.4;
        remote.mesh.legLeft.rotation.x = swing;
        remote.mesh.legRight.rotation.x = -swing;
      }
    }
  }
}

window.multiplayerManager = new MultiplayerManager();
