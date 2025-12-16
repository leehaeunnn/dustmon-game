const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 게임 로직 모듈
const GameLogic = require('./game-logic');
const BattleSystem = require('./battle-system');

// 전역 변수
let serialPort = null;
let currentSensorData = { pm25: 0, pm10: 0 };
let connectedPlayers = new Map(); // socketId -> playerData
let waitingQueue = []; // 매칭 대기 중인 플레이어
let activeBattles = new Map(); // battleId -> battleData

// 시리얼 포트 설정 (Windows: COM3, COM4 등, Mac/Linux: /dev/ttyUSB0 등)
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3'; // 환경변수로 변경 가능
const BAUD_RATE = 9600;
const SIMULATION_MODE = process.env.SIMULATION_MODE === 'true'; // 강제 시뮬레이션 모드

// 시리얼 포트 초기화
async function initSerialPort() {
  // 시뮬레이션 모드가 활성화된 경우 시리얼 포트 연결 건너뛰기
  if (SIMULATION_MODE) {
    console.log('환경 변수에 의해 시뮬레이션 모드 활성화');
    startSimulationMode();
    return;
  }

  try {
    serialPort = new SerialPort({
      path: SERIAL_PORT,
      baudRate: BAUD_RATE,
      autoOpen: false
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    // 시리얼 포트 열기 (Promise 기반)
    try {
      await serialPort.open();
      console.log(`시리얼 포트 연결 성공: ${SERIAL_PORT}`);
    } catch (err) {
      console.log(`시리얼 포트 연결 실패: ${err.message}`);
      console.log('시뮬레이션 모드로 전환합니다...');
      startSimulationMode();
      return;
    }

    parser.on('data', (data) => {
      try {
        const sensorData = JSON.parse(data.toString().trim());
        if (sensorData.pm25 !== undefined && sensorData.pm10 !== undefined) {
          currentSensorData = {
            pm25: parseFloat(sensorData.pm25),
            pm10: parseFloat(sensorData.pm10),
            timestamp: Date.now()
          };
          
          // 모든 클라이언트에 센서 데이터 브로드캐스트
          io.emit('sensor-data', currentSensorData);
          
          // 게임 로직 업데이트
          updateGameWithSensorData(currentSensorData);
        }
      } catch (error) {
        console.error('센서 데이터 파싱 오류:', error);
      }
    });

    serialPort.on('error', (err) => {
      console.error('시리얼 포트 오류:', err);
      startSimulationMode();
    });

  } catch (error) {
    console.error('시리얼 포트 초기화 오류:', error);
    startSimulationMode();
  }
}

// 시뮬레이션 모드 (센서 없이 테스트용)
function startSimulationMode() {
  console.log('시뮬레이션 모드 활성화');
  let basePM25 = 50;
  let direction = 1;
  
  setInterval(() => {
    // 시뮬레이션: 30-150 사이에서 변동
    basePM25 += (Math.random() - 0.5) * 10 * direction;
    if (basePM25 < 30) {
      basePM25 = 30;
      direction = 1;
    } else if (basePM25 > 150) {
      basePM25 = 150;
      direction = -1;
    }
    
    currentSensorData = {
      pm25: Math.round(basePM25 * 10) / 10,
      pm10: Math.round(basePM25 * 1.5 * 10) / 10,
      timestamp: Date.now()
    };
    
    io.emit('sensor-data', currentSensorData);
    updateGameWithSensorData(currentSensorData);
  }, 500);
}

// 센서 데이터로 게임 업데이트
function updateGameWithSensorData(sensorData) {
  // 모든 플레이어의 펫에 경험치 부여
  connectedPlayers.forEach((player, socketId) => {
    if (player.pet) {
      // 펫 케어 상태 업데이트
      GameLogic.updatePetCare(player.pet);

      let expGain = 0.1; // 기본 경험치 (0.5초마다 0.1씩) - 대폭 감소

      // 변화량 보너스 (크게 줄임)
      if (player.lastSensorValue) {
        const change = Math.abs(sensorData.pm25 - player.lastSensorValue.pm25);
        if (change > 5) { // 변화가 클 때만 보너스
          expGain += Math.floor(change * 0.2); // 변화량 x0.2로 감소
        }
      }

      // 미세먼지 수치에 따른 보너스 (감소)
      if (sensorData.pm25 > 100) {
        expGain += 0.3; // 나쁨일 때 소량 추가
      } else if (sensorData.pm25 < 30) {
        expGain += 0.2; // 좋음일 때 소량 추가
      }

      // 케어 상태에 따른 경험치 배율 적용
      if (player.pet.careMultiplier) {
        expGain = Math.floor(expGain * player.pet.careMultiplier);
      }

      // 경험치 부여
      const levelUp = GameLogic.addExperience(player.pet, expGain);
      if (levelUp) {
        const cleanPet = JSON.parse(JSON.stringify(player.pet));
        io.to(socketId).emit('pet-level-up', cleanPet);
      }

      // 진화 체크
      const evolution = GameLogic.checkEvolution(player.pet, sensorData);
      if (evolution) {
        player.pet = evolution;
        const cleanPet = JSON.parse(JSON.stringify(player.pet));
        io.to(socketId).emit('pet-evolution', cleanPet);
      }

      // 펫 필요 체크 (경고)
      const needs = GameLogic.checkPetNeeds(player.pet);
      if (needs.length > 0) {
        io.to(socketId).emit('pet-needs', needs);
      }

      // 미세먼지 레벨별 특수 이벤트
      const dustEvent = GameLogic.processDustLevelEvent(player.pet, sensorData);
      if (dustEvent) {
        io.to(socketId).emit('dust-event', dustEvent);
      }

      // 펫 데이터 실시간 업데이트 (경험치 바 갱신)
      const cleanPet = JSON.parse(JSON.stringify(player.pet));
      io.to(socketId).emit('pet-data', cleanPet);
    }
    player.lastSensorValue = sensorData;
  });
}

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log(`플레이어 연결: ${socket.id}`);
  
  // 초기 센서 데이터 전송
  socket.emit('sensor-data', currentSensorData);
  
  // 플레이어 등록
  socket.on('register-player', (data) => {
    // 이전 버전 호환성 (문자열로 오는 경우)
    const playerName = typeof data === 'string' ? data : data.playerName;
    const petName = typeof data === 'object' ? data.petName : undefined;
    const petImage = typeof data === 'object' ? data.petImage : undefined;

    const pet = GameLogic.createNewPet(petName);

    // 펫 이미지가 제공된 경우 저장
    if (petImage) {
      pet.customImage = petImage;
    }

    const playerData = {
      id: socket.id,
      name: playerName || `Player_${socket.id.substring(0, 6)}`,
      pet: pet,
      lastSensorValue: currentSensorData,
      connectedAt: Date.now()
    };

    connectedPlayers.set(socket.id, playerData);

    // 깨끗한 pet 복사본
    const cleanPet = JSON.parse(JSON.stringify(playerData.pet));

    // socket 객체를 제외한 깨끗한 데이터만 전송
    const cleanPlayerData = {
      id: playerData.id,
      name: playerData.name,
      pet: cleanPet
    };

    socket.emit('player-registered', cleanPlayerData);
    socket.emit('pet-data', cleanPet);
    
    // 접속자 수 브로드캐스트
    io.emit('player-count', connectedPlayers.size);
    
    console.log(`플레이어 등록: ${playerData.name}`);
  });
  
  // 펫 데이터 요청
  socket.on('get-pet', () => {
    const player = connectedPlayers.get(socket.id);
    if (player && player.pet) {
      // 깨끗한 복사본 전송
      const cleanPet = JSON.parse(JSON.stringify(player.pet));
      socket.emit('pet-data', cleanPet);
    }
  });
  
  // 매칭 요청
  socket.on('request-match', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player) {
      socket.emit('error', '플레이어가 등록되지 않았습니다.');
      return;
    }
    
    // 이미 대기 중이면 무시
    if (waitingQueue.includes(socket.id)) {
      return;
    }
    
    waitingQueue.push(socket.id);
    socket.emit('matching-started');
    
    // 매칭 시도
    tryMatchPlayers();
  });
  
  // 매칭 취소
  socket.on('cancel-match', () => {
    const index = waitingQueue.indexOf(socket.id);
    if (index > -1) {
      waitingQueue.splice(index, 1);
      socket.emit('matching-cancelled');
    }
  });
  
  // 배틀 액션
  socket.on('battle-action', (action) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) {
      return;
    }
    
    const battle = activeBattles.get(player.battleId);
    if (!battle) {
      return;
    }
    
    BattleSystem.updateBattleState(battle);
    const result = BattleSystem.processBattleAction(battle, socket.id, action, currentSensorData);
    if (!result.success) { socket.emit("action-failed", { message: result.message, cooldown: result.cooldown }); return; }
    
    // 배틀 상태 브로드캐스트
    // 배틀 업데이트 전송 (깨끗한 복사본)
    const cleanBattle = JSON.parse(JSON.stringify(battle));
    io.to(battle.player1Id).emit('battle-update', cleanBattle);
    io.to(battle.player2Id).emit('battle-update', cleanBattle);
    
    // 배틀 종료 체크
    if (battle.status === 'finished') {
      // 배틀 보상 지급
      const winner = connectedPlayers.get(
        battle.winner === 'player1' ? battle.player1Id : battle.player2Id
      );
      const loser = connectedPlayers.get(
        battle.winner === 'player1' ? battle.player2Id : battle.player1Id
      );

      if (winner && winner.pet) {
        // 승자 보상
        const winnerPet = winner.pet;
        const expReward = 200 + winnerPet.level * 20;
        const goldReward = 100 + winnerPet.level * 10;

        GameLogic.addExperience(winnerPet, expReward);
        if (!winnerPet.gold) winnerPet.gold = 0;
        winnerPet.gold += goldReward;
        winnerPet.battleWins = (winnerPet.battleWins || 0) + 1;
        winnerPet.totalBattles = (winnerPet.totalBattles || 0) + 1;

        // 퀘스트 체크 (배틀 승리)
        const completedQuests = GameLogic.updateQuest(winnerPet, 'battle_win');

        io.to(winner.id).emit('battle-reward', {
          result: 'win',
          expReward,
          goldReward,
          completedQuests
        });
      }

      if (loser && loser.pet) {
        // 패자 위로상
        const loserPet = loser.pet;
        const expReward = 50 + loserPet.level * 5;
        const goldReward = 25 + loserPet.level * 2;

        GameLogic.addExperience(loserPet, expReward);
        if (!loserPet.gold) loserPet.gold = 0;
        loserPet.gold += goldReward;
        loserPet.totalBattles = (loserPet.totalBattles || 0) + 1;

        io.to(loser.id).emit('battle-reward', {
          result: 'lose',
          expReward,
          goldReward
        });
      }

      setTimeout(() => {
        cleanupBattle(battle.id);
      }, 5000);
    }
  });
  
  // 채팅 메시지
  socket.on('chat-message', (message) => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      io.emit('chat-message', {
        player: player.name,
        message: message,
        timestamp: Date.now()
      });
    }
  });

  // ========== 액션 배틀 멀티플레이어 동기화 ==========

  // 위치 동기화
  socket.on('action-position', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) return;

    const battle = activeBattles.get(player.battleId);
    if (!battle) return;

    // 상대 플레이어에게 위치 전송
    const opponentId = battle.player1Id === socket.id ? battle.player2Id : battle.player1Id;
    io.to(opponentId).emit('action-position', data);
  });

  // 근접 공격 동기화
  socket.on('action-melee', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) return;

    const battle = activeBattles.get(player.battleId);
    if (!battle) return;

    // 상대 플레이어에게 공격 알림
    const opponentId = battle.player1Id === socket.id ? battle.player2Id : battle.player1Id;
    io.to(opponentId).emit('action-melee', data);
  });

  // 원거리 공격 동기화
  socket.on('action-ranged', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) return;

    const battle = activeBattles.get(player.battleId);
    if (!battle) return;

    // 상대 플레이어에게 발사체 생성 알림
    const opponentId = battle.player1Id === socket.id ? battle.player2Id : battle.player1Id;
    io.to(opponentId).emit('action-ranged', data);
  });

  // 방어 동기화
  socket.on('action-defend', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) return;

    const battle = activeBattles.get(player.battleId);
    if (!battle) return;

    // 상대 플레이어에게 방어 상태 알림
    const opponentId = battle.player1Id === socket.id ? battle.player2Id : battle.player1Id;
    io.to(opponentId).emit('action-defend', data);
  });

  // 회복 동기화
  socket.on('action-heal', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) return;

    const battle = activeBattles.get(player.battleId);
    if (!battle) return;

    // 상대 플레이어에게 회복 이펙트 및 HP 동기화
    const opponentId = battle.player1Id === socket.id ? battle.player2Id : battle.player1Id;
    io.to(opponentId).emit('action-heal', data);
    io.to(opponentId).emit('action-hp-sync', { hp: data.hp });
  });

  // 액션 배틀 종료
  socket.on('action-battle-end', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.battleId) return;

    const battle = activeBattles.get(player.battleId);
    if (!battle || battle.status === 'finished') return;

    // 승패 처리
    battle.status = 'finished';
    if (data.result === 'win') {
      battle.winner = battle.player1Id === socket.id ? 'player1' : 'player2';
    } else {
      battle.winner = battle.player1Id === socket.id ? 'player2' : 'player1';
    }

    // 보상 처리
    const winnerId = battle.winner === 'player1' ? battle.player1Id : battle.player2Id;
    const loserId = battle.winner === 'player1' ? battle.player2Id : battle.player1Id;
    const winner = connectedPlayers.get(winnerId);
    const loser = connectedPlayers.get(loserId);

    if (winner && winner.pet) {
      const expReward = 200 + winner.pet.level * 20;
      const goldReward = 100 + winner.pet.level * 10;
      GameLogic.addExperience(winner.pet, expReward);
      if (!winner.pet.gold) winner.pet.gold = 0;
      winner.pet.gold += goldReward;
      winner.pet.battleWins = (winner.pet.battleWins || 0) + 1;
      winner.pet.totalBattles = (winner.pet.totalBattles || 0) + 1;

      io.to(winnerId).emit('battle-reward', { result: 'win', expReward, goldReward });
    }

    if (loser && loser.pet) {
      const expReward = 50 + loser.pet.level * 5;
      const goldReward = 25 + loser.pet.level * 2;
      GameLogic.addExperience(loser.pet, expReward);
      if (!loser.pet.gold) loser.pet.gold = 0;
      loser.pet.gold += goldReward;
      loser.pet.totalBattles = (loser.pet.totalBattles || 0) + 1;

      io.to(loserId).emit('battle-reward', { result: 'lose', expReward, goldReward });
    }

    setTimeout(() => {
      cleanupBattle(battle.id);
    }, 3000);
  });

  // ========== 펫 케어 이벤트 ==========

  // 먹이주기
  socket.on('feed-pet', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      socket.emit('error', '펫이 없습니다.');
      return;
    }

    const result = GameLogic.feedPet(player.pet);

    if (result.success) {
      // 레벨업 체크
      const cleanPet = JSON.parse(JSON.stringify(player.pet));
      socket.emit('pet-data', cleanPet);
      socket.emit('pet-action-result', {
        type: 'feed',
        success: true,
        message: result.message,
        bonusExp: result.bonusExp
      });

      // 퀘스트 완료 알림
      if (result.completedQuests && result.completedQuests.length > 0) {
        result.completedQuests.forEach(quest => {
          socket.emit('quest-completed', quest);
        });
      }
    } else {
      socket.emit('pet-action-result', {
        type: 'feed',
        success: false,
        message: result.message,
        cooldown: result.cooldown
      });
    }
  });

  // 놀아주기
  socket.on('play-pet', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      socket.emit('error', '펫이 없습니다.');
      return;
    }

    const result = GameLogic.playWithPet(player.pet);

    if (result.success) {
      const cleanPet = JSON.parse(JSON.stringify(player.pet));
      socket.emit('pet-data', cleanPet);
      socket.emit('pet-action-result', {
        type: 'play',
        success: true,
        message: result.message,
        bonusExp: result.bonusExp
      });

      // 퀘스트 완료 알림
      if (result.completedQuests && result.completedQuests.length > 0) {
        result.completedQuests.forEach(quest => {
          socket.emit('quest-completed', quest);
        });
      }
    } else {
      socket.emit('pet-action-result', {
        type: 'play',
        success: false,
        message: result.message,
        cooldown: result.cooldown
      });
    }
  });

  // 청소하기
  socket.on('clean-pet', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      socket.emit('error', '펫이 없습니다.');
      return;
    }

    const result = GameLogic.cleanPet(player.pet);

    if (result.success) {
      const cleanPet = JSON.parse(JSON.stringify(player.pet));
      socket.emit('pet-data', cleanPet);
      socket.emit('pet-action-result', {
        type: 'clean',
        success: true,
        message: result.message,
        bonusExp: result.bonusExp
      });
    } else {
      socket.emit('pet-action-result', {
        type: 'clean',
        success: false,
        message: result.message,
        cooldown: result.cooldown
      });
    }
  });

  // ========== 새로운 기능들 ==========

  // 펫 클릭
  socket.on('click-pet', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      return;
    }

    const result = GameLogic.clickPet(player.pet);

    // 퀘스트 업데이트
    const clickQuests = GameLogic.updateQuest(player.pet, 'click');
    const comboQuests = player.pet.clickData.combo >= 20 ?
      GameLogic.updateQuest(player.pet, 'combo', 20) : [];

    const cleanPet = JSON.parse(JSON.stringify(player.pet));
    socket.emit('pet-data', cleanPet);
    socket.emit('click-result', {
      expGain: result.expGain,
      combo: result.combo,
      totalClicks: result.totalClicks
    });

    // 퀘스트 완료 알림
    [...clickQuests, ...comboQuests].forEach(quest => {
      socket.emit('quest-completed', quest);
    });
  });

  // 미니게임 완료
  socket.on('minigame-complete', (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      return;
    }

    const result = GameLogic.processMinigameResult(
      player.pet,
      data.gameType,
      data.score,
      data.time
    );

    // 퀘스트 업데이트
    const completedQuests = GameLogic.updateQuest(player.pet, 'minigame');

    const cleanPet = JSON.parse(JSON.stringify(player.pet));
    socket.emit('pet-data', cleanPet);
    socket.emit('minigame-reward', result);

    completedQuests.forEach(quest => {
      socket.emit('quest-completed', quest);
    });
  });

  // 아이템 사용
  socket.on('use-item', (itemId) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      return;
    }

    const result = GameLogic.useItem(player.pet, itemId);

    const cleanPet = JSON.parse(JSON.stringify(player.pet));
    socket.emit('pet-data', cleanPet);
    socket.emit('item-result', result);
  });

  // 일일 퀘스트 조회
  socket.on('get-quests', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      return;
    }

    if (!player.pet.dailyQuests) {
      player.pet.dailyQuests = {
        quests: GameLogic.generateDailyQuests(),
        lastReset: Date.now()
      };
    }

    socket.emit('quests-data', player.pet.dailyQuests.quests);
  });

  // 아이템 목록 조회
  socket.on('get-items', () => {
    socket.emit('items-data', GameLogic.ITEMS);
  });

  // 펫 이름 변경
  socket.on('rename-pet', (newName) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !player.pet) {
      return;
    }

    const result = GameLogic.renamePet(player.pet, newName);

    const cleanPet = JSON.parse(JSON.stringify(player.pet));
    socket.emit('pet-data', cleanPet);
    socket.emit('rename-result', result);
  });

  // 랭킹 조회
  socket.on('get-rankings', () => {
    const rankings = [];
    connectedPlayers.forEach((player, socketId) => {
      if (player.pet) {
        rankings.push(GameLogic.getPlayerRanking(player.pet, player.name));
      }
    });

    // 레벨, 승률, 골드 순으로 정렬
    rankings.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.gold - a.gold;
    });

    socket.emit('rankings-data', rankings.slice(0, 10)); // 상위 10명
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`플레이어 연결 해제: ${socket.id}`);
    
    // 대기열에서 제거
    const queueIndex = waitingQueue.indexOf(socket.id);
    if (queueIndex > -1) {
      waitingQueue.splice(queueIndex, 1);
    }
    
    // 배틀 중이면 처리
    const player = connectedPlayers.get(socket.id);
    if (player && player.battleId) {
      const battle = activeBattles.get(player.battleId);
      if (battle) {
        BattleSystem.handleDisconnect(battle, socket.id);
        cleanupBattle(battle.id);
      }
    }
    
    connectedPlayers.delete(socket.id);
    io.emit('player-count', connectedPlayers.size);
  });
});

// 매칭 시스템
function tryMatchPlayers() {
  if (waitingQueue.length < 2) {
    return;
  }
  
  const player1Id = waitingQueue.shift();
  const player2Id = waitingQueue.shift();
  
  const player1 = connectedPlayers.get(player1Id);
  const player2 = connectedPlayers.get(player2Id);
  
  if (!player1 || !player2) {
    // 누락된 플레이어를 다시 큐에 추가
    if (player1) waitingQueue.push(player1Id);
    if (player2) waitingQueue.push(player2Id);
    return;
  }
  
  // 배틀 생성
  const battle = BattleSystem.createBattle(player1, player2, currentSensorData);
  activeBattles.set(battle.id, battle);
  
  player1.battleId = battle.id;
  player2.battleId = battle.id;
  
  // 플레이어들에게 배틀 시작 알림 (깨끗한 복사본)
  const cleanBattle = JSON.parse(JSON.stringify(battle));
  io.to(player1Id).emit('battle-started', cleanBattle);
  io.to(player2Id).emit('battle-started', cleanBattle);
  
  console.log(`배틀 시작: ${player1.name} vs ${player2.name}`);
}

// 배틀 정리
function cleanupBattle(battleId) {
  const battle = activeBattles.get(battleId);
  if (!battle) return;
  
  const player1 = connectedPlayers.get(battle.player1Id);
  const player2 = connectedPlayers.get(battle.player2Id);
  
  if (player1) {
    player1.battleId = null;
    io.to(battle.player1Id).emit('battle-ended');
  }
  if (player2) {
    player2.battleId = null;
    io.to(battle.player2Id).emit('battle-ended');
  }
  
  activeBattles.delete(battleId);
}

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  initSerialPort();
});

// 주기적으로 접속자 수 브로드캐스트
setInterval(() => {
  io.emit('player-count', connectedPlayers.size);
}, 5000);

