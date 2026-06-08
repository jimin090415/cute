const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cabinet = document.getElementById('gameCabinet');

let score = 0;
let time = 60;
let timer;
let selectedDifficulty = 'normal';

let totalShots = 0;
let successfulShots = 0;

// 물리 환경 설정
const gravity = 0.23;
const baseSpringX = 315; 
const baseSpringY = 390;

let ball = { x: baseSpringX, y: baseSpringY, vx: 0, vy: 0, radius: 11, isLaunched: false, color: '#ff4757' };
let spring = { x: baseSpringX, y: baseSpringY, dragStartX: 0, dragStartY: 0, offsetX: 0, offsetY: 0, isDragging: false };

// 동네방네 골고루 배치된 구멍 시스템 (노란 본체와 어울리는 비비드 테마 색상)
let holes = [
  { x: 75,  y: 110, baseR: 30, r: 30, score: 50, color: '#ff4757', name: '🍎 사과골' },
  { x: 215, y: 130, baseR: 28, r: 28, score: 100, color: '#2ed573', name: '🍏 아오리골' },
  { x: 90,  y: 235, baseR: 32, r: 32, score: 30, color: '#1e90ff', name: '🍇 포도골' },
  { x: 200, y: 265, baseR: 29, r: 29, score: 70, color: '#ffa502', name: '🍊 귤골' }
];

function startGame(difficulty) {
  selectedDifficulty = difficulty;
  score = 0;
  time = 60;
  totalShots = 0;
  successfulShots = 0;
  
  holes.forEach(h => {
    if (difficulty === 'easy') h.r = h.baseR + 6;
    if (difficulty === 'normal') h.r = h.baseR;
    if (difficulty === 'hard') h.r = h.baseR - 8;
  });

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('playScreen').classList.remove('hidden');
  document.getElementById('score').textContent = score;
  
  initEventListeners();
  
  timer = setInterval(() => {
    time--;
    document.getElementById('time').textContent = time;
    
    const percent = (time / 60) * 100;
    document.getElementById('timeBar').style.width = percent + '%';

    if (time <= 0) endGame();
  }, 1000);

  requestAnimationFrame(update);
}

function resetBall() {
  ball.x = baseSpringX;
  ball.y = baseSpringY;
  ball.vx = 0;
  ball.vy = 0;
  ball.isLaunched = false;
  const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9b5de5', '#ff33aa'];
  ball.color = colors[Math.floor(Math.random() * colors.length)];
}

function initEventListeners() {
  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', doDrag);
  canvas.addEventListener('mouseup', endDrag);

  canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
  canvas.addEventListener('touchmove', (e) => doDrag(e.touches[0]));
  canvas.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  if (ball.isLaunched) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (mx > 270 && my > 320) {
    spring.isDragging = true;
    spring.dragStartX = mx;
    spring.dragStartY = my;
  }
}

function doDrag(e) {
  if (!spring.isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  let dx = mx - spring.dragStartX;
  let dy = my - spring.dragStartY;

  if (dy < 0) dy = 0; 
  if (dy > 70) dy = 70;
  if (dx < -40) dx = -40; 
  if (dx > 40) dx = 40;

  spring.offsetX = dx;
  spring.offsetY = dy;

  ball.x = baseSpringX + dx;
  ball.y = baseSpringY + dy;
}

function endDrag() {
  if (!spring.isDragging) return;
  spring.isDragging = false;

  const powerY = spring.offsetY;
  const powerX = spring.offsetX;

  if (powerY > 5 || Math.abs(powerX) > 5) {
    ball.vy = -powerY * 0.62; 
    ball.vx = -powerX * 0.45 - 1.5 - (Math.random() * 2.5); // 방향 스틱의 물리 반영비 조정
    
    ball.isLaunched = true;
    totalShots++;
    document.getElementById('feedback').textContent = '야호! 목표를 향해 발사! 💫';
  }

  spring.offsetX = 0;
  spring.offsetY = 0;
  if(!ball.isLaunched) resetBall();
}

function triggerFlash(type) {
  const className = type === 'success' ? 'flash-correct' : 'flash-wrong';
  cabinet.classList.add(className);
  setTimeout(() => cabinet.classList.remove(className), 200);
}

function drawNeonHole(h) {
  // 구멍 외부 반짝광 효과
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r + 5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${parseInt(h.color.substring(1,3), 16)}, ${parseInt(h.color.substring(3,5), 16)}, ${parseInt(h.color.substring(5,7), 16)}, 0.12)`;
  ctx.fill();

  // 구멍 안쪽 블랙홀 효과
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2e2b'; 
  ctx.fill();
  
  // 구멍 테두리
  ctx.lineWidth = 5;
  ctx.strokeStyle = h.color;
  ctx.shadowColor = h.color;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 텍스트 렌더링
  ctx.fillStyle = '#4a3b32';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(h.name, h.x - 24, h.y - h.r - 8);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(h.score, h.x - 9, h.y + 4);
}

function drawCrystalStick() {
  let currentStickX = baseSpringX + spring.offsetX;
  let currentStickY = baseSpringY + spring.offsetY;

  // 스틱 기둥
  ctx.beginPath();
  ctx.moveTo(baseSpringX, 420);
  ctx.lineTo(currentStickX, currentStickY);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#b3d9ff'; // 연파란색 메탈릭 바 느낌
  ctx.stroke();
  
  // 크리스탈 손잡이 육각형 그리기
  ctx.beginPath();
  let r = 15; 
  ctx.moveTo(currentStickX, currentStickY - r);
  for (let i = 1; i <= 6; i++) {
    let angle = i * (Math.PI / 3);
    ctx.lineTo(currentStickX + r * Math.sin(angle), currentStickY - r * Math.cos(angle));
  }
  ctx.closePath();
  
  ctx.fillStyle = '#ff4757'; // 강렬한 레드 크리스탈 포인트
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  
  // 유리 하이라이트 효과
  ctx.beginPath();
  ctx.moveTo(currentStickX + 4, currentStickY - 4);
  ctx.lineTo(currentStickX + 9, currentStickY - 9);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 구멍 그리기
  holes.forEach(drawNeonHole);

  // 보드 테두리 외벽선
  ctx.beginPath();
  ctx.moveTo(295, 420);
  ctx.lineTo(295, 120);
  ctx.arc(150, 120, 145, 0, Math.PI, true);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#ffcc00'; /* 옐로우 테마에 맞춘 테두리 외벽 */
  ctx.stroke();

  // 2. 방향 스틱 조준 점선 가이드라인
  if (spring.isDragging && (spring.offsetY > 5 || Math.abs(spring.offsetX) > 5)) {
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.moveTo(baseSpringX, baseSpringY - 20);
    
    // 조준 역방향 궤적
    let targetX = baseSpringX - spring.offsetX * 3.8;
    let targetY = baseSpringY - spring.offsetY * 3.8;
    ctx.lineTo(targetX, targetY);
    
    ctx.strokeStyle = `rgba(0, 150, 255, ${0.6 + Math.random() * 0.3})`; // 조준선은 선명한 아쿠아 블루로 트렌디하게 연출
    ctx.shadowColor = '#0096ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  // 3. 크리스탈 레버 스틱 그리기
  drawCrystalStick();

  // 4. 탱탱볼 물리 연산
  if (ball.isLaunched) {
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 반동 탄성 계수 업그레이드
    if (ball.x - ball.radius < 5) { 
      ball.x = 5 + ball.radius; 
      ball.vx = -ball.vx * 0.78; 
    }
    if (ball.x + ball.radius > 290 && ball.y > 120) { 
      ball.x = 290 - ball.radius; 
      ball.vx = -ball.vx * 0.78; 
    }
    if (ball.x + ball.radius > canvas.width) { 
      ball.x = canvas.width - ball.radius; 
      ball.vx = -ball.vx * 0.78; 
    }
    if (ball.y - ball.radius < 5) { 
      ball.y = 5 + ball.radius; 
      ball.vy = -ball.vy * 0.78; 
      ball.vx += (Math.random() * 1.0 - 0.5); // 튕길 때 쏠림 방지 난수 굴절
    }

    // 골인 체크
    holes.forEach(h => {
      let dist = Math.sqrt((ball.x - h.x)**2 + (ball.y - h.y)**2);
      if (dist < h.r - 2) {
        score += h.score; 
        successfulShots++;
        document.getElementById('score').textContent = score;
        document.getElementById('feedback').textContent = `🎯 골인! ${h.name} (+${h.score})`;
        triggerFlash('success');
        resetBall();
      }
    });

    // 아웃 체크
    if (ball.y > canvas.height + 20) {
      document.getElementById('feedback').textContent = '앗! 아쉽게 놓쳤어요 😢';
      triggerFlash('fail');
      resetBall();
    }
  }

  // 5. 탱탱볼 그리기
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  if (time > 0) requestAnimationFrame(update);
}

function endGame() {
  clearInterval(timer);
  document.getElementById('playScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.remove('hidden');
  
  let accuracyPercent = totalShots > 0 ? Math.round((successfulShots / totalShots) * 100) : 0;
  
  let diffText = '🌸 쉬움 모드';
  if(selectedDifficulty === 'normal') diffText = '🍊 보통 모드';
  if(selectedDifficulty === 'hard') diffText = '🍇 어려움 모드';

  document.getElementById('finalDifficulty').textContent = diffText;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('totalCount').textContent = totalShots;
  document.getElementById('accuracy').textContent = accuracyPercent + '%';
}
