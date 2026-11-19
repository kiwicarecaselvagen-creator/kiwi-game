const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const speedEl = document.getElementById('speed');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

// Estado do jogo
let gameRunning = true;
let score = 0;
let roadOffset = 0;
let baseSpeed = 5;

// Objeto do Jogador (Kart)
const kart = {
    x: canvas.width / 2 - 22,
    y: canvas.height - 100,
    width: 44,
    height: 68,
    speedX: 6,
    tilt: 0 // Ângulo de inclinação ao fazer curva
};

// Controles
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };

window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Lista de obstáculos (Cascos verdes detalhados)
let obstacles = [];

function spawnObstacle() {
    if (!gameRunning) return;
    const laneWidth = canvas.width - 80;
    const randomX = 40 + Math.random() * (laneWidth - 36);
    obstacles.push({
        x: randomX,
        y: -40,
        width: 36,
        height: 36
    });
}

setInterval(spawnObstacle, 1200);

function update() {
    if (!gameRunning) return;

    let currentSpeed = keys.ArrowUp ? baseSpeed * 1.6 : baseSpeed;
    speedEl.innerText = Math.round(currentSpeed * 18);

    // Movimentação lateral + inclinação suave (tilt)
    if (keys.ArrowLeft && kart.x > 38) {
        kart.x -= kart.speedX;
        kart.tilt = Math.max(kart.tilt - 0.03, -0.15); // Inclina para a esquerda
    } else if (keys.ArrowRight && kart.x < canvas.width - kart.width - 38) {
        kart.x += kart.speedX;
        kart.tilt = Math.min(kart.tilt + 0.03, 0.15);  // Inclina para a direita
    } else {
        // Retorna o volante para o centro suavemente
        kart.tilt *= 0.8;
    }

    // Movimento da pista
    roadOffset += currentSpeed;
    if (roadOffset >= 40) roadOffset = 0;

    // Atualiza obstáculos e verifica colisão
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += currentSpeed;

        // Colisão com margem de tolerância de 4px para ficar mais justo
        if (
            kart.x + 4 < obs.x + obs.width &&
            kart.x + kart.width - 4 > obs.x &&
            kart.y + 4 < obs.y + obs.height &&
            kart.y + kart.height - 4 > obs.y
        ) {
            endGame();
        }

        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10;
            scoreEl.innerText = score;
            if (score % 100 === 0) baseSpeed += 0.5;
        }
    }
}

// Função dedicada para desenhar o modelo detalhado do Kart
function drawKartModel(x, y, w, h, tilt, isBoosting) {
    ctx.save();
    // Move o ponto de origem para o centro do kart para aplicar a rotação
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);

    const hw = w / 2;
    const hh = h / 2;

    // 1. Sombra do Kart no asfalto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-hw + 3, -hh + 5, w, h, 10);
    ctx.fill();

    // 2. Chama do turbo (aparece ao segurar Seta para Cima)
    if (isBoosting) {
        ctx.fillStyle = Math.random() > 0.5 ? '#ffaa00' : '#00ffff';
        ctx.beginPath();
        ctx.moveTo(-12, hh);
        ctx.lineTo(-8, hh + 14 + Math.random() * 6);
        ctx.lineTo(-4, hh);
        ctx.moveTo(4, hh);
        ctx.lineTo(8, hh + 14 + Math.random() * 6);
        ctx.lineTo(12, hh);
        ctx.fill();
    }

    // 3. Escapamentos traseiros (cromados)
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(-12, hh - 4, 6, 8);
    ctx.fillRect(6, hh - 4, 6, 8);

    // 4. Rodas (4 pneus pretos com detalhe cinza)
    ctx.fillStyle = '#181818';
    // Dianteiras
    ctx.beginPath();
    ctx.roundRect(-hw - 4, -hh + 10, 8, 16, 3);
    ctx.roundRect(hw - 4, -hh + 10, 8, 16, 3);
    // Traseiras (mais largas)
    ctx.roundRect(-hw - 5, hh - 22, 10, 18, 3);
    ctx.roundRect(hw - 5, hh - 22, 10, 18, 3);
    ctx.fill();

    // 5. Chassi Principal (Vermelho)
    ctx.fillStyle = '#e60012';
    ctx.beginPath();
    // Bico frontal arredondado e laterais largas
    ctx.moveTo(-10, -hh);
    ctx.lineTo(10, -hh);
    ctx.lineTo(hw - 2, -hh + 22);
    ctx.lineTo(hw - 2, hh - 6);
    ctx.lineTo(-hw + 2, hh - 6);
    ctx.lineTo(-hw + 2, -hh + 22);
    ctx.closePath();
    ctx.fill();

    // 6. Faixa branca de corrida e bico frontal
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -hh + 2, 8, 22);
    
    // Para-choque dianteiro
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(-14, -hh - 2, 28, 6, 3);
    ctx.fill();

    // 7. Assento e Volante
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.roundRect(-11, -2, 22, 24, 5);
    ctx.fill();

    // Volante
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(7, -6);
    ctx.stroke();

    // 8. Piloto (Ombros azuis + Cabeça + Boné vermelho)
    // Ombros/Macacão
    ctx.fillStyle = '#0055cc';
    ctx.beginPath();
    ctx.roundRect(-12, 2, 24, 14, 6);
    ctx.fill();

    // Cabeça / Capacete
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Boné vermelho virado para frente
    ctx.fillStyle = '#e60012';
    ctx.beginPath();
    ctx.arc(0, 5, 8.5, 0, Math.PI); // Parte de trás do boné
    ctx.fill();
    // Aba do boné apontando para frente
    ctx.fillRect(-6, -5, 12, 5);

    // Emblema branco no boné
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 9. Aerofólio Traseiro
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-hw + 1, hh - 9, w - 2, 6, 2);
    ctx.fill();

    ctx.restore();
}

// Função para desenhar os Cascos Verdes com detalhes
function drawShellObstacle(obs) {
    const cx = obs.x + obs.width / 2;
    const cy = obs.y + obs.height / 2;
    const r = obs.width / 2;

    // Borda branca do casco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Centro verde
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.fill();

    // Detalhe hexagonal interno
    ctx.strokeStyle = '#005500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grama nas laterais
    ctx.fillStyle = '#2e8b57';
    ctx.fillRect(0, 0, 30, canvas.height);
    ctx.fillRect(canvas.width - 30, 0, 30, canvas.height);

    // Zebra da pista
    for (let y = -40; y < canvas.height; y += 40) {
        ctx.fillStyle = (Math.floor((y + roadOffset) / 40) % 2 === 0) ? '#fff' : '#d00';
        ctx.fillRect(25, y + roadOffset, 5, 40);
        ctx.fillRect(canvas.width - 30, y + roadOffset, 5, 40);
    }

    // Faixas tracejadas no meio
    ctx.fillStyle = '#ffffff';
    for (let y = -40; y < canvas.height; y += 40) {
        ctx.fillRect(canvas.width / 2 - 3, y + roadOffset, 6, 20);
    }

    // Desenha os obstáculos (Cascos)
    obstacles.forEach((obs) => {
        drawShellObstacle(obs);
    });

    // Desenha o novo modelo do Kart
    drawKartModel(kart.x, kart.y, kart.width, kart.height, kart.tilt, keys.ArrowUp);
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    gameRunning = false;
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    score = 0;
    baseSpeed = 5;
    obstacles = [];
    kart.x = canvas.width / 2 - 22;
    kart.tilt = 0;
    scoreEl.innerText = '0';
    gameOverScreen.classList.add('hidden');
    gameRunning = true;
    gameLoop();
}

gameLoop();