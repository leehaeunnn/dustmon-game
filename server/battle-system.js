// 배틀 시스템 모듈
const GameLogic = require('./game-logic');

// 배틀 생성
function createBattle(player1, player2, sensorData) {
  const battle = {
    id: generateBattleId(),
    player1Id: player1.id,
    player2Id: player2.id,
    player1Name: player1.name,
    player2Name: player2.name,
    pet1: JSON.parse(JSON.stringify(player1.pet)), // 복사본
    pet2: JSON.parse(JSON.stringify(player2.pet)), // 복사본
    currentTurn: null, // 'player1' or 'player2'
    turnNumber: 0,
    status: 'waiting', // 'waiting', 'active', 'finished'
    winner: null,
    actions: [],
    fieldEffect: GameLogic.getFieldEffect(sensorData.pm25),
    sensorData: sensorData,
    createdAt: Date.now()
  };
  
  // 선공 결정 (속도 비교)
  if (battle.pet1.stats.speed >= battle.pet2.stats.speed) {
    battle.currentTurn = 'player1';
  } else {
    battle.currentTurn = 'player2';
  }
  
  battle.status = 'active';
  battle.turnNumber = 1;
  
  return battle;
}

// 배틀 ID 생성
function generateBattleId() {
  return 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 배틀 액션 처리
function processBattleAction(battle, playerId, action, currentSensorData) {
  if (battle.status !== 'active') {
    return;
  }
  
  // 현재 턴 확인
  const isPlayer1Turn = battle.currentTurn === 'player1' && playerId === battle.player1Id;
  const isPlayer2Turn = battle.currentTurn === 'player2' && playerId === battle.player2Id;
  
  if (!isPlayer1Turn && !isPlayer2Turn) {
    return; // 잘못된 플레이어의 턴
  }
  
  const attacker = battle.currentTurn === 'player1' ? battle.pet1 : battle.pet2;
  const defender = battle.currentTurn === 'player1' ? battle.pet2 : battle.pet1;
  const attackerName = battle.currentTurn === 'player1' ? battle.player1Name : battle.player2Name;
  
  // 필드 효과 업데이트 (실시간 센서값 반영)
  battle.fieldEffect = GameLogic.getFieldEffect(currentSensorData.pm25);
  battle.sensorData = currentSensorData;
  
  // 액션 처리
  let actionResult = null;
  
  switch (action.type) {
    case 'attack':
      actionResult = processAttack(battle, attacker, defender, attackerName);
      break;
    case 'defend':
      actionResult = processDefend(battle, attacker, attackerName);
      break;
    case 'skill':
      actionResult = processSkill(battle, attacker, defender, attackerName, action.skillId);
      break;
    default:
      return;
  }
  
  // 액션 기록
  battle.actions.push({
    turn: battle.turnNumber,
    player: battle.currentTurn,
    action: action.type,
    result: actionResult,
    timestamp: Date.now()
  });
  
  // 승부 체크
  if (battle.pet1.stats.hp <= 0) {
    battle.status = 'finished';
    battle.winner = 'player2';
  } else if (battle.pet2.stats.hp <= 0) {
    battle.status = 'finished';
    battle.winner = 'player1';
  } else {
    // 턴 교체
    battle.currentTurn = battle.currentTurn === 'player1' ? 'player2' : 'player1';
    battle.turnNumber++;
  }
}

// 공격 처리
function processAttack(battle, attacker, defender, attackerName) {
  // 크리티컬 체크 (10% 기본 확률)
  const isCritical = Math.random() < 0.1;
  
  // 변이형 + 위험 필드: 크리티컬 확률 증가
  if (attacker.type === GameLogic.PET_TYPES.MUTANT && 
      battle.fieldEffect.name === '위험') {
    const mutantCritical = Math.random() < 0.3; // 30% 확률
    if (mutantCritical) {
      // 크리티컬 보너스는 calculateDamage에서 처리
    }
  }
  
  const damage = GameLogic.calculateDamage(
    attacker, 
    defender, 
    battle.fieldEffect,
    isCritical
  );
  
  defender.stats.hp = Math.max(0, defender.stats.hp - damage);
  
  return {
    type: 'attack',
    damage: damage,
    isCritical: isCritical,
    attackerHp: attacker.stats.hp,
    defenderHp: defender.stats.hp,
    message: `${attackerName}의 ${attacker.name}이(가) ${damage}의 대미지를 입혔습니다!${isCritical ? ' (크리티컬!)' : ''}`
  };
}

// 방어 처리
function processDefend(battle, pet, playerName) {
  // 다음 턴까지 방어력 증가
  const defenseBoost = Math.floor(pet.stats.defense * 0.3);
  pet.stats.defense += defenseBoost;
  
  // 한 턴만 유지 (임시 버프)
  setTimeout(() => {
    pet.stats.defense = Math.max(pet.stats.defense - defenseBoost, 
      pet.stats.defense - defenseBoost);
  }, 100);
  
  return {
    type: 'defend',
    defenseBoost: defenseBoost,
    message: `${playerName}의 ${pet.name}이(가) 방어 자세를 취했습니다!`
  };
}

// 스킬 처리
function processSkill(battle, attacker, defender, attackerName, skillId) {
  const skills = {
    heal: {
      name: '회복',
      effect: (pet) => {
        const healAmount = Math.floor(pet.stats.maxHp * 0.3);
        pet.stats.hp = Math.min(pet.stats.maxHp, pet.stats.hp + healAmount);
        return { heal: healAmount };
      }
    },
    power_attack: {
      name: '강력한 공격',
      effect: (attacker, defender) => {
        const damage = GameLogic.calculateDamage(attacker, defender, battle.fieldEffect, false) * 1.5;
        defender.stats.hp = Math.max(0, defender.stats.hp - damage);
        return { damage: Math.floor(damage) };
      }
    },
    speed_boost: {
      name: '속도 증가',
      effect: (pet) => {
        const speedBoost = Math.floor(pet.stats.speed * 0.5);
        pet.stats.speed += speedBoost;
        return { speedBoost: speedBoost };
      }
    }
  };
  
  const skill = skills[skillId];
  if (!skill) {
    return { type: 'skill', error: '알 수 없는 스킬' };
  }
  
  let result = null;
  if (skillId === 'heal' || skillId === 'speed_boost') {
    result = skill.effect(attacker);
  } else {
    result = skill.effect(attacker, defender);
  }
  
  return {
    type: 'skill',
    skillName: skill.name,
    result: result,
    message: `${attackerName}의 ${attacker.name}이(가) ${skill.name}을(를) 사용했습니다!`
  };
}

// 연결 끊김 처리
function handleDisconnect(battle, disconnectedPlayerId) {
  if (battle.status === 'finished') {
    return;
  }
  
  battle.status = 'finished';
  
  if (disconnectedPlayerId === battle.player1Id) {
    battle.winner = 'player2';
  } else {
    battle.winner = 'player1';
  }
}

module.exports = {
  createBattle,
  processBattleAction,
  handleDisconnect
};

