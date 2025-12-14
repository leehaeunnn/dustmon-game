// 게임 클라이언트 로직 - 프리미엄 에디션

// Socket.io 연결
const socket = io();

// 게임 상태
let gameState = {
    playerId: null,
    playerName: null,
    pet: null,
    battle: null,
    isMyTurn: false,
    isMatching: false
};

// DOM 요소
const elements = {
    // 로그인
    loginForm: document.getElementById('login-form'),
    playerNameInput: document.getElementById('player-name-input'),
    petNameInput: document.getElementById('pet-name-input'),
    petImageInput: document.getElementById('pet-image-input'),
    petImagePreview: document.getElementById('pet-image-preview'),
    previewImg: document.getElementById('preview-img'),
    drawTabBtn: document.getElementById('draw-tab-btn'),
    uploadTabBtn: document.getElementById('upload-tab-btn'),
    drawTab: document.getElementById('draw-tab'),
    uploadTab: document.getElementById('upload-tab'),
    petCanvas: document.getElementById('pet-canvas'),
    brushColor: document.getElementById('brush-color'),
    brushSize: document.getElementById('brush-size'),
    clearCanvasBtn: document.getElementById('clear-canvas-btn'),
    startBtn: document.getElementById('start-btn'),

    // 펫 정보
    petInfo: document.getElementById('pet-info'),
    petNameDisplay: document.getElementById('pet-name-display'),
    petLevel: document.getElementById('pet-level'),
    petType: document.getElementById('pet-type'),
    petHp: document.getElementById('pet-hp'),
    petMaxHp: document.getElementById('pet-max-hp'),
    petAttack: document.getElementById('pet-attack'),
    petDefense: document.getElementById('pet-defense'),
    petSpeed: document.getElementById('pet-speed'),
    expBarFill: document.getElementById('exp-bar-fill'),
    expText: document.getElementById('exp-text'),
    petEmoji: document.getElementById('pet-emoji'),
    petSprite: document.getElementById('pet-sprite'),

    // 매칭
    matchBtn: document.getElementById('match-btn'),
    cancelMatchBtn: document.getElementById('cancel-match-btn'),

    // 화면
    lobbyScreen: document.getElementById('lobby-screen'),
    battleScreen: document.getElementById('battle-screen'),

    // 센서
    pm25Value: document.getElementById('pm25-value'),
    pm10Value: document.getElementById('pm10-value'),
    airQuality: document.getElementById('air-quality'),
    playerCount: document.getElementById('player-count'),
    playerNameDisplay: document.getElementById('player-name-display'),

    // 배틀
    battleTitle: document.getElementById('battle-title'),
    fieldEffect: document.getElementById('field-effect'),
    battlePet1Name: document.getElementById('battle-pet1-name'),
    battlePet1Sprite: document.getElementById('battle-pet1-sprite'),
    battlePet1HpBar: document.getElementById('battle-pet1-hp-bar'),
    battlePet1HpText: document.getElementById('battle-pet1-hp-text'),
    battlePet2Name: document.getElementById('battle-pet2-name'),
    battlePet2Sprite: document.getElementById('battle-pet2-sprite'),
    battlePet2HpBar: document.getElementById('battle-pet2-hp-bar'),
    battlePet2HpText: document.getElementById('battle-pet2-hp-text'),
    battleLog: document.getElementById('battle-log'),
    battleActions: document.getElementById('battle-actions'),
    turnIndicator: document.getElementById('turn-indicator'),

    // 채팅
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    chatSendBtn: document.getElementById('chat-send-btn'),

    // 모달
    notificationModal: document.getElementById('notification-modal'),
    notificationMessage: document.getElementById('notification-message'),
    notificationClose: document.getElementById('notification-close'),

    // 펫 케어
    hungerBar: document.getElementById('hunger-bar'),
    hungerValue: document.getElementById('hunger-value'),
    happinessBar: document.getElementById('happiness-bar'),
    happinessValue: document.getElementById('happiness-value'),
    cleanlinessBar: document.getElementById('cleanliness-bar'),
    cleanlinessValue: document.getElementById('cleanliness-value'),
    careStatus: document.getElementById('care-status'),
    feedBtn: document.getElementById('feed-btn'),
    playBtn: document.getElementById('play-btn'),
    cleanBtn: document.getElementById('clean-btn'),

    // 새로운 UI 요소들
    petGold: document.getElementById('pet-gold'),
    clickCombo: document.getElementById('click-combo'),
    shopBtn: document.getElementById('shop-btn'),
    questBtn: document.getElementById('quest-btn'),
    minigameBtn: document.getElementById('minigame-btn'),
    questModal: document.getElementById('quest-modal'),
    shopModal: document.getElementById('shop-modal'),
    minigameModal: document.getElementById('minigame-modal'),
    questList: document.getElementById('quest-list'),
    shopItems: document.getElementById('shop-items'),
    shopGold: document.getElementById('shop-gold'),
    minigameStartBtn: document.getElementById('minigame-start-btn'),
    minigameTarget: document.getElementById('minigame-target'),
    minigameResult: document.getElementById('minigame-result'),

    // 이름 변경 & 랭킹
    renameBtn: document.getElementById('rename-btn'),
    rankingBtn: document.getElementById('ranking-btn'),
    renameModal: document.getElementById('rename-modal'),
    rankingModal: document.getElementById('ranking-modal'),
    renameInput: document.getElementById('rename-input'),
    confirmRenameBtn: document.getElementById('confirm-rename-btn'),
    rankingList: document.getElementById('ranking-list')
};

// 펫 타입별 이모지
const petTypeEmojis = {
    normal: '🐾',
    angel: '😇',
    devil: '😈',
    mutant: '👾'
};

// 타입 한글명
const petTypeNames = {
    normal: '일반',
    angel: '천사형',
    devil: '악마형',
    mutant: '변이형'
};

// ========================================
// 유틸리티 함수
// ========================================

// 레벨업 애니메이션 표시
function showLevelUpAnimation(level) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        🎉<br>
        LEVEL UP!<br>
        <div style="font-size: 32px; margin-top: 10px;">레벨 ${level}</div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// 데미지 애니메이션
function playDamageAnimation(element) {
    if (!element) return;
    element.classList.add('damage-animation');
    setTimeout(() => {
        element.classList.remove('damage-animation');
    }, 500);
}

// 회복 애니메이션
function playHealAnimation(element) {
    if (!element) return;
    element.classList.add('heal-animation');
    setTimeout(() => {
        element.classList.remove('heal-animation');
    }, 500);
}

// 숫자 카운트업 애니메이션
function animateValue(element, start, end, duration = 500) {
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = Math.round(end);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// 사운드 효과 (선택적)
const sounds = {
    levelUp: () => {
        // Web Audio API를 사용한 간단한 사운드 효과
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 523.25; // C5
            gainNode.gain.value = 0.1;

            oscillator.start();
            oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // 사운드 재생 실패는 무시
        }
    },

    attack: () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 100;
            gainNode.gain.value = 0.05;

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // 사운드 재생 실패는 무시
        }
    }
};

// ========================================
// 초기화
// ========================================
function init() {
    // 이벤트 리스너 등록
    elements.startBtn.addEventListener('click', handleStartGame);
    elements.matchBtn.addEventListener('click', handleRequestMatch);
    elements.cancelMatchBtn.addEventListener('click', handleCancelMatch);
    elements.chatSendBtn.addEventListener('click', sendChatMessage);

    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleStartGame();
        }
    });

    elements.notificationClose.addEventListener('click', () => {
        elements.notificationModal.classList.add('hidden');
    });

    // 배틀 액션 버튼
    document.querySelectorAll('.battle-action-btn').forEach(btn => {
        btn.addEventListener('click', handleBattleAction);
    });

    // 펫 케어 버튼
    elements.feedBtn.addEventListener('click', handleFeedPet);
    elements.playBtn.addEventListener('click', handlePlayPet);
    elements.cleanBtn.addEventListener('click', handleCleanPet);

    // 펫 클릭
    elements.petSprite.addEventListener('click', handlePetClick);

    // 새로운 기능 버튼들
    elements.shopBtn.addEventListener('click', () => openModal('shop'));
    elements.questBtn.addEventListener('click', () => openModal('quest'));
    elements.minigameBtn.addEventListener('click', () => openModal('minigame'));
    elements.rankingBtn.addEventListener('click', () => openModal('ranking'));

    // 이름 변경 버튼
    elements.renameBtn.addEventListener('click', () => openModal('rename'));
    elements.confirmRenameBtn.addEventListener('click', handleRenamePet);

    // 모달 닫기 - 닫기 버튼 클릭
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // 모달 닫기 - 배경 클릭 (모달 외부 영역 클릭시 닫기)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { // 모달 배경 자체를 클릭한 경우만
                closeAllModals();
            }
        });
    });

    // 모달 닫기 - ESC 키
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // 미니게임
    elements.minigameStartBtn.addEventListener('click', startMinigame);

    // 펫 이미지 업로드
    elements.petImageInput.addEventListener('change', handleImageUpload);

    // 탭 전환
    elements.drawTabBtn.addEventListener('click', () => switchTab('draw'));
    elements.uploadTabBtn.addEventListener('click', () => switchTab('upload'));

    // 그림판
    initCanvas();
    elements.clearCanvasBtn.addEventListener('click', clearCanvas);
}

// 탭 전환
function switchTab(tab) {
    if (tab === 'draw') {
        elements.drawTabBtn.classList.add('active');
        elements.uploadTabBtn.classList.remove('active');
        elements.drawTab.style.display = 'block';
        elements.uploadTab.style.display = 'none';
    } else {
        elements.uploadTabBtn.classList.add('active');
        elements.drawTabBtn.classList.remove('active');
        elements.uploadTab.style.display = 'block';
        elements.drawTab.style.display = 'none';
    }
}

// Canvas 초기화
let canvas, ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function initCanvas() {
    canvas = elements.petCanvas;
    ctx = canvas.getContext('2d');

    // 흰색 배경으로 초기화
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 마우스 이벤트
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // 터치 이벤트 (모바일 지원)
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;

    ctx.strokeStyle = elements.brushColor.value;
    ctx.lineWidth = elements.brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
}

function handleTouchMove(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.strokeStyle = elements.brushColor.value;
    ctx.lineWidth = elements.brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 이미지 업로드 처리
let petImageData = null;
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (최대 1MB)
    if (file.size > 1024 * 1024) {
        showNotification('이미지 크기는 1MB 이하여야 합니다!');
        elements.petImageInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        petImageData = event.target.result;
        elements.previewImg.src = petImageData;
        elements.petImagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ========================================
// 게임 로직
// ========================================

// 게임 시작
function handleStartGame() {
    const playerName = elements.playerNameInput.value.trim();
    const petName = elements.petNameInput.value.trim();

    if (!playerName) {
        showNotification('플레이어 이름을 입력해주세요!');
        elements.playerNameInput.focus();
        return;
    }

    if (!petName) {
        showNotification('펫 이름을 입력해주세요!');
        elements.petNameInput.focus();
        return;
    }

    // 버튼에 로딩 효과
    elements.startBtn.textContent = '연결 중...';
    elements.startBtn.disabled = true;

    gameState.playerName = playerName;
    elements.playerNameDisplay.textContent = playerName;

    // 그림판에 그린 내용이 있으면 Canvas 데이터 사용, 아니면 업로드된 이미지 사용
    let imageData = petImageData; // 업로드된 이미지

    // 그리기 탭이 활성화되어 있으면 Canvas 내용 사용
    if (elements.drawTabBtn.classList.contains('active')) {
        imageData = canvas.toDataURL('image/png');
    }

    socket.emit('register-player', {
        playerName,
        petName,
        petImage: imageData // base64 이미지 데이터 (선택사항)
    });
}

// 매칭 요청
function handleRequestMatch() {
    if (gameState.isMatching) return;

    gameState.isMatching = true;
    socket.emit('request-match');
    elements.matchBtn.classList.add('hidden');
    elements.cancelMatchBtn.classList.remove('hidden');
    showNotification('매칭 중... 상대를 찾고 있습니다.');
}

// 매칭 취소
function handleCancelMatch() {
    gameState.isMatching = false;
    socket.emit('cancel-match');
    elements.matchBtn.classList.remove('hidden');
    elements.cancelMatchBtn.classList.add('hidden');
}

// 배틀 액션
function handleBattleAction(e) {
    if (!gameState.isMyTurn || !gameState.battle) return;

    const btn = e.target;
    const action = btn.dataset.action;
    const skillId = btn.dataset.skill;

    // 버튼 클릭 효과
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 100);

    socket.emit('battle-action', {
        type: action,
        skillId: skillId
    });

    // 사운드 효과
    if (action === 'attack' || (action === 'skill' && skillId === 'power_attack')) {
        sounds.attack();
    }

    // 버튼 비활성화
    document.querySelectorAll('.battle-action-btn').forEach(b => {
        b.disabled = true;
    });
}

// 채팅 메시지 전송
function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;

    socket.emit('chat-message', message);
    elements.chatInput.value = '';
}

// ========== 펫 케어 핸들러 ==========

// 먹이주기
function handleFeedPet() {
    socket.emit('feed-pet');
    elements.feedBtn.disabled = true;
    elements.feedBtn.style.opacity = '0.5';
}

// 놀아주기
function handlePlayPet() {
    socket.emit('play-pet');
    elements.playBtn.disabled = true;
    elements.playBtn.style.opacity = '0.5';
}

// 청소하기
function handleCleanPet() {
    socket.emit('clean-pet');
    elements.cleanBtn.disabled = true;
    elements.cleanBtn.style.opacity = '0.5';
}

// ========== 새로운 기능 핸들러 ==========

// 펫 클릭
function handlePetClick() {
    socket.emit('click-pet');
    elements.petSprite.style.transform = 'scale(1.1)';
    setTimeout(() => {
        elements.petSprite.style.transform = 'scale(1)';
    }, 100);
}

// 모달 열기
function openModal(type) {
    if (type === 'shop') {
        socket.emit('get-items');
        elements.shopModal.classList.remove('hidden');
    } else if (type === 'quest') {
        socket.emit('get-quests');
        elements.questModal.classList.remove('hidden');
    } else if (type === 'minigame') {
        elements.minigameModal.classList.remove('hidden');
        elements.minigameResult.textContent = '';
        elements.minigameTarget.style.display = 'none';
    } else if (type === 'rename') {
        elements.renameModal.classList.remove('hidden');
        elements.renameInput.value = '';
        elements.renameInput.focus();
    } else if (type === 'ranking') {
        socket.emit('get-rankings');
        elements.rankingModal.classList.remove('hidden');
    }
}

// 모달 닫기
function closeAllModals() {
    elements.questModal.classList.add('hidden');
    elements.shopModal.classList.add('hidden');
    elements.minigameModal.classList.add('hidden');
    elements.renameModal.classList.add('hidden');
    elements.rankingModal.classList.add('hidden');
}

// 미니게임 시작
let minigameStartTime = 0;
function startMinigame() {
    elements.minigameStartBtn.disabled = true;
    elements.minigameResult.textContent = '준비하세요...';
    elements.minigameTarget.style.display = 'block';
    elements.minigameTarget.style.backgroundColor = '#f44336';

    const delay = 2000 + Math.random() * 3000;

    setTimeout(() => {
        minigameStartTime = Date.now();
        elements.minigameTarget.style.backgroundColor = '#4CAF50';
        elements.minigameResult.textContent = '지금 클릭!';

        elements.minigameTarget.onclick = () => {
            const reactionTime = (Date.now() - minigameStartTime) / 1000;
            elements.minigameTarget.onclick = null;

            socket.emit('minigame-complete', {
                gameType: 'reaction',
                score: Math.floor(1000 / reactionTime),
                time: reactionTime
            });

            elements.minigameStartBtn.disabled = false;
        };
    }, delay);
}

// 펫 이름 변경
function handleRenamePet() {
    const newName = elements.renameInput.value.trim();
    if (!newName) {
        showNotification('이름을 입력해주세요!');
        return;
    }

    socket.emit('rename-pet', newName);
    closeAllModals();
}

// ========================================
// 화면 업데이트 함수
// ========================================

// 펫 정보 업데이트
function updatePetDisplay(pet, isFirstLoad = false) {
    const oldPet = gameState.pet;
    gameState.pet = pet;

    elements.petNameDisplay.textContent = pet.name;

    // 숫자 애니메이션 적용
    if (oldPet && !isFirstLoad) {
        if (oldPet.level !== pet.level) {
            animateValue(elements.petLevel, oldPet.level, pet.level);
        } else {
            elements.petLevel.textContent = pet.level;
        }

        if (oldPet.stats.attack !== pet.stats.attack) {
            animateValue(elements.petAttack, oldPet.stats.attack, pet.stats.attack);
        } else {
            elements.petAttack.textContent = pet.stats.attack;
        }

        if (oldPet.stats.defense !== pet.stats.defense) {
            animateValue(elements.petDefense, oldPet.stats.defense, pet.stats.defense);
        } else {
            elements.petDefense.textContent = pet.stats.defense;
        }

        if (oldPet.stats.speed !== pet.stats.speed) {
            animateValue(elements.petSpeed, oldPet.stats.speed, pet.stats.speed);
        } else {
            elements.petSpeed.textContent = pet.stats.speed;
        }
    } else {
        elements.petLevel.textContent = pet.level;
        elements.petAttack.textContent = pet.stats.attack;
        elements.petDefense.textContent = pet.stats.defense;
        elements.petSpeed.textContent = pet.stats.speed;
    }

    elements.petType.textContent = petTypeNames[pet.type] || '일반';
    elements.petHp.textContent = pet.stats.hp;
    elements.petMaxHp.textContent = pet.stats.maxHp;

    // 골드 업데이트
    if (pet.gold !== undefined) {
        elements.petGold.textContent = pet.gold;
    }

    // 경험치 바 애니메이션
    const expPercent = (pet.exp / pet.expToNext) * 100;
    elements.expBarFill.style.width = expPercent + '%';
    elements.expText.textContent = `${pet.exp} / ${pet.expToNext}`;

    // 이모지 또는 커스텀 이미지 변경 애니메이션
    if (oldPet && (oldPet.type !== pet.type || oldPet.customImage !== pet.customImage)) {
        elements.petSprite.style.transform = 'scale(0) rotate(360deg)';
        setTimeout(() => {
            if (pet.customImage) {
                // 커스텀 이미지가 있으면 이미지로 표시
                elements.petEmoji.innerHTML = `<img src="${pet.customImage}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 10px;">`;
            } else {
                // 없으면 이모지 표시
                elements.petEmoji.textContent = petTypeEmojis[pet.type] || '🐾';
            }
            elements.petSprite.style.transform = 'scale(1) rotate(0deg)';
        }, 300);
    } else {
        if (pet.customImage) {
            elements.petEmoji.innerHTML = `<img src="${pet.customImage}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 10px;">`;
        } else {
            elements.petEmoji.textContent = petTypeEmojis[pet.type] || '🐾';
        }
    }

    // 펫 케어 상태 업데이트
    if (pet.care) {
        updatePetCareDisplay(pet.care, pet.careStatus);
    }
}

// 펫 케어 상태 업데이트
function updatePetCareDisplay(care, careStatus) {
    // 배고픔
    const hungerPercent = Math.max(0, Math.min(100, care.hunger));
    elements.hungerBar.style.width = hungerPercent + '%';
    elements.hungerValue.textContent = Math.round(hungerPercent);

    // 색상 변경
    if (hungerPercent < 30) {
        elements.hungerBar.style.backgroundColor = '#f44336';
    } else if (hungerPercent < 50) {
        elements.hungerBar.style.backgroundColor = '#ff9800';
    } else {
        elements.hungerBar.style.backgroundColor = '#4caf50';
    }

    // 행복도
    const happinessPercent = Math.max(0, Math.min(100, care.happiness));
    elements.happinessBar.style.width = happinessPercent + '%';
    elements.happinessValue.textContent = Math.round(happinessPercent);

    if (happinessPercent < 30) {
        elements.happinessBar.style.backgroundColor = '#f44336';
    } else if (happinessPercent < 50) {
        elements.happinessBar.style.backgroundColor = '#ff9800';
    } else {
        elements.happinessBar.style.backgroundColor = '#2196f3';
    }

    // 청결도
    const cleanlinessPercent = Math.max(0, Math.min(100, care.cleanliness));
    elements.cleanlinessBar.style.width = cleanlinessPercent + '%';
    elements.cleanlinessValue.textContent = Math.round(cleanlinessPercent);

    if (cleanlinessPercent < 30) {
        elements.cleanlinessBar.style.backgroundColor = '#f44336';
    } else if (cleanlinessPercent < 50) {
        elements.cleanlinessBar.style.backgroundColor = '#ff9800';
    } else {
        elements.cleanlinessBar.style.backgroundColor = '#9c27b0';
    }

    // 케어 상태 텍스트
    if (careStatus) {
        elements.careStatus.textContent = `상태: ${careStatus}`;

        // 상태별 색상
        if (careStatus === '최상') {
            elements.careStatus.style.color = '#4caf50';
        } else if (careStatus === '좋음') {
            elements.careStatus.style.color = '#2196f3';
        } else if (careStatus === '보통') {
            elements.careStatus.style.color = '#ff9800';
        } else {
            elements.careStatus.style.color = '#f44336';
        }
    }
}

// 센서 데이터 업데이트
function updateSensorDisplay(data) {
    // 부드러운 숫자 전환
    const currentPM25 = parseFloat(elements.pm25Value.textContent) || 0;
    const currentPM10 = parseFloat(elements.pm10Value.textContent) || 0;

    animateValue(elements.pm25Value, currentPM25, data.pm25);
    animateValue(elements.pm10Value, currentPM10, data.pm10);

    // 공기질 등급
    let quality = 'normal';
    let qualityText = '보통';

    if (data.pm25 <= 30) {
        quality = 'good';
        qualityText = '좋음';
    } else if (data.pm25 <= 80) {
        quality = 'normal';
        qualityText = '보통';
    } else if (data.pm25 <= 150) {
        quality = 'bad';
        qualityText = '나쁨';
    } else {
        quality = 'very-bad';
        qualityText = '매우나쁨';
    }

    if (elements.airQuality.textContent !== qualityText) {
        elements.airQuality.textContent = qualityText;
        elements.airQuality.className = 'air-quality ' + quality;
    }
}

// 배틀 화면 업데이트
function updateBattleDisplay(battle) {
    const oldBattle = gameState.battle;
    gameState.battle = battle;

    // 내가 플레이어1인지 확인
    const isPlayer1 = battle.player1Id === socket.id;
    const myPet = isPlayer1 ? battle.pet1 : battle.pet2;
    const enemyPet = isPlayer1 ? battle.pet2 : battle.pet1;
    const myName = isPlayer1 ? battle.player1Name : battle.player2Name;
    const enemyName = isPlayer1 ? battle.player2Name : battle.player1Name;

    // 내 턴인지 확인
    gameState.isMyTurn = (battle.currentTurn === 'player1' && isPlayer1) ||
                         (battle.currentTurn === 'player2' && !isPlayer1);

    // 배틀 제목
    if (battle.status === 'finished') {
        if (battle.winner === (isPlayer1 ? 'player1' : 'player2')) {
            elements.battleTitle.textContent = '🏆 승리!';
            elements.battleTitle.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
            elements.battleTitle.style.webkitBackgroundClip = 'text';
            elements.battleTitle.style.webkitTextFillColor = 'transparent';
        } else {
            elements.battleTitle.textContent = '💔 패배...';
            elements.battleTitle.style.background = 'linear-gradient(135deg, #f44336, #e91e63)';
            elements.battleTitle.style.webkitBackgroundClip = 'text';
            elements.battleTitle.style.webkitTextFillColor = 'transparent';
        }
    } else {
        elements.battleTitle.textContent = '⚔️ 배틀 진행 중';
        elements.battleTitle.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
        elements.battleTitle.style.webkitBackgroundClip = 'text';
        elements.battleTitle.style.webkitTextFillColor = 'transparent';
    }

    // 필드 효과
    elements.fieldEffect.textContent = `필드: ${battle.fieldEffect.name}`;

    // 펫1 (왼쪽 - 항상 내 펫)
    elements.battlePet1Name.textContent = `${myName}의 ${myPet.name}`;
    elements.battlePet1Sprite.textContent = petTypeEmojis[myPet.type] || '🐾';

    const hpPercent1 = (myPet.stats.hp / myPet.stats.maxHp) * 100;
    elements.battlePet1HpBar.style.width = hpPercent1 + '%';
    elements.battlePet1HpBar.classList.toggle('low', hpPercent1 < 30);
    elements.battlePet1HpText.textContent = `${myPet.stats.hp} / ${myPet.stats.maxHp}`;

    // HP 변화 감지 및 애니메이션
    if (oldBattle && oldBattle.pet1 && oldBattle.pet2) {
        const oldMyPet = isPlayer1 ? oldBattle.pet1 : oldBattle.pet2;
        if (oldMyPet.stats.hp > myPet.stats.hp) {
            playDamageAnimation(elements.battlePet1Sprite);
        } else if (oldMyPet.stats.hp < myPet.stats.hp) {
            playHealAnimation(elements.battlePet1Sprite);
        }
    }

    // 펫2 (오른쪽 - 항상 상대 펫)
    elements.battlePet2Name.textContent = `${enemyName}의 ${enemyPet.name}`;
    elements.battlePet2Sprite.textContent = petTypeEmojis[enemyPet.type] || '🐾';

    const hpPercent2 = (enemyPet.stats.hp / enemyPet.stats.maxHp) * 100;
    elements.battlePet2HpBar.style.width = hpPercent2 + '%';
    elements.battlePet2HpBar.classList.toggle('low', hpPercent2 < 30);
    elements.battlePet2HpText.textContent = `${enemyPet.stats.hp} / ${enemyPet.stats.maxHp}`;

    // HP 변화 감지 및 애니메이션
    if (oldBattle && oldBattle.pet1 && oldBattle.pet2) {
        const oldEnemyPet = isPlayer1 ? oldBattle.pet2 : oldBattle.pet1;
        if (oldEnemyPet.stats.hp > enemyPet.stats.hp) {
            playDamageAnimation(elements.battlePet2Sprite);
        } else if (oldEnemyPet.stats.hp < enemyPet.stats.hp) {
            playHealAnimation(elements.battlePet2Sprite);
        }
    }

    // 턴 표시
    if (battle.status === 'finished') {
        elements.turnIndicator.textContent = '배틀 종료';
        elements.turnIndicator.style.animation = 'none';
    } else {
        elements.turnIndicator.textContent = `턴 ${battle.turnNumber} - ${gameState.isMyTurn ? '내 턴!' : '상대 턴'}`;
        if (gameState.isMyTurn) {
            elements.turnIndicator.style.animation = 'pulse 1.5s infinite';
        }
    }

    // 액션 버튼 활성화/비활성화
    document.querySelectorAll('.battle-action-btn').forEach(btn => {
        btn.disabled = !gameState.isMyTurn || battle.status === 'finished';
    });
}

// 배틀 로그 추가
function addBattleLog(message) {
    const entry = document.createElement('div');
    entry.className = 'battle-log-entry';
    entry.textContent = message;
    entry.style.opacity = '0';
    elements.battleLog.appendChild(entry);

    // 페이드 인 애니메이션
    setTimeout(() => {
        entry.style.transition = 'opacity 0.3s';
        entry.style.opacity = '1';
    }, 10);

    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
}

// 알림 표시
function showNotification(message) {
    elements.notificationMessage.textContent = message;
    elements.notificationModal.classList.remove('hidden');
}

// ========================================
// Socket.io 이벤트 핸들러
// ========================================

// 센서 데이터 수신
socket.on('sensor-data', (data) => {
    updateSensorDisplay(data);
});

// 플레이어 등록 완료
socket.on('player-registered', (playerData) => {
    gameState.playerId = playerData.id;

    // 로그인 폼 숨기기 애니메이션
    elements.loginForm.style.transition = 'all 0.5s';
    elements.loginForm.style.opacity = '0';
    elements.loginForm.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        elements.loginForm.classList.add('hidden');
        elements.petInfo.classList.remove('hidden');
        elements.petInfo.style.opacity = '0';
        elements.petInfo.style.transform = 'translateY(20px)';

        setTimeout(() => {
            elements.petInfo.style.transition = 'all 0.5s';
            elements.petInfo.style.opacity = '1';
            elements.petInfo.style.transform = 'translateY(0)';
        }, 10);
    }, 500);

    updatePetDisplay(playerData.pet, true);
});

// 펫 데이터 수신
socket.on('pet-data', (pet) => {
    updatePetDisplay(pet);
});

// 펫 레벨업
socket.on('pet-level-up', (pet) => {
    updatePetDisplay(pet);
    showLevelUpAnimation(pet.level);
    sounds.levelUp();
    showNotification(`🎉 레벨업! ${pet.name}이(가) 레벨 ${pet.level}이 되었습니다!`);
});

// 펫 진화
socket.on('pet-evolution', (pet) => {
    updatePetDisplay(pet);
    sounds.levelUp();
    showNotification(`✨ 진화! ${pet.name}이(가) ${petTypeNames[pet.type]}으로 진화했습니다!`);
});

// 접속자 수 업데이트
socket.on('player-count', (count) => {
    animateValue(elements.playerCount, parseInt(elements.playerCount.textContent) || 0, count);
});

// 매칭 시작
socket.on('matching-started', () => {
    showNotification('매칭 중...');
});

// 매칭 취소
socket.on('matching-cancelled', () => {
    showNotification('매칭이 취소되었습니다.');
});

// 배틀 시작
socket.on('battle-started', (battle) => {
    gameState.isMatching = false;

    // 화면 전환 애니메이션
    elements.lobbyScreen.style.transition = 'opacity 0.5s';
    elements.lobbyScreen.style.opacity = '0';

    setTimeout(() => {
        elements.lobbyScreen.classList.remove('active');
        elements.battleScreen.classList.add('active');
        elements.battleScreen.style.opacity = '0';

        setTimeout(() => {
            elements.battleScreen.style.transition = 'opacity 0.5s';
            elements.battleScreen.style.opacity = '1';
        }, 10);
    }, 500);

    elements.matchBtn.classList.remove('hidden');
    elements.cancelMatchBtn.classList.add('hidden');

    updateBattleDisplay(battle);
    addBattleLog('⚔️ 배틀이 시작되었습니다!');
});

// 배틀 업데이트
socket.on('battle-update', (battle) => {
    updateBattleDisplay(battle);

    // 최근 액션 로그 추가
    if (battle.actions.length > 0) {
        const lastAction = battle.actions[battle.actions.length - 1];
        if (lastAction.result && lastAction.result.message) {
            addBattleLog(lastAction.result.message);
        }
    }
});

// 배틀 종료
socket.on('battle-ended', () => {
    setTimeout(() => {
        // 화면 전환 애니메이션
        elements.battleScreen.style.transition = 'opacity 0.5s';
        elements.battleScreen.style.opacity = '0';

        setTimeout(() => {
            elements.battleScreen.classList.remove('active');
            elements.lobbyScreen.classList.add('active');
            elements.lobbyScreen.style.opacity = '0';

            setTimeout(() => {
                elements.lobbyScreen.style.transition = 'opacity 0.5s';
                elements.lobbyScreen.style.opacity = '1';
            }, 10);

            elements.battleLog.innerHTML = '';
            gameState.battle = null;
        }, 500);
    }, 5000);
});

// 채팅 메시지
socket.on('chat-message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `<span class="player">${data.player}:</span> ${data.message}`;
    messageDiv.style.opacity = '0';
    elements.chatMessages.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.transition = 'opacity 0.3s';
        messageDiv.style.opacity = '1';
    }, 10);

    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
});

// 에러 처리
socket.on('error', (message) => {
    showNotification(message);

    // 로그인 버튼 복구
    if (elements.startBtn.disabled) {
        elements.startBtn.textContent = '게임 시작';
        elements.startBtn.disabled = false;
    }
});

// 연결 상태
socket.on('connect', () => {
    console.log('🟢 서버에 연결되었습니다.');
});

socket.on('disconnect', () => {
    showNotification('⚠️ 서버 연결이 끊어졌습니다. 재연결 중...');
});

socket.on('reconnect', () => {
    showNotification('✅ 서버에 재연결되었습니다!');
});

// ========== 새로운 게임 기능 이벤트 ==========

// 펫 클릭 결과
socket.on('click-result', (data) => {
    // 콤보 표시
    if (data.combo > 1) {
        elements.clickCombo.textContent = `콤보 x${data.combo}`;
        elements.clickCombo.style.display = 'block';
        setTimeout(() => {
            elements.clickCombo.style.display = 'none';
        }, 1000);
    }
});

// 미니게임 보상
socket.on('minigame-reward', (data) => {
    elements.minigameResult.textContent = `${data.message}\n반응속도: ${data.time}초`;
    showNotification(data.message);
});

// 퀘스트 완료
socket.on('quest-completed', (quest) => {
    showNotification(`🎉 퀘스트 완료!\n${quest.title}\n+${quest.reward.exp} EXP, +${quest.reward.gold} 골드`);
});

// 퀘스트 데이터
socket.on('quests-data', (quests) => {
    elements.questList.innerHTML = quests.map(q => `
        <div class="quest-item ${q.completed ? 'completed' : ''}">
            <h3>${q.title}</h3>
            <p>${q.description}</p>
            <div class="quest-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(q.progress / q.target) * 100}%"></div>
                </div>
                <span>${q.progress} / ${q.target}</span>
            </div>
            <div class="quest-reward">보상: ${q.reward.exp} EXP, ${q.reward.gold} 골드</div>
        </div>
    `).join('');
});

// 아이템 목록
socket.on('items-data', (items) => {
    elements.shopGold.textContent = gameState.pet ? gameState.pet.gold : 0;
    elements.shopItems.innerHTML = Object.entries(items).map(([id, item]) => `
        <div class="shop-item">
            <h3>${item.name}</h3>
            <p>가격: ${item.cost} 골드</p>
            <button class="btn btn-small" onclick="buyItem('${id}')">구매</button>
        </div>
    `).join('');
});

// 아이템 사용 결과
socket.on('item-result', (result) => {
    showNotification(result.message);
});

// 배틀 보상
socket.on('battle-reward', (data) => {
    const resultText = data.result === 'win' ? '승리!' : '패배...';
    showNotification(`배틀 ${resultText}\n+${data.expReward} EXP\n+${data.goldReward} 골드`);
});

// 아이템 구매 함수 (전역)
window.buyItem = function(itemId) {
    socket.emit('use-item', itemId);
};

// ========== 펫 케어 이벤트 ==========

// 펫 액션 결과
socket.on('pet-action-result', (data) => {
    const btnMap = {
        feed: elements.feedBtn,
        play: elements.playBtn,
        clean: elements.cleanBtn
    };

    const btn = btnMap[data.type];

    if (data.success) {
        // 성공 메시지 표시
        showNotification(`${data.message}\n+${data.bonusExp} EXP 획득!`);

        // 버튼 활성화 (즉시)
        setTimeout(() => {
            btn.disabled = false;
            btn.style.opacity = '1';
        }, 500);
    } else {
        // 쿨다운 메시지
        showNotification(`${data.message}\n(${data.cooldown}초 후 다시 시도)`);

        // 쿨다운 후 버튼 활성화
        setTimeout(() => {
            btn.disabled = false;
            btn.style.opacity = '1';
        }, data.cooldown * 1000);
    }
});

// 펫 경고 알림
socket.on('pet-needs', (needs) => {
    if (needs.length > 0) {
        const messages = needs.map(n => n.message).join('\n');
        // 경고 메시지를 채팅 로그에 표시
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message warning';
        messageDiv.innerHTML = `<span class="player">⚠️ 알림:</span> ${messages}`;
        messageDiv.style.opacity = '0';
        messageDiv.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
        elements.chatMessages.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s';
            messageDiv.style.opacity = '1';
        }, 10);

        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
});

// ========== 이름 변경 & 랭킹 이벤트 ==========

// 이름 변경 결과
socket.on('rename-result', (result) => {
    showNotification(result.message);
    if (result.success && result.newName) {
        elements.petNameDisplay.textContent = result.newName;
    }
});

// ========== 미세먼지 특수 이벤트 ==========

// 미세먼지 레벨 이벤트
socket.on('dust-event', (event) => {
    // 이벤트 알림 생성
    const eventNotification = document.createElement('div');
    eventNotification.className = 'dust-event-notification';
    eventNotification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${event.color};
        color: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        text-align: center;
        font-size: 18px;
        font-weight: 700;
        max-width: 400px;
        animation: bounceIn 0.5s ease;
    `;
    eventNotification.innerHTML = `
        <h2 style="margin-bottom: 15px; font-size: 28px;">${event.title}</h2>
        <p style="white-space: pre-line; line-height: 1.6;">${event.message}</p>
    `;
    document.body.appendChild(eventNotification);

    // 3초 후 제거
    setTimeout(() => {
        eventNotification.style.transition = 'opacity 0.5s, transform 0.5s';
        eventNotification.style.opacity = '0';
        eventNotification.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            eventNotification.remove();
        }, 500);
    }, 3000);

    // 채팅에도 추가
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `<span class="player" style="color: ${event.color};">${event.title}</span> ${event.message.split('\n')[0]}`;
    messageDiv.style.opacity = '0';
    messageDiv.style.backgroundColor = `${event.color}22`;
    elements.chatMessages.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.transition = 'opacity 0.3s';
        messageDiv.style.opacity = '1';
    }, 10);

    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
});

// 랭킹 데이터
socket.on('rankings-data', (rankings) => {
    if (!rankings || rankings.length === 0) {
        elements.rankingList.innerHTML = '<p style="text-align: center; padding: 20px;">아직 랭킹 데이터가 없습니다.</p>';
        return;
    }

    elements.rankingList.innerHTML = rankings.map((player, index) => `
        <div class="ranking-item ${index < 3 ? 'top-' + (index + 1) : ''}">
            <div class="ranking-rank">${index + 1}위</div>
            <div class="ranking-info">
                <div class="ranking-name">
                    ${player.playerName}의 ${player.petName} (Lv.${player.level})
                </div>
                <div class="ranking-stats">
                    ${petTypeEmojis[player.type] || '🐾'} |
                    승률: ${player.winRate}% (${player.battleWins}승/${player.totalBattles}전) |
                    골드: ${player.gold}
                </div>
            </div>
        </div>
    `).join('');
});

// ========================================
// 초기화 실행
// ========================================
init();
