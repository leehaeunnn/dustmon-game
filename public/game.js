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
    renameInput: document.getElementById('new-name-input'),
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

// 공격 돌진 애니메이션
function playAttackAnimation(attackerElement, isLeft) {
    if (!attackerElement) return;
    const animClass = isLeft ? 'attack-animation-left' : 'attack-animation-right';
    attackerElement.classList.add(animClass);
    setTimeout(() => {
        attackerElement.classList.remove(animClass);
    }, 600);
}

// 강공격 애니메이션
function playPowerAttackAnimation(attackerElement, isLeft) {
    if (!attackerElement) return;
    const animClass = isLeft ? 'power-attack-animation-left' : 'power-attack-animation-right';
    attackerElement.classList.add(animClass);
    setTimeout(() => {
        attackerElement.classList.remove(animClass);
    }, 800);
}

// 피격 넉백 애니메이션
function playHitAnimation(defenderElement, isLeft) {
    if (!defenderElement) return;
    const animClass = isLeft ? 'hit-animation-left' : 'hit-animation-right';
    defenderElement.classList.add(animClass);
    setTimeout(() => {
        defenderElement.classList.remove(animClass);
    }, 500);
}

// 방어 애니메이션
function playDefendAnimation(element) {
    if (!element) return;
    element.classList.add('defend-animation');
    element.classList.add('defending');
    setTimeout(() => {
        element.classList.remove('defend-animation');
    }, 800);
    // 방어 상태 2초 유지
    setTimeout(() => {
        element.classList.remove('defending');
    }, 2000);
}

// 회복 이펙트 애니메이션
function playHealEffectAnimation(element) {
    if (!element) return;
    element.classList.add('heal-effect-animation');
    setTimeout(() => {
        element.classList.remove('heal-effect-animation');
    }, 800);
}

// 회피 애니메이션
function playDodgeAnimation(element, isLeft) {
    if (!element) return;
    const animClass = isLeft ? 'dodge-animation-left' : 'dodge-animation-right';
    element.classList.add(animClass);
    setTimeout(() => {
        element.classList.remove(animClass);
    }, 500);
}

// 이펙트 오버레이 생성
function showBattleEffect(emoji, duration = 800) {
    const battleArena = document.querySelector('.battle-arena');
    if (!battleArena) return;

    const effect = document.createElement('div');
    effect.className = 'battle-effect-overlay';
    effect.textContent = emoji;
    effect.style.position = 'absolute';
    battleArena.style.position = 'relative';
    battleArena.appendChild(effect);

    setTimeout(() => {
        effect.remove();
    }, duration);
}

// (이전 자동 애니메이션 코드 제거됨 - 액션 배틀 시스템에서 직접 조작)

// 공격 돌진 애니메이션 (실제 이동)
function playRushAttackAnimation(attackerElement, isLeft, callback) {
    if (!attackerElement) return;

    // 기존 transition 저장
    const originalTransition = attackerElement.style.transition;

    // 빠른 돌진
    attackerElement.style.transition = 'transform 0.15s ease-in';
    const rushDistance = isLeft ? 150 : -150;

    // 돌진
    attackerElement.style.transform = `translateX(${rushDistance}px) scale(1.2)`;

    // 복귀
    setTimeout(() => {
        attackerElement.style.transition = 'transform 0.3s ease-out';
        attackerElement.style.transform = 'translate(0, 0) scale(1)';

        setTimeout(() => {
            attackerElement.style.transition = originalTransition || 'transform 0.3s ease-out';
            if (callback) callback();
        }, 300);
    }, 200);
}

// 강공격 돌진 애니메이션 (더 강력한 이동)
function playPowerRushAnimation(attackerElement, isLeft, callback) {
    if (!attackerElement) return;

    const originalTransition = attackerElement.style.transition;

    // 뒤로 물러나기 (힘 모으기)
    attackerElement.style.transition = 'transform 0.2s ease-out';
    const chargeBack = isLeft ? -40 : 40;
    attackerElement.style.transform = `translateX(${chargeBack}px) scale(1.3) rotate(${isLeft ? -10 : 10}deg)`;

    // 강력한 돌진
    setTimeout(() => {
        attackerElement.style.transition = 'transform 0.12s ease-in';
        const rushDistance = isLeft ? 200 : -200;
        attackerElement.style.transform = `translateX(${rushDistance}px) scale(1.4) rotate(${isLeft ? 15 : -15}deg)`;

        // 복귀
        setTimeout(() => {
            attackerElement.style.transition = 'transform 0.4s ease-out';
            attackerElement.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';

            setTimeout(() => {
                attackerElement.style.transition = originalTransition || 'transform 0.3s ease-out';
                if (callback) callback();
            }, 400);
        }, 150);
    }, 250);
}

// 피격 넉백 애니메이션
function playKnockbackAnimation(defenderElement, isLeft) {
    if (!defenderElement) return;

    const originalTransition = defenderElement.style.transition;
    const knockbackDistance = isLeft ? -60 : 60;

    // 넉백 + 빨간색 플래시
    defenderElement.style.transition = 'transform 0.1s ease-out, filter 0.1s';
    defenderElement.style.transform = `translateX(${knockbackDistance}px) scale(0.9)`;
    defenderElement.style.filter = 'brightness(2) sepia(1) saturate(5) hue-rotate(-50deg)';

    // 흔들림
    setTimeout(() => {
        defenderElement.style.transform = `translateX(${knockbackDistance * 0.7}px) scale(0.95)`;
        defenderElement.style.filter = 'brightness(1.5)';
    }, 100);

    // 복귀
    setTimeout(() => {
        defenderElement.style.transition = 'transform 0.3s ease-out, filter 0.3s';
        defenderElement.style.transform = 'translate(0, 0) scale(1)';
        defenderElement.style.filter = 'brightness(1)';

        setTimeout(() => {
            defenderElement.style.transition = originalTransition || 'transform 0.3s ease-out';
        }, 300);
    }, 200);
}

// 회피 점프 애니메이션
function playDodgeJumpAnimation(element, isLeft) {
    if (!element) return;

    const originalTransition = element.style.transition;
    const dodgeX = isLeft ? -80 : 80;

    // 점프 회피
    element.style.transition = 'transform 0.2s ease-out';
    element.style.transform = `translate(${dodgeX}px, -50px) rotate(${isLeft ? -20 : 20}deg)`;
    element.style.opacity = '0.7';

    // 착지
    setTimeout(() => {
        element.style.transform = `translate(${dodgeX * 0.5}px, 0) rotate(0deg)`;
        element.style.opacity = '1';
    }, 200);

    // 복귀
    setTimeout(() => {
        element.style.transition = 'transform 0.3s ease-out';
        element.style.transform = 'translate(0, 0)';

        setTimeout(() => {
            element.style.transition = originalTransition || 'transform 0.3s ease-out';
        }, 300);
    }, 350);
}

// 방어 자세 애니메이션
function playDefendStanceAnimation(element) {
    if (!element) return;

    const originalTransition = element.style.transition;

    // 방어 자세
    element.style.transition = 'transform 0.15s ease-out, filter 0.15s';
    element.style.transform = 'scale(0.85) translateY(10px)';
    element.style.filter = 'brightness(1.3) drop-shadow(0 0 20px #2196F3)';

    // 방어 유지 (2초)
    setTimeout(() => {
        element.style.transition = 'transform 0.3s ease-out, filter 0.3s';
        element.style.transform = 'scale(1) translateY(0)';
        element.style.filter = 'brightness(1)';

        setTimeout(() => {
            element.style.transition = originalTransition || 'transform 0.3s ease-out';
        }, 300);
    }, 2000);
}

// 회복 애니메이션
function playHealingAnimation(element) {
    if (!element) return;

    const originalTransition = element.style.transition;

    // 빛나는 효과
    element.style.transition = 'transform 0.3s ease-out, filter 0.3s';
    element.style.transform = 'scale(1.15) translateY(-20px)';
    element.style.filter = 'brightness(1.5) drop-shadow(0 0 30px #4CAF50)';

    // 원래대로
    setTimeout(() => {
        element.style.transform = 'scale(1) translateY(0)';
        element.style.filter = 'brightness(1)';

        setTimeout(() => {
            element.style.transition = originalTransition || 'transform 0.3s ease-out';
        }, 300);
    }, 600);
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
let hasDrawn = false; // 캔버스에 그림을 그렸는지 추적

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
    hasDrawn = true; // 그림을 그렸음
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
    hasDrawn = true; // 그림을 그렸음
    lastY = y;
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false; // 그림 리셋
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
    let imageData = null;

    // 그리기 탭이 활성화되어 있고 실제로 그림을 그렸으면 Canvas 내용 사용
    if (elements.drawTabBtn.classList.contains('active') && hasDrawn) {
        imageData = canvas.toDataURL('image/png');
    } else if (petImageData) {
        // 업로드 탭에서 이미지를 업로드한 경우
        imageData = petImageData;
    }

    socket.emit('register-player', {
        playerName,
        petName,
        petImage: imageData // base64 이미지 데이터 (그린 경우만)
    });
}

// 매칭 요청
function handleRequestMatch() {
    if (gameState.isMatching) return;

    gameState.isMatching = true;
    socket.emit('request-match');
    elements.matchBtn.classList.add('hidden');
    elements.cancelMatchBtn.classList.remove('hidden');
    // 토스트 형태로 표시 (확인 버튼 없음)
    showMatchingStatus('매칭 중... 상대를 찾고 있습니다');
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
    if (!gameState.battle || gameState.battle.status === "finished") return;

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
}

// 채팅 메시지 전송
function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;

    // 플레이어가 등록되지 않은 경우 경고
    if (!gameState.playerId) {
        showNotification('먼저 게임을 시작해주세요!');
        return;
    }

    socket.emit('chat-message', message);
    elements.chatInput.value = '';
    elements.chatInput.focus();
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
    const renderPetImage = () => {
        if (pet.customImage) {
            // 커스텀 이미지가 있으면 이미지로 표시 (120px x 120px)
            elements.petEmoji.innerHTML = `<img src="${pet.customImage}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">`;
            elements.petEmoji.style.fontSize = '0'; // 이미지 사용시 폰트 크기 제거
        } else {
            // 없으면 이모지 표시
            elements.petEmoji.innerHTML = '';
            elements.petEmoji.textContent = petTypeEmojis[pet.type] || '🐾';
            elements.petEmoji.style.fontSize = '120px';
        }
    };

    if (oldPet && (oldPet.type !== pet.type || oldPet.customImage !== pet.customImage)) {
        elements.petSprite.style.transform = 'scale(0) rotate(360deg)';
        setTimeout(() => {
            renderPetImage();
            elements.petSprite.style.transform = 'scale(1) rotate(0deg)';
        }, 300);
    } else {
        renderPetImage();
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
    // 커스텀 이미지가 있으면 이미지로, 없으면 이모지로 표시
    if (myPet.customImage) {
        elements.battlePet1Sprite.innerHTML = `<img src="${myPet.customImage}" style="width: 140px; height: 140px; object-fit: contain; border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">`;
        elements.battlePet1Sprite.style.fontSize = '0';
    } else {
        elements.battlePet1Sprite.innerHTML = '';
        elements.battlePet1Sprite.textContent = petTypeEmojis[myPet.type] || '🐾';
        elements.battlePet1Sprite.style.fontSize = '140px';
    }

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
    // 커스텀 이미지가 있으면 이미지로, 없으면 이모지로 표시
    if (enemyPet.customImage) {
        elements.battlePet2Sprite.innerHTML = `<img src="${enemyPet.customImage}" style="width: 140px; height: 140px; object-fit: contain; border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">`;
        elements.battlePet2Sprite.style.fontSize = '0';
    } else {
        elements.battlePet2Sprite.innerHTML = '';
        elements.battlePet2Sprite.textContent = petTypeEmojis[enemyPet.type] || '🐾';
        elements.battlePet2Sprite.style.fontSize = '140px';
    }

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

    // 실시간 전투 상태 표시
    if (battle.status === 'finished') {
        elements.turnIndicator.textContent = '배틀 종료';
        elements.turnIndicator.style.animation = 'none';
    } else {
        // 방어 상태 표시
        let statusText = '⚔️ 실시간 배틀!';
        if (battle.myDefendStatus && battle.myDefendStatus.active) {
            statusText = '🛡️ 방어 중! (' + battle.myDefendStatus.remaining + '초)';
        }
        if (battle.enemyDefendStatus && battle.enemyDefendStatus.active) {
            statusText += ' | 상대 방어 중!';
        }
        elements.turnIndicator.textContent = statusText;
        elements.turnIndicator.style.animation = 'pulse 1.5s infinite';
    }

    // 쿨다운 기반 버튼 활성화
    if (battle.myCooldowns) {
        updateCooldownButtons(battle.myCooldowns, battle.status === 'finished');
    }
}

// 쿨다운 버튼 업데이트
function updateCooldownButtons(cooldowns, isFinished) {
    document.querySelectorAll('.battle-action-btn').forEach(btn => {
        const action = btn.dataset.action;
        const skillId = btn.dataset.skill;
        const cdKey = action === 'skill' ? skillId : action;

        if (isFinished) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            return;
        }

        const cd = cooldowns[cdKey];
        if (cd && !cd.ready) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.textContent = btn.textContent.split(' ')[0] + ' (' + cd.remaining + 's)';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            // 원래 텍스트로 복원
            const labels = { attack: '⚔️ 공격', defend: '🛡️ 방어', heal: '💚 회복', power_attack: '💥 강공격', speed_boost: '⚡ 속도' };
            btn.textContent = labels[cdKey] || btn.textContent.split(' ')[0];
        }
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

// 매칭 중 표시 (토스트 형태 - 확인 버튼 없이)
let matchingToast = null;
function showMatchingStatus(message) {
    // 기존 토스트 제거
    hideMatchingStatus();

    matchingToast = document.createElement('div');
    matchingToast.className = 'matching-toast';
    matchingToast.innerHTML = `
        <div class="matching-spinner"></div>
        <span>${message}</span>
    `;
    document.body.appendChild(matchingToast);
}

function hideMatchingStatus() {
    if (matchingToast) {
        matchingToast.remove();
        matchingToast = null;
    }
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
    showMatchingStatus('매칭 중... 상대를 찾고 있습니다');
});

// 매칭 취소
socket.on('matching-cancelled', () => {
    hideMatchingStatus();
    showNotification('매칭이 취소되었습니다.');
});

// 배틀 시작 - 액션 배틀 시스템으로 이동됨 (파일 하단 참조)

// 배틀 업데이트
socket.on('battle-update', (battle) => {
    const oldBattle = gameState.battle;

    // 최근 액션 확인 및 애니메이션 재생
    if (battle.actions.length > 0) {
        const lastAction = battle.actions[battle.actions.length - 1];
        if (lastAction.result) {
            const isPlayer1 = battle.player1Id === socket.id;
            const isMyAction = (lastAction.player === 'player1' && isPlayer1) ||
                              (lastAction.player === 'player2' && !isPlayer1);

            // 공격자와 방어자 요소 결정
            const mySprite = elements.battlePet1Sprite;
            const enemySprite = elements.battlePet2Sprite;
            const attackerSprite = isMyAction ? mySprite : enemySprite;
            const defenderSprite = isMyAction ? enemySprite : mySprite;

            // 액션 타입에 따른 애니메이션 (실제 움직임)
            if (lastAction.result.type === 'attack') {
                // 공격 돌진 애니메이션
                playRushAttackAnimation(attackerSprite, isMyAction, () => {
                    showBattleEffect('⚔️');
                });

                // 피격 애니메이션 (공격 후 딜레이)
                setTimeout(() => {
                    if (lastAction.result.blocked) {
                        playDefendStanceAnimation(defenderSprite);
                        showBattleEffect('🛡️');
                    } else {
                        playKnockbackAnimation(defenderSprite, !isMyAction);
                        showBattleEffect('💥');
                    }
                }, 200);

            } else if (lastAction.result.type === 'skill') {
                if (lastAction.result.skillId === 'power_attack') {
                    // 강공격 돌진 애니메이션
                    playPowerRushAnimation(attackerSprite, isMyAction, () => {
                        showBattleEffect('💥');
                    });

                    setTimeout(() => {
                        if (lastAction.result.blocked) {
                            playDefendStanceAnimation(defenderSprite);
                        } else {
                            playKnockbackAnimation(defenderSprite, !isMyAction);
                        }
                    }, 400);

                } else if (lastAction.result.skillId === 'heal') {
                    // 회복 애니메이션
                    playHealingAnimation(attackerSprite);
                    showBattleEffect('💚');
                }

            } else if (lastAction.result.type === 'defend') {
                // 방어 자세
                playDefendStanceAnimation(attackerSprite);
                showBattleEffect('🛡️');
            }

            // 로그 추가
            if (lastAction.result.message) {
                addBattleLog(lastAction.result.message);
            }
        }
    }

    updateBattleDisplay(battle);
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
            gameState.isMatching = false;
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

// 액션 실패 (쿨다운)
socket.on('action-failed', (data) => {
    showNotification(data.message);
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
// 액션 RPG 배틀 시스템
// ========================================

// 액션 배틀 상태
const actionBattle = {
    active: false,
    arena: null,
    myPet: null,
    enemyPet: null,

    // 내 펫 상태
    myPos: { x: 15, y: 100 }, // % 기준 위치
    myVel: { x: 0, y: 0 },
    myHp: 100,
    myMaxHp: 100,
    myDefending: false,
    myDefendUntil: 0,

    // 상대 펫 상태
    enemyPos: { x: 75, y: 100 },
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyDefending: false,

    // 쿨다운
    cooldowns: {
        melee: 0,
        ranged: 0,
        defend: 0,
        item: 0
    },

    // 발사체
    projectiles: [],

    // 타이머
    battleTimer: 60,
    timerInterval: null,

    // 게임 루프
    gameLoop: null,
    lastTime: 0,

    // 키 입력 상태
    keys: {
        up: false,
        down: false,
        left: false,
        right: false
    },

    // 조이스틱 상태
    joystick: {
        active: false,
        startX: 0,
        startY: 0,
        deltaX: 0,
        deltaY: 0
    },

    // 상수
    MOVE_SPEED: 2,
    MELEE_RANGE: 18, // % 기준
    MELEE_DAMAGE: 15,
    RANGED_DAMAGE: 10,
    PROJECTILE_SPEED: 5,
    ARENA_MIN_X: 3,
    ARENA_MAX_X: 97,
    ARENA_MIN_Y: 10,
    ARENA_MAX_Y: 320
};

// 액션 배틀 DOM 요소
const actionElements = {
    arena: null,
    myPet: null,
    enemyPet: null,
    myHpFill: null,
    myHpText: null,
    enemyHpFill: null,
    enemyHpText: null,
    battleTimer: null,
    battleLog: null,
    projectilesContainer: null,
    effectsContainer: null,
    joystickStick: null,
    joystickBase: null,
    meleeBtn: null,
    rangedBtn: null,
    defendBtn: null,
    itemBtn: null
};

// 액션 배틀 초기화
function initActionBattle() {
    // DOM 요소 가져오기
    actionElements.arena = document.getElementById('action-arena');
    actionElements.myPet = document.getElementById('my-pet');
    actionElements.enemyPet = document.getElementById('enemy-pet');
    actionElements.myHpFill = document.getElementById('hud-my-hp');
    actionElements.myHpText = document.getElementById('hud-my-hp-text');
    actionElements.enemyHpFill = document.getElementById('hud-enemy-hp');
    actionElements.enemyHpText = document.getElementById('hud-enemy-hp-text');
    actionElements.battleTimer = document.getElementById('battle-timer');
    actionElements.battleLog = document.getElementById('battle-log');
    actionElements.projectilesContainer = document.getElementById('projectiles-container');
    actionElements.effectsContainer = document.getElementById('effects-container');
    actionElements.joystickStick = document.getElementById('joystick-stick');
    actionElements.joystickBase = document.querySelector('.joystick-base');
    actionElements.meleeBtn = document.getElementById('melee-btn');
    actionElements.rangedBtn = document.getElementById('ranged-btn');
    actionElements.defendBtn = document.getElementById('defend-btn');
    actionElements.itemBtn = document.getElementById('item-btn');

    // 키보드 이벤트
    document.addEventListener('keydown', handleActionKeyDown);
    document.addEventListener('keyup', handleActionKeyUp);

    // 조이스틱 이벤트
    if (actionElements.joystickBase) {
        actionElements.joystickBase.addEventListener('mousedown', startJoystick);
        actionElements.joystickBase.addEventListener('touchstart', startJoystick);
        document.addEventListener('mousemove', moveJoystick);
        document.addEventListener('touchmove', moveJoystick);
        document.addEventListener('mouseup', endJoystick);
        document.addEventListener('touchend', endJoystick);
    }

    // 액션 버튼 이벤트
    if (actionElements.meleeBtn) {
        actionElements.meleeBtn.addEventListener('click', () => performMeleeAttack());
    }
    if (actionElements.rangedBtn) {
        actionElements.rangedBtn.addEventListener('click', () => performRangedAttack());
    }
    if (actionElements.defendBtn) {
        actionElements.defendBtn.addEventListener('click', () => performDefend());
    }
    if (actionElements.itemBtn) {
        actionElements.itemBtn.addEventListener('click', () => useItem());
    }
}

// 키보드 입력 처리
function handleActionKeyDown(e) {
    if (!actionBattle.active) return;

    switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            actionBattle.keys.up = true;
            break;
        case 's':
        case 'arrowdown':
            actionBattle.keys.down = true;
            break;
        case 'a':
        case 'arrowleft':
            actionBattle.keys.left = true;
            break;
        case 'd':
        case 'arrowright':
            actionBattle.keys.right = true;
            break;
        case 'z':
            performMeleeAttack();
            break;
        case 'x':
            performRangedAttack();
            break;
        case 'c':
            performDefend();
            break;
        case 'v':
            useItem();
            break;
    }
}

function handleActionKeyUp(e) {
    switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            actionBattle.keys.up = false;
            break;
        case 's':
        case 'arrowdown':
            actionBattle.keys.down = false;
            break;
        case 'a':
        case 'arrowleft':
            actionBattle.keys.left = false;
            break;
        case 'd':
        case 'arrowright':
            actionBattle.keys.right = false;
            break;
    }
}

// 조이스틱 처리
function startJoystick(e) {
    e.preventDefault();
    actionBattle.joystick.active = true;

    const rect = actionElements.joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    actionBattle.joystick.startX = centerX;
    actionBattle.joystick.startY = centerY;
}

function moveJoystick(e) {
    if (!actionBattle.joystick.active) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const maxDistance = 40;
    let deltaX = clientX - actionBattle.joystick.startX;
    let deltaY = clientY - actionBattle.joystick.startY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
    }

    // 더 빠른 반응을 위해 1.5배 증폭
    actionBattle.joystick.deltaX = (deltaX / maxDistance) * 1.5;
    actionBattle.joystick.deltaY = (deltaY / maxDistance) * 1.5;

    if (actionElements.joystickStick) {
        actionElements.joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
}

function endJoystick(e) {
    actionBattle.joystick.active = false;
    actionBattle.joystick.deltaX = 0;
    actionBattle.joystick.deltaY = 0;

    if (actionElements.joystickStick) {
        actionElements.joystickStick.style.transform = 'translate(0, 0)';
    }
}

// 액션 배틀 시작
function startActionBattle(battle) {
    actionBattle.active = true;

    // 내가 플레이어1인지 확인
    const isPlayer1 = battle.player1Id === socket.id;
    const myPetData = isPlayer1 ? battle.pet1 : battle.pet2;
    const enemyPetData = isPlayer1 ? battle.pet2 : battle.pet1;

    // HP 설정
    actionBattle.myHp = myPetData.stats.hp;
    actionBattle.myMaxHp = myPetData.stats.maxHp;
    actionBattle.enemyHp = enemyPetData.stats.hp;
    actionBattle.enemyMaxHp = enemyPetData.stats.maxHp;

    // 위치 초기화
    actionBattle.myPos = { x: 15, y: 100 };
    actionBattle.enemyPos = { x: 75, y: 100 };
    actionBattle.myVel = { x: 0, y: 0 };

    // 쿨다운 초기화
    actionBattle.cooldowns = { melee: 0, ranged: 0, defend: 0, item: 0 };

    // 발사체 초기화
    actionBattle.projectiles = [];

    // 타이머 시작
    actionBattle.battleTimer = 60;
    if (actionBattle.timerInterval) clearInterval(actionBattle.timerInterval);
    actionBattle.timerInterval = setInterval(() => {
        actionBattle.battleTimer--;
        if (actionElements.battleTimer) {
            actionElements.battleTimer.textContent = actionBattle.battleTimer;
        }
        if (actionBattle.battleTimer <= 0) {
            endActionBattle();
        }
    }, 1000);

    // HUD 업데이트
    updateActionHUD(isPlayer1 ? battle.player1Name : battle.player2Name,
                    isPlayer1 ? battle.player2Name : battle.player1Name,
                    myPetData, enemyPetData);

    // 펫 스프라이트 설정
    setPetSprite(actionElements.myPet, myPetData);
    setPetSprite(actionElements.enemyPet, enemyPetData);

    // 게임 루프 시작
    actionBattle.lastTime = performance.now();
    if (actionBattle.gameLoop) cancelAnimationFrame(actionBattle.gameLoop);
    actionBattle.gameLoop = requestAnimationFrame(actionGameLoop);

    // 로그 추가
    addActionLog('⚔️ 액션 배틀 시작!');
}

// 펫 스프라이트 설정
function setPetSprite(element, petData) {
    if (!element) return;
    const spriteDiv = element.querySelector('.pet-sprite');
    if (!spriteDiv) return;

    if (petData.customImage) {
        spriteDiv.innerHTML = `<img src="${petData.customImage}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 10px;">`;
        spriteDiv.style.fontSize = '0';
    } else {
        spriteDiv.innerHTML = '';
        spriteDiv.textContent = petTypeEmojis[petData.type] || '🐾';
        spriteDiv.style.fontSize = '80px';
    }
}

// HUD 업데이트
function updateActionHUD(myName, enemyName, myPetData, enemyPetData) {
    const myNameEl = document.getElementById('hud-my-name');
    const enemyNameEl = document.getElementById('hud-enemy-name');

    if (myNameEl) myNameEl.textContent = myName;
    if (enemyNameEl) enemyNameEl.textContent = enemyName;

    updateHpDisplay();
}

function updateHpDisplay() {
    if (actionElements.myHpFill) {
        const myPercent = (actionBattle.myHp / actionBattle.myMaxHp) * 100;
        actionElements.myHpFill.style.width = myPercent + '%';
        if (myPercent < 30) {
            actionElements.myHpFill.classList.add('low');
        } else {
            actionElements.myHpFill.classList.remove('low');
        }
    }
    if (actionElements.myHpText) {
        actionElements.myHpText.textContent = `${Math.max(0, Math.floor(actionBattle.myHp))}/${actionBattle.myMaxHp}`;
    }

    if (actionElements.enemyHpFill) {
        const enemyPercent = (actionBattle.enemyHp / actionBattle.enemyMaxHp) * 100;
        actionElements.enemyHpFill.style.width = enemyPercent + '%';
        if (enemyPercent < 30) {
            actionElements.enemyHpFill.classList.add('low');
        } else {
            actionElements.enemyHpFill.classList.remove('low');
        }
    }
    if (actionElements.enemyHpText) {
        actionElements.enemyHpText.textContent = `${Math.max(0, Math.floor(actionBattle.enemyHp))}/${actionBattle.enemyMaxHp}`;
    }
}

// 게임 루프
function actionGameLoop(timestamp) {
    if (!actionBattle.active) return;

    const deltaTime = timestamp - actionBattle.lastTime;
    actionBattle.lastTime = timestamp;

    // 이동 처리
    updateMovement(deltaTime);

    // 내 위치를 서버에 전송 (60fps -> 20fps로 제한)
    actionBattle.syncCounter = (actionBattle.syncCounter || 0) + 1;
    if (actionBattle.syncCounter >= 3) {
        actionBattle.syncCounter = 0;
        sendPositionUpdate();
    }

    // 발사체 업데이트
    updateProjectiles(deltaTime);

    // 쿨다운 업데이트
    updateCooldowns(deltaTime);

    // 방어 상태 체크
    checkDefenseStatus();

    // 상대 방어 상태 체크
    checkEnemyDefenseStatus();

    // 위치 렌더링
    renderPositions();

    // 승패 체크
    if (actionBattle.myHp <= 0 || actionBattle.enemyHp <= 0) {
        endActionBattle();
        return;
    }

    actionBattle.gameLoop = requestAnimationFrame(actionGameLoop);
}

// 내 위치를 서버에 전송
function sendPositionUpdate() {
    socket.emit('action-position', {
        x: actionBattle.myPos.x,
        y: actionBattle.myPos.y,
        defending: actionBattle.myDefending
    });
}

// 상대 방어 상태 체크
function checkEnemyDefenseStatus() {
    if (actionBattle.enemyDefending && actionBattle.enemyDefendUntil && Date.now() > actionBattle.enemyDefendUntil) {
        actionBattle.enemyDefending = false;
        if (actionElements.enemyPet) {
            actionElements.enemyPet.classList.remove('defending');
        }
    }
}

// 이동 처리
function updateMovement(deltaTime) {
    let moveX = 0;
    let moveY = 0;

    // 키보드 입력
    if (actionBattle.keys.left) moveX -= 1;
    if (actionBattle.keys.right) moveX += 1;
    if (actionBattle.keys.up) moveY += 1;
    if (actionBattle.keys.down) moveY -= 1;

    // 조이스틱 입력 (Y축 반전: 위로 드래그하면 위로 이동)
    if (actionBattle.joystick.active) {
        moveX += actionBattle.joystick.deltaX;
        moveY -= actionBattle.joystick.deltaY;
    }

    // 속도 적용 (좌우는 느리게)
    const speed = actionBattle.MOVE_SPEED * (deltaTime / 16);
    actionBattle.myPos.x += moveX * speed * 0.5;
    actionBattle.myPos.y += moveY * speed;

    // 경계 체크
    actionBattle.myPos.x = Math.max(actionBattle.ARENA_MIN_X,
                                    Math.min(actionBattle.ARENA_MAX_X, actionBattle.myPos.x));
    actionBattle.myPos.y = Math.max(actionBattle.ARENA_MIN_Y,
                                    Math.min(actionBattle.ARENA_MAX_Y, actionBattle.myPos.y));

    // 방향 전환
    if (actionElements.myPet) {
        if (moveX > 0) {
            actionElements.myPet.classList.add('facing-right');
            actionElements.myPet.classList.remove('facing-left');
        } else if (moveX < 0) {
            actionElements.myPet.classList.add('facing-left');
            actionElements.myPet.classList.remove('facing-right');
        }
    }
}

// 위치 렌더링
function renderPositions() {
    if (actionElements.myPet) {
        actionElements.myPet.style.left = actionBattle.myPos.x + '%';
        actionElements.myPet.style.bottom = actionBattle.myPos.y + 'px';
    }

    if (actionElements.enemyPet) {
        actionElements.enemyPet.style.left = actionBattle.enemyPos.x + '%';
        actionElements.enemyPet.style.bottom = actionBattle.enemyPos.y + 'px';
    }
}

// 근거리 공격
function performMeleeAttack() {
    if (!actionBattle.active) return;
    if (Date.now() < actionBattle.cooldowns.melee) return;

    // 쿨다운 설정 (1초)
    actionBattle.cooldowns.melee = Date.now() + 1000;

    // 거리 체크
    const distance = Math.abs(actionBattle.myPos.x - actionBattle.enemyPos.x);

    // 공격 애니메이션
    if (actionElements.myPet) {
        actionElements.myPet.classList.add('attacking');
        setTimeout(() => actionElements.myPet.classList.remove('attacking'), 200);
    }

    // 이펙트 생성
    createEffect(actionBattle.myPos.x + 5, actionBattle.myPos.y, '⚔️');

    if (distance <= actionBattle.MELEE_RANGE) {
        // 데미지 계산
        let damage = actionBattle.MELEE_DAMAGE;
        const isCritical = Math.random() < 0.15;
        if (isCritical) damage *= 1.5;

        // 로그
        addActionLog(`⚔️ 근접 공격! ${Math.floor(damage)} 데미지${isCritical ? ' (크리티컬!)' : ''}`);

        // 서버에 알림 (상대에게 전달됨)
        socket.emit('action-melee', { damage: damage, isCritical: isCritical });
    } else {
        addActionLog('⚔️ 공격 범위 밖!');
    }

    updateCooldownDisplay();
}

// 원거리 공격
function performRangedAttack() {
    if (!actionBattle.active) return;
    if (Date.now() < actionBattle.cooldowns.ranged) return;

    // 쿨다운 설정 (2초)
    actionBattle.cooldowns.ranged = Date.now() + 2000;

    // 발사체 생성
    const direction = actionBattle.enemyPos.x > actionBattle.myPos.x ? 1 : -1;
    const projectile = {
        id: Date.now(),
        x: actionBattle.myPos.x,
        y: actionBattle.myPos.y + 30,
        velX: direction * actionBattle.PROJECTILE_SPEED,
        damage: actionBattle.RANGED_DAMAGE,
        isPlayer: true,
        element: null
    };

    // 발사체 DOM 요소 생성
    const projElement = document.createElement('div');
    projElement.className = 'projectile player-projectile';
    projElement.textContent = '🌟';
    projElement.style.left = projectile.x + '%';
    projElement.style.bottom = projectile.y + 'px';
    if (actionElements.projectilesContainer) {
        actionElements.projectilesContainer.appendChild(projElement);
    }
    projectile.element = projElement;

    actionBattle.projectiles.push(projectile);

    // 서버에 알림 (상대에게 발사체 생성하라고 전달)
    socket.emit('action-ranged', { damage: actionBattle.RANGED_DAMAGE });

    addActionLog('🎯 원거리 공격 발사!');
    updateCooldownDisplay();
}

// 발사체 업데이트
function updateProjectiles(deltaTime) {
    const toRemove = [];

    for (const proj of actionBattle.projectiles) {
        // 위치 업데이트
        proj.x += proj.velX * (deltaTime / 16);

        // DOM 업데이트
        if (proj.element) {
            proj.element.style.left = proj.x + '%';
        }

        // 플레이어 발사체: 적과 충돌 체크
        if (proj.isPlayer) {
            const hitDistance = Math.abs(proj.x - actionBattle.enemyPos.x);
            if (hitDistance < 8) {
                // 데미지 적용
                let damage = proj.damage;
                if (actionBattle.enemyDefending) {
                    damage *= 0.3;
                }
                actionBattle.enemyHp -= damage;
                updateHpDisplay();

                // 피격 효과
                if (actionElements.enemyPet) {
                    actionElements.enemyPet.classList.add('hit');
                    setTimeout(() => actionElements.enemyPet.classList.remove('hit'), 300);
                }

                showDamageText(actionBattle.enemyPos.x, actionBattle.enemyPos.y, damage, false);
                addActionLog(`🎯 명중! ${Math.floor(damage)} 데미지`);

                socket.emit('action-battle-attack', { type: 'ranged', damage: damage });
                toRemove.push(proj);
            }
        } else {
            // 적 발사체: 플레이어와 충돌 체크
            const hitDistance = Math.abs(proj.x - actionBattle.myPos.x);
            if (hitDistance < 8) {
                let damage = proj.damage;
                if (actionBattle.myDefending) {
                    damage *= 0.3;
                }
                actionBattle.myHp -= damage;
                updateHpDisplay();

                if (actionElements.myPet) {
                    actionElements.myPet.classList.add('hit');
                    setTimeout(() => actionElements.myPet.classList.remove('hit'), 300);
                }

                showDamageText(actionBattle.myPos.x, actionBattle.myPos.y, damage, false);
                toRemove.push(proj);
            }
        }

        // 화면 밖으로 나감
        if (proj.x < 0 || proj.x > 100) {
            toRemove.push(proj);
        }
    }

    // 제거
    for (const proj of toRemove) {
        if (proj.element) {
            proj.element.remove();
        }
        const idx = actionBattle.projectiles.indexOf(proj);
        if (idx > -1) {
            actionBattle.projectiles.splice(idx, 1);
        }
    }
}

// 방어
function performDefend() {
    if (!actionBattle.active) return;
    if (Date.now() < actionBattle.cooldowns.defend) return;

    // 쿨다운 설정 (5초)
    actionBattle.cooldowns.defend = Date.now() + 5000;

    // 방어 상태
    actionBattle.myDefending = true;
    actionBattle.myDefendUntil = Date.now() + 2000;

    // 방어 애니메이션
    if (actionElements.myPet) {
        actionElements.myPet.classList.add('defending');
    }

    // 서버에 알림 (상대에게 방어 상태 전달)
    socket.emit('action-defend', {});

    createEffect(actionBattle.myPos.x, actionBattle.myPos.y, '🛡️');
    addActionLog('🛡️ 방어 자세! (2초)');
    updateCooldownDisplay();
}

// 방어 상태 체크
function checkDefenseStatus() {
    if (actionBattle.myDefending && Date.now() > actionBattle.myDefendUntil) {
        actionBattle.myDefending = false;
        if (actionElements.myPet) {
            actionElements.myPet.classList.remove('defending');
        }
    }
}

// 아이템 사용
function useItem() {
    if (!actionBattle.active) return;
    if (Date.now() < actionBattle.cooldowns.item) return;

    // 쿨다운 설정 (10초)
    actionBattle.cooldowns.item = Date.now() + 10000;

    // HP 회복 (30%)
    const healAmount = Math.floor(actionBattle.myMaxHp * 0.3);
    actionBattle.myHp = Math.min(actionBattle.myMaxHp, actionBattle.myHp + healAmount);
    updateHpDisplay();

    // 회복 애니메이션
    if (actionElements.myPet) {
        actionElements.myPet.classList.add('healing');
        setTimeout(() => actionElements.myPet.classList.remove('healing'), 500);
    }

    // 서버에 알림 (상대에게 회복 이펙트 표시 및 HP 동기화)
    socket.emit('action-heal', { hp: actionBattle.myHp });

    createEffect(actionBattle.myPos.x, actionBattle.myPos.y, '💚');
    showDamageText(actionBattle.myPos.x, actionBattle.myPos.y, healAmount, false, true);
    addActionLog(`💊 아이템 사용! +${healAmount} HP`);
    updateCooldownDisplay();
}

// 쿨다운 업데이트
function updateCooldowns(deltaTime) {
    // 버튼 활성화/비활성화
    updateCooldownDisplay();
}

function updateCooldownDisplay() {
    const now = Date.now();

    const buttons = [
        { btn: actionElements.meleeBtn, cooldown: actionBattle.cooldowns.melee, totalCd: 1000 },
        { btn: actionElements.rangedBtn, cooldown: actionBattle.cooldowns.ranged, totalCd: 2000 },
        { btn: actionElements.defendBtn, cooldown: actionBattle.cooldowns.defend, totalCd: 5000 },
        { btn: actionElements.itemBtn, cooldown: actionBattle.cooldowns.item, totalCd: 10000 }
    ];

    for (const { btn, cooldown, totalCd } of buttons) {
        if (!btn) continue;

        const remaining = cooldown - now;
        if (remaining > 0) {
            btn.disabled = true;
            // 쿨다운 오버레이 표시
            let overlay = btn.querySelector('.cooldown-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'cooldown-overlay';
                btn.appendChild(overlay);
            }
            overlay.textContent = Math.ceil(remaining / 1000) + 's';
        } else {
            btn.disabled = false;
            const overlay = btn.querySelector('.cooldown-overlay');
            if (overlay) overlay.remove();
        }
    }
}

// 상대 위치 업데이트 (서버에서 수신)
function updateEnemyPosition(data) {
    if (!actionBattle.active) return;

    // 부드러운 보간
    const lerpFactor = 0.3;
    actionBattle.enemyPos.x += (data.x - actionBattle.enemyPos.x) * lerpFactor;
    actionBattle.enemyPos.y += (data.y - actionBattle.enemyPos.y) * lerpFactor;

    // 상대 방어 상태 업데이트
    if (data.defending && !actionBattle.enemyDefending) {
        actionBattle.enemyDefending = true;
        actionBattle.enemyDefendUntil = Date.now() + 2000;
        if (actionElements.enemyPet) {
            actionElements.enemyPet.classList.add('defending');
        }
    }

    // 방향 전환
    if (actionElements.enemyPet) {
        const distanceX = actionBattle.myPos.x - actionBattle.enemyPos.x;
        if (distanceX > 0) {
            actionElements.enemyPet.classList.add('facing-left');
            actionElements.enemyPet.classList.remove('facing-right');
        } else {
            actionElements.enemyPet.classList.add('facing-right');
            actionElements.enemyPet.classList.remove('facing-left');
        }
    }
}

// 상대 공격 수신 처리
function handleEnemyAttack(data) {
    if (!actionBattle.active) return;

    // 공격 애니메이션
    if (actionElements.enemyPet) {
        actionElements.enemyPet.classList.add('attacking');
        setTimeout(() => actionElements.enemyPet.classList.remove('attacking'), 200);
    }

    // 데미지 계산 (방어 중이면 감소)
    let damage = data.damage;
    if (actionBattle.myDefending) {
        damage *= 0.3;
    }

    // 데미지 적용
    actionBattle.myHp -= damage;
    updateHpDisplay();

    // 피격 효과
    if (actionElements.myPet) {
        actionElements.myPet.classList.add('hit');
        setTimeout(() => actionElements.myPet.classList.remove('hit'), 300);
    }

    // 이펙트
    if (data.type === 'melee') {
        createEffect(actionBattle.myPos.x, actionBattle.myPos.y, '💥');
    }
    showDamageText(actionBattle.myPos.x, actionBattle.myPos.y, damage, data.isCritical);
}

// 상대 원거리 공격 발사체 생성
function handleEnemyProjectile(data) {
    if (!actionBattle.active) return;

    const direction = actionBattle.myPos.x > actionBattle.enemyPos.x ? 1 : -1;
    const projectile = {
        id: Date.now() + Math.random(),
        x: actionBattle.enemyPos.x,
        y: actionBattle.enemyPos.y + 30,
        velX: direction * actionBattle.PROJECTILE_SPEED * 0.8,
        damage: data.damage || 10,
        isPlayer: false,
        element: null
    };

    const projElement = document.createElement('div');
    projElement.className = 'projectile enemy-projectile';
    projElement.textContent = '⭐';
    projElement.style.left = projectile.x + '%';
    projElement.style.bottom = projectile.y + 'px';
    if (actionElements.projectilesContainer) {
        actionElements.projectilesContainer.appendChild(projElement);
    }
    projectile.element = projElement;

    actionBattle.projectiles.push(projectile);
}

// 이펙트 생성
function createEffect(x, y, emoji) {
    if (!actionElements.effectsContainer) return;

    const effect = document.createElement('div');
    effect.className = 'battle-effect';
    effect.textContent = emoji;
    effect.style.left = x + '%';
    effect.style.bottom = y + 'px';
    actionElements.effectsContainer.appendChild(effect);

    setTimeout(() => effect.remove(), 500);
}

// 데미지 텍스트
function showDamageText(x, y, damage, isCritical, isHeal = false) {
    if (!actionElements.effectsContainer) return;

    const text = document.createElement('div');
    text.className = 'damage-text' + (isCritical ? ' critical' : '') + (isHeal ? ' heal' : '');
    text.textContent = (isHeal ? '+' : '-') + Math.floor(damage);
    text.style.left = x + '%';
    text.style.bottom = (y + 50) + 'px';
    actionElements.effectsContainer.appendChild(text);

    setTimeout(() => text.remove(), 1000);
}

// 로그 추가
function addActionLog(message) {
    if (!actionElements.battleLog) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    actionElements.battleLog.appendChild(entry);
    actionElements.battleLog.scrollTop = actionElements.battleLog.scrollHeight;

    // 오래된 로그 제거
    while (actionElements.battleLog.children.length > 10) {
        actionElements.battleLog.removeChild(actionElements.battleLog.firstChild);
    }
}

// 액션 배틀 종료
function endActionBattle() {
    actionBattle.active = false;

    // 타이머 정지
    if (actionBattle.timerInterval) {
        clearInterval(actionBattle.timerInterval);
        actionBattle.timerInterval = null;
    }

    // 게임 루프 정지
    if (actionBattle.gameLoop) {
        cancelAnimationFrame(actionBattle.gameLoop);
        actionBattle.gameLoop = null;
    }

    // 발사체 제거
    for (const proj of actionBattle.projectiles) {
        if (proj.element) proj.element.remove();
    }
    actionBattle.projectiles = [];

    // 결과 판정
    let result;
    if (actionBattle.myHp <= 0) {
        result = 'lose';
        addActionLog('💔 패배...');
    } else if (actionBattle.enemyHp <= 0) {
        result = 'win';
        addActionLog('🏆 승리!');
    } else {
        // 타이머 종료 - HP로 판정
        result = actionBattle.myHp > actionBattle.enemyHp ? 'win' : 'lose';
        addActionLog(result === 'win' ? '🏆 시간 종료 - 승리!' : '💔 시간 종료 - 패배...');
    }

    // 서버에 결과 알림
    socket.emit('action-battle-end', { result: result });

    // 5초 후 로비로 돌아가기
    setTimeout(() => {
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

            gameState.battle = null;
            gameState.isMatching = false;
        }, 500);
    }, 3000);
}

// 소켓 이벤트 수정: 배틀 시작시 액션 배틀로 전환
socket.on('battle-started', (battle) => {
    gameState.isMatching = false;
    gameState.battle = battle;

    // 매칭 토스트 자동 닫기
    hideMatchingStatus();
    elements.notificationModal.classList.add('hidden');

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

            // 액션 배틀 시작
            initActionBattle();
            startActionBattle(battle);
        }, 10);
    }, 500);

    elements.matchBtn.classList.remove('hidden');
    elements.cancelMatchBtn.classList.add('hidden');
});

// 상대 위치 수신 (멀티플레이어 동기화)
socket.on('action-position', (data) => {
    updateEnemyPosition(data);
});

// 상대 근접 공격 수신
socket.on('action-melee', (data) => {
    handleEnemyAttack({ type: 'melee', damage: data.damage, isCritical: data.isCritical });
});

// 상대 원거리 공격 수신
socket.on('action-ranged', (data) => {
    handleEnemyProjectile(data);
});

// 상대 방어 수신
socket.on('action-defend', (data) => {
    actionBattle.enemyDefending = true;
    actionBattle.enemyDefendUntil = Date.now() + 2000;
    if (actionElements.enemyPet) {
        actionElements.enemyPet.classList.add('defending');
        createEffect(actionBattle.enemyPos.x, actionBattle.enemyPos.y, '🛡️');
    }
});

// 상대 회복 수신
socket.on('action-heal', (data) => {
    if (actionElements.enemyPet) {
        actionElements.enemyPet.classList.add('healing');
        setTimeout(() => actionElements.enemyPet.classList.remove('healing'), 500);
        createEffect(actionBattle.enemyPos.x, actionBattle.enemyPos.y, '💚');
    }
});

// 상대 HP 동기화
socket.on('action-hp-sync', (data) => {
    actionBattle.enemyHp = data.hp;
    updateHpDisplay();
});

// ========================================
// 초기화 실행
// ========================================
init();
