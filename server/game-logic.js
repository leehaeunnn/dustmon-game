// 게임 로직 모듈

// 펫 타입 정의
const PET_TYPES = {
  NORMAL: 'normal',
  ANGEL: 'angel',      // 천사형
  DEVIL: 'devil',      // 악마형
  MUTANT: 'mutant'     // 변이형
};

// 펫 생성
function createNewPet(petName) {
  return {
    id: generateId(),
    name: petName || generatePetName(), // petName이 제공되면 사용, 아니면 랜덤 생성
    type: PET_TYPES.NORMAL,
    level: 1,
    exp: 0,
    expToNext: 100,
    stats: {
      hp: 100,
      maxHp: 100,
      attack: 20,
      defense: 15,
      speed: 10
    },
    // 펫 상태 추가
    care: {
      hunger: 100,      // 배고픔 (0-100, 100이 배부름)
      happiness: 100,   // 행복도 (0-100)
      cleanliness: 100, // 청결도 (0-100)
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastCleaned: Date.now(),
      lastUpdate: Date.now()
    },
    // 게임 데이터
    gold: 100,  // 시작 골드
    totalBattles: 0,
    battleWins: 0,
    evolutionHistory: [],
    createdAt: Date.now()
  };
}

// 펫 이름 생성
function generatePetName() {
  const names = ['더스트', '미세', '먼지', '공기', '바람', '구름', '안개'];
  const suffixes = ['몬', '이', '이', '이', '이', '이'];
  return names[Math.floor(Math.random() * names.length)] + 
         suffixes[Math.floor(Math.random() * suffixes.length)];
}

// ID 생성
function generateId() {
  return 'pet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 경험치 추가 및 레벨업 처리
function addExperience(pet, expGain) {
  pet.exp += expGain;
  let leveledUp = false;
  
  while (pet.exp >= pet.expToNext) {
    pet.exp -= pet.expToNext;
    pet.level++;
    leveledUp = true;
    
    // 레벨업 시 스탯 증가
    const statGain = {
      maxHp: Math.floor(10 + pet.level * 2),
      attack: Math.floor(3 + pet.level * 0.5),
      defense: Math.floor(2 + pet.level * 0.3),
      speed: Math.floor(1 + pet.level * 0.2)
    };
    
    pet.stats.maxHp += statGain.maxHp;
    pet.stats.hp = pet.stats.maxHp; // 레벨업 시 HP 회복
    pet.stats.attack += statGain.attack;
    pet.stats.defense += statGain.defense;
    pet.stats.speed += statGain.speed;
    
    // 다음 레벨 경험치 계산
    pet.expToNext = Math.floor(100 * Math.pow(1.5, pet.level - 1));
  }
  
  return leveledUp;
}

// 진화 체크
function checkEvolution(pet, sensorData) {
  if (pet.type !== PET_TYPES.NORMAL) {
    return null; // 이미 진화함
  }
  
  const pm25 = sensorData.pm25;
  const history = pet.evolutionHistory || [];
  
  // 최근 10개 센서값 기록 (간단한 추적)
  history.push({
    pm25: pm25,
    timestamp: Date.now()
  });
  
  // 최근 20개만 유지
  if (history.length > 20) {
    history.shift();
  }
  
  pet.evolutionHistory = history;
  
  
  // 진화 조건 체크
  if (history.length >= 10) {
    // 천사형: 최근 10개 값이 모두 30 미만
    const allClean = history.slice(-10).every(h => h.pm25 < 30);
    if (allClean) {
      return evolveTo(pet, PET_TYPES.ANGEL);
    }
    
    // 악마형: 최근 10개 값이 모두 100 초과
    const allPolluted = history.slice(-10).every(h => h.pm25 > 100);
    if (allPolluted) {
      return evolveTo(pet, PET_TYPES.DEVIL);
    }
    
    // 변이형: 변화량이 큰 경우
    const variations = [];
    for (let i = 1; i < history.length; i++) {
      variations.push(Math.abs(history[i].pm25 - history[i-1].pm25));
    }
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    if (avgVariation > 50) {
      return evolveTo(pet, PET_TYPES.MUTANT);
    }
  }
  
  return null;
}

// 진화 실행
function evolveTo(pet, newType) {
  pet.type = newType;
  pet.evolvedAt = Date.now();
  
  // 진화 보너스 스탯
  const evolutionBonus = {
    [PET_TYPES.ANGEL]: {
      maxHp: 50,
      attack: 15,
      defense: 20,
      speed: 10
    },
    [PET_TYPES.DEVIL]: {
      maxHp: 80,
      attack: 25,
      defense: 10,
      speed: 15
    },
    [PET_TYPES.MUTANT]: {
      maxHp: 60,
      attack: 20,
      defense: 15,
      speed: 25
    }
  };
  
  const bonus = evolutionBonus[newType];
  if (bonus) {
    pet.stats.maxHp += bonus.maxHp;
    pet.stats.hp = pet.stats.maxHp;
    pet.stats.attack += bonus.attack;
    pet.stats.defense += bonus.defense;
    pet.stats.speed += bonus.speed;
  }
  
  return pet;
}

// 필드 효과 계산
function getFieldEffect(pm25) {
  if (pm25 <= 30) {
    return {
      name: '청정',
      angel: { attack: 1.2 },
      devil: {},
      mutant: {}
    };
  } else if (pm25 <= 80) {
    return {
      name: '보통',
      angel: {},
      devil: {},
      mutant: {}
    };
  } else if (pm25 <= 150) {
    return {
      name: '나쁨',
      angel: {},
      devil: { speed: 1.3 },
      mutant: {}
    };
  
  } else {
    return {
      name: '위험',
      angel: {},
      devil: {},
      mutant: { critical: 1.5 }
    }; 
  }
}

// 타입 상성 계산
function getTypeAdvantage(attackerType, defenderType) {
  const advantages = {
    [PET_TYPES.ANGEL]: PET_TYPES.MUTANT,
    [PET_TYPES.MUTANT]: PET_TYPES.DEVIL,
    [PET_TYPES.DEVIL]: PET_TYPES.ANGEL
  };
  
  if (advantages[attackerType] === defenderType) {
    return 1.5; // 효과가 좋음
  } else if (advantages[defenderType] === attackerType) {
    return 0.75; // 효과가 나쁨
  }
  
  return 1.0; // 일반
}

// 대미지 계산
function calculateDamage(attacker, defender, fieldEffect, isCritical = false) {
  const baseDamage = attacker.stats.attack;
  const defense = defender.stats.defense;
  
  // 타입 상성
  const typeMultiplier = getTypeAdvantage(attacker.type, defender.type);
  
  // 필드 효과
  const fieldMultiplier = fieldEffect[attacker.type]?.attack || 1.0;
  
  // 크리티컬
  const criticalMultiplier = isCritical ? 2.0 : 1.0;
  if (attacker.type === PET_TYPES.MUTANT && fieldEffect.mutant?.critical) {
    const mutantCritical = isCritical ? fieldEffect.mutant.critical : 1.0;
    // 변이형은 위험 필드에서 크리티컬 확률 증가는 별도 처리
  }
  
  // 최종 대미지
  const damage = Math.floor(
    (baseDamage * typeMultiplier * fieldMultiplier * criticalMultiplier) - 
    (defense * 0.5)
  );
  
  return Math.max(1, damage); // 최소 1 대미지
}

// ============ 펫 케어 시스템 ============

// 시간에 따른 펫 상태 감소
function updatePetCare(pet) {
  if (!pet.care) {
    // 기존 펫에 care 속성 추가
    pet.care = {
      hunger: 100,
      happiness: 100,
      cleanliness: 100,
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastCleaned: Date.now(),
      lastUpdate: Date.now()
    };
    return;
  }

  const now = Date.now();
  const timePassed = (now - pet.care.lastUpdate) / 1000; // 초 단위

  // 30초마다 1씩 감소 (1분에 2씩)
  const decreaseRate = timePassed / 30;

  // 각 상태 감소
  pet.care.hunger = Math.max(0, pet.care.hunger - decreaseRate);
  pet.care.happiness = Math.max(0, pet.care.happiness - decreaseRate * 0.8);
  pet.care.cleanliness = Math.max(0, pet.care.cleanliness - decreaseRate * 0.5);

  pet.care.lastUpdate = now;

  // 상태가 낮으면 스탯에 패널티
  applyCarePenalty(pet);

  return pet;
}

// 케어 상태에 따른 스탯 패널티/보너스
function applyCarePenalty(pet) {
  const care = pet.care;
  const avgCare = (care.hunger + care.happiness + care.cleanliness) / 3;

  // 평균 케어 수치에 따른 경험치 획득 배율
  if (avgCare < 30) {
    pet.careMultiplier = 0.5; // 매우 나쁨
    pet.careStatus = '매우 나쁨';
  } else if (avgCare < 50) {
    pet.careMultiplier = 0.75; // 나쁨
    pet.careStatus = '나쁨';
  } else if (avgCare < 70) {
    pet.careMultiplier = 1.0; // 보통
    pet.careStatus = '보통';
  } else if (avgCare < 90) {
    pet.careMultiplier = 1.2; // 좋음
    pet.careStatus = '좋음';
  } else {
    pet.careMultiplier = 1.5; // 최상
    pet.careStatus = '최상';
  }
}

// 먹이주기
function feedPet(pet) {
  const now = Date.now();
  const timeSinceLastFed = (now - pet.care.lastFed) / 1000;

  // 최소 10초 간격
  if (timeSinceLastFed < 10) {
    return {
      success: false,
      message: '아직 배가 고프지 않아요!',
      cooldown: Math.ceil(10 - timeSinceLastFed)
    };
  }

  pet.care.hunger = Math.min(100, pet.care.hunger + 30);
  pet.care.lastFed = now;

  // 추가 보너스 효과
  const bonusExp = Math.floor(10 + pet.level * 2);
  addExperience(pet, bonusExp);

  // 퀘스트 업데이트
  const completedQuests = updateQuest(pet, 'feed');

  return {
    success: true,
    message: '냠냠! 맛있어요!',
    hunger: pet.care.hunger,
    bonusExp: bonusExp,
    completedQuests: completedQuests
  };
}

// 놀아주기
function playWithPet(pet) {
  const now = Date.now();
  const timeSinceLastPlayed = (now - pet.care.lastPlayed) / 1000;

  // 최소 15초 간격
  if (timeSinceLastPlayed < 15) {
    return {
      success: false,
      message: '아직 좀 쉬고 싶어요!',
      cooldown: Math.ceil(15 - timeSinceLastPlayed)
    };
  }

  pet.care.happiness = Math.min(100, pet.care.happiness + 25);
  pet.care.lastPlayed = now;

  // 추가 보너스 효과
  const bonusExp = Math.floor(15 + pet.level * 3);
  addExperience(pet, bonusExp);

  // 퀘스트 업데이트
  const completedQuests = updateQuest(pet, 'play');

  return {
    success: true,
    message: '즐거워요! 😊',
    happiness: pet.care.happiness,
    bonusExp: bonusExp,
    completedQuests: completedQuests
  };
}

// 청소하기
function cleanPet(pet) {
  const now = Date.now();
  const timeSinceLastCleaned = (now - pet.care.lastCleaned) / 1000;

  // 최소 20초 간격
  if (timeSinceLastCleaned < 20) {
    return {
      success: false,
      message: '아직 깨끗해요!',
      cooldown: Math.ceil(20 - timeSinceLastCleaned)
    };
  }

  pet.care.cleanliness = Math.min(100, pet.care.cleanliness + 35);
  pet.care.lastCleaned = now;

  // 추가 보너스 효과
  const bonusExp = Math.floor(8 + pet.level * 1.5);
  addExperience(pet, bonusExp);

  return {
    success: true,
    message: '깨끗해졌어요! ✨',
    cleanliness: pet.care.cleanliness,
    bonusExp: bonusExp
  };
}

// 펫 상태 체크 (경고 메시지)
function checkPetNeeds(pet) {
  const needs = [];

  if (pet.care.hunger < 30) {
    needs.push({ type: 'hunger', message: '배가 고파요!' });
  }
  if (pet.care.happiness < 30) {
    needs.push({ type: 'happiness', message: '심심해요!' });
  }
  if (pet.care.cleanliness < 30) {
    needs.push({ type: 'cleanliness', message: '더러워요!' });
  }

  return needs;
}

// ============ 펫 클릭 시스템 ============

// 펫 클릭 (클리커 게임 요소)
function clickPet(pet) {
  if (!pet.clickData) {
    pet.clickData = {
      totalClicks: 0,
      lastClickTime: 0,
      combo: 0,
      maxCombo: 0
    };
  }

  const now = Date.now();
  const timeSinceLastClick = (now - pet.clickData.lastClickTime) / 1000;

  // 콤보 시스템 (1초 이내 클릭하면 콤보 증가)
  if (timeSinceLastClick < 1) {
    pet.clickData.combo++;
  } else {
    pet.clickData.combo = 1;
  }

  pet.clickData.totalClicks++;
  pet.clickData.lastClickTime = now;
  pet.clickData.maxCombo = Math.max(pet.clickData.maxCombo, pet.clickData.combo);

  // 경험치 계산 (기본 5 + 콤보 보너스)
  let expGain = 5 + Math.floor(pet.clickData.combo * 0.5);

  // 레벨이 높을수록 더 많이
  expGain += Math.floor(pet.level * 0.3);

  addExperience(pet, expGain);

  return {
    success: true,
    expGain: expGain,
    combo: pet.clickData.combo,
    totalClicks: pet.clickData.totalClicks
  };
}

// ============ 미니게임 시스템 ============

// 미니게임 결과 처리
function processMinigameResult(pet, gameType, score, time) {
  let expReward = 0;
  let goldReward = 0;

  // 게임 타입별 보상 계산
  if (gameType === 'reaction') {
    // 반응속도 게임: 빠를수록 보상 증가
    if (time < 0.3) {
      expReward = 100 + pet.level * 5;
      goldReward = 50;
    } else if (time < 0.5) {
      expReward = 70 + pet.level * 3;
      goldReward = 30;
    } else if (time < 0.8) {
      expReward = 50 + pet.level * 2;
      goldReward = 20;
    } else {
      expReward = 30 + pet.level;
      goldReward = 10;
    }
  } else if (gameType === 'memory') {
    // 기억력 게임: 점수에 비례
    expReward = score * 10 + pet.level * 2;
    goldReward = score * 5;
  } else if (gameType === 'catch') {
    // 캐치 게임: 잡은 개수
    expReward = score * 15 + pet.level * 3;
    goldReward = score * 7;
  }

  // 보상 지급
  addExperience(pet, expReward);

  if (!pet.gold) pet.gold = 0;
  pet.gold += goldReward;

  // 게임 통계 기록
  if (!pet.gameStats) {
    pet.gameStats = {};
  }
  if (!pet.gameStats[gameType]) {
    pet.gameStats[gameType] = {
      played: 0,
      bestScore: 0,
      totalRewards: 0
    };
  }

  pet.gameStats[gameType].played++;
  pet.gameStats[gameType].bestScore = Math.max(pet.gameStats[gameType].bestScore, score);
  pet.gameStats[gameType].totalRewards += expReward;

  return {
    expReward,
    goldReward,
    message: `${expReward} EXP + ${goldReward} 골드 획득!`
  };
}

// ============ 일일 퀘스트 시스템 ============

// 일일 퀘스트 생성
function generateDailyQuests() {
  const quests = [
    {
      id: 'feed_5',
      title: '먹이주기 5번',
      description: '펫에게 먹이를 5번 주세요',
      type: 'feed',
      target: 5,
      reward: { exp: 200, gold: 100 }
    },
    {
      id: 'click_100',
      title: '펫 클릭 100번',
      description: '펫을 100번 클릭하세요',
      type: 'click',
      target: 100,
      reward: { exp: 150, gold: 75 }
    },
    {
      id: 'play_3',
      title: '놀아주기 3번',
      description: '펫과 3번 놀아주세요',
      type: 'play',
      target: 3,
      reward: { exp: 150, gold: 80 }
    },
    {
      id: 'minigame_5',
      title: '미니게임 5번',
      description: '미니게임을 5번 플레이하세요',
      type: 'minigame',
      target: 5,
      reward: { exp: 250, gold: 120 }
    },
    {
      id: 'combo_20',
      title: '콤보 20 달성',
      description: '클릭 콤보 20을 달성하세요',
      type: 'combo',
      target: 20,
      reward: { exp: 300, gold: 150 }
    }
  ];

  // 랜덤으로 3개 선택
  const selected = [];
  const questsCopy = [...quests];
  for (let i = 0; i < 3; i++) {
    const index = Math.floor(Math.random() * questsCopy.length);
    selected.push({
      ...questsCopy[index],
      progress: 0,
      completed: false
    });
    questsCopy.splice(index, 1);
  }

  return selected;
}

// 퀘스트 업데이트
function updateQuest(pet, questType, amount = 1) {
  if (!pet.dailyQuests) {
    pet.dailyQuests = {
      quests: generateDailyQuests(),
      lastReset: Date.now()
    };
  }

  // 자정 지나면 퀘스트 리셋
  const now = Date.now();
  const lastReset = new Date(pet.dailyQuests.lastReset);
  const today = new Date(now);
  if (lastReset.getDate() !== today.getDate()) {
    pet.dailyQuests = {
      quests: generateDailyQuests(),
      lastReset: now
    };
  }

  const completedQuests = [];

  pet.dailyQuests.quests.forEach(quest => {
    if (!quest.completed && quest.type === questType) {
      quest.progress += amount;

      if (quest.progress >= quest.target) {
        quest.completed = true;
        quest.progress = quest.target;

        // 보상 지급
        addExperience(pet, quest.reward.exp);
        if (!pet.gold) pet.gold = 0;
        pet.gold += quest.reward.gold;

        completedQuests.push(quest);
      }
    }
  });

  return completedQuests;
}

// ============ 아이템 시스템 ============

// 아이템 목록
const ITEMS = {
  food_basic: { name: '기본 먹이', cost: 0, hungerRestore: 30, exp: 10 },
  food_premium: { name: '프리미엄 먹이', cost: 50, hungerRestore: 50, exp: 30 },
  food_deluxe: { name: '디럭스 먹이', cost: 150, hungerRestore: 100, exp: 100 },
  toy_ball: { name: '공', cost: 30, happinessRestore: 25, exp: 15 },
  toy_premium: { name: '프리미엄 장난감', cost: 100, happinessRestore: 50, exp: 50 },
  soap: { name: '비누', cost: 20, cleanlinessRestore: 35, exp: 8 },
  shampoo: { name: '샴푸', cost: 80, cleanlinessRestore: 70, exp: 35 },
  exp_potion: { name: '경험치 물약', cost: 200, exp: 500 }
};

// 아이템 사용
function useItem(pet, itemId) {
  const item = ITEMS[itemId];
  if (!item) {
    return { success: false, message: '존재하지 않는 아이템입니다.' };
  }

  if (!pet.gold) pet.gold = 0;

  // 골드 체크 (기본 먹이는 무료)
  if (item.cost > 0 && pet.gold < item.cost) {
    return { success: false, message: '골드가 부족합니다!' };
  }

  // 골드 차감
  pet.gold -= item.cost;

  // 효과 적용
  if (item.hungerRestore) {
    pet.care.hunger = Math.min(100, pet.care.hunger + item.hungerRestore);
  }
  if (item.happinessRestore) {
    pet.care.happiness = Math.min(100, pet.care.happiness + item.happinessRestore);
  }
  if (item.cleanlinessRestore) {
    pet.care.cleanliness = Math.min(100, pet.care.cleanliness + item.cleanlinessRestore);
  }
  if (item.exp) {
    addExperience(pet, item.exp);
  }

  return {
    success: true,
    message: `${item.name}을(를) 사용했습니다!`,
    item: item
  };
}

// ============ 펫 이름 변경 ============

// 펫 이름 변경 (골드 50 소모)
function renamePet(pet, newName) {
  if (!newName || newName.trim().length === 0) {
    return { success: false, message: '이름을 입력해주세요!' };
  }

  if (newName.length > 10) {
    return { success: false, message: '이름은 10글자 이하로 입력해주세요!' };
  }

  if (!pet.gold) pet.gold = 0;

  const cost = 50;
  if (pet.gold < cost) {
    return { success: false, message: `골드가 부족합니다! (필요: ${cost} 골드)` };
  }

  pet.gold -= cost;
  pet.name = newName.trim();

  return {
    success: true,
    message: `이름을 "${newName}"으로 변경했습니다!`,
    newName: pet.name
  };
}

// ============ 랭킹 시스템 ============

// 플레이어 랭킹 정보 생성
function getPlayerRanking(pet, playerName) {
  return {
    playerName: playerName,
    petName: pet.name,
    level: pet.level,
    type: pet.type,
    totalBattles: pet.totalBattles || 0,
    battleWins: pet.battleWins || 0,
    winRate: pet.totalBattles > 0 ? ((pet.battleWins || 0) / pet.totalBattles * 100).toFixed(1) : 0,
    gold: pet.gold || 0,
    totalClicks: pet.clickData ? pet.clickData.totalClicks : 0,
    maxCombo: pet.clickData ? pet.clickData.maxCombo : 0
  };
}

// ============ 미세먼지 레벨별 특수 이벤트 ============

// 미세먼지 레벨에 따른 특수 이벤트 처리
function processDustLevelEvent(pet, sensorData) {
  if (!pet || !sensorData) return null;

  const pm25 = sensorData.pm25;
  const now = Date.now();

  // 마지막 이벤트 시간 추적 (1분 쿨다운)
  if (!pet.lastDustEvent) {
    pet.lastDustEvent = 0;
  }

  const cooldown = 60000; // 60초
  if (now - pet.lastDustEvent < cooldown) {
    return null; // 아직 쿨다운 중
  }

  let event = null;

  // 매우 좋음 (PM2.5 < 15)
  if (pm25 < 15) {
    const bonusExp = 50 + Math.floor(pet.level * 2);
    const bonusGold = 20 + Math.floor(pet.level);
    addExperience(pet, bonusExp);
    pet.gold = (pet.gold || 0) + bonusGold;

    // 행복도 증가
    if (pet.care) {
      pet.care.happiness = Math.min(100, pet.care.happiness + 10);
    }

    event = {
      type: 'excellent',
      title: '🌟 깨끗한 공기!',
      message: `공기가 정말 맑아요! ${pet.name}이(가) 기뻐합니다!\n+${bonusExp} EXP, +${bonusGold} 골드, +10 행복도`,
      bonusExp: bonusExp,
      bonusGold: bonusGold,
      color: '#4CAF50'
    };
  }
  // 좋음 (PM2.5 15-30)
  else if (pm25 < 30) {
    const bonusExp = 30 + Math.floor(pet.level * 1.5);
    const bonusGold = 10 + Math.floor(pet.level * 0.5);
    addExperience(pet, bonusExp);
    pet.gold = (pet.gold || 0) + bonusGold;

    if (pet.care) {
      pet.care.happiness = Math.min(100, pet.care.happiness + 5);
    }

    event = {
      type: 'good',
      title: '😊 좋은 공기',
      message: `공기가 좋아요! ${pet.name}이(가) 상쾌해합니다.\n+${bonusExp} EXP, +${bonusGold} 골드, +5 행복도`,
      bonusExp: bonusExp,
      bonusGold: bonusGold,
      color: '#8BC34A'
    };
  }
  // 나쁨 (PM2.5 80-150)
  else if (pm25 >= 80 && pm25 < 150) {
    // 청결도 감소
    if (pet.care) {
      pet.care.cleanliness = Math.max(0, pet.care.cleanliness - 15);
      pet.care.happiness = Math.max(0, pet.care.happiness - 10);
    }

    event = {
      type: 'bad',
      title: '😷 나쁜 공기',
      message: `공기가 나빠요! ${pet.name}이(가) 불편해합니다.\n-15 청결도, -10 행복도`,
      color: '#FF9800'
    };
  }
  // 매우 나쁨 (PM2.5 >= 150)
  else if (pm25 >= 150) {
    // 모든 케어 스탯 감소
    if (pet.care) {
      pet.care.hunger = Math.max(0, pet.care.hunger - 20);
      pet.care.happiness = Math.max(0, pet.care.happiness - 20);
      pet.care.cleanliness = Math.max(0, pet.care.cleanliness - 25);
    }

    event = {
      type: 'terrible',
      title: '☠️ 위험한 공기!',
      message: `공기가 매우 위험해요! ${pet.name}이(가) 힘들어합니다!\n-20 배고픔, -20 행복도, -25 청결도\n빨리 케어해주세요!`,
      color: '#f44336'
    };
  }

  if (event) {
    pet.lastDustEvent = now;
  }

  return event;
}

module.exports = {
  createNewPet,
  addExperience,
  checkEvolution,
  getFieldEffect,
  getTypeAdvantage,
  calculateDamage,
  // 펫 케어 함수
  updatePetCare,
  feedPet,
  playWithPet,
  cleanPet,
  checkPetNeeds,
  // 새로운 기능들
  clickPet,
  processMinigameResult,
  updateQuest,
  generateDailyQuests,
  useItem,
  renamePet,
  getPlayerRanking,
  processDustLevelEvent,
  ITEMS,
  PET_TYPES
};

// PET_TYPES를 별도로 export (battle-system.js에서 사용)
module.exports.PET_TYPES = PET_TYPES;

