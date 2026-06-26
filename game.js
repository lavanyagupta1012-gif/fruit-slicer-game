// Game Engine

class Fruit {
    constructor(canvasWidth, canvasHeight, diffMult = 1.0, isBomb = false) {
        this.isBomb = isBomb;

        if (isBomb) {
            this.typeObj = { name: 'bomb', color: '#555', score: 0 };
            this.type = 'bomb';
            this.radius = 38;
        } else {
            this.typeObj = FruitTypes[Math.floor(Math.random() * FruitTypes.length)];
            this.type = this.typeObj.name;
            this.radius = Math.random() * 15 + 40; // 40-55px
        }

        // Spawn from bottom
        this.x = Math.random() * (canvasWidth - 100) + 50;
        this.y = canvasHeight + this.radius;

        // Velocity scaled by difficulty
        let targetX = canvasWidth / 2;
        this.vx = ((targetX - this.x) * 0.006 + (Math.random() - 0.5) * 3) * diffMult;
        this.vy = -(Math.random() * 3 + 12) * Math.sqrt(diffMult);

        this.rotation = 0;
        this.vr = (Math.random() - 0.5) * 0.2 * diffMult;

        this.sliced = false;
        this.leftHalf = null;
        this.rightHalf = null;
        this.life = 1.0;

        // Bomb flash timer
        this.bombFlash = 0;
    }

    update(gravity) {
        if (!this.sliced) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += gravity;
            this.rotation += this.vr;
            if (this.isBomb) this.bombFlash += 0.1;
        } else {
            if (this.leftHalf) {
                this.leftHalf.x += this.leftHalf.vx;
                this.leftHalf.y += this.leftHalf.vy;
                this.leftHalf.vy += gravity;
                this.leftHalf.rotation += this.leftHalf.vr;
            }
            if (this.rightHalf) {
                this.rightHalf.x += this.rightHalf.vx;
                this.rightHalf.y += this.rightHalf.vy;
                this.rightHalf.vy += gravity;
                this.rightHalf.rotation += this.rightHalf.vr;
            }
            this.life -= 0.025;
        }
    }

    draw(ctx) {
        if (!this.sliced) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.isBomb) {
                // Glowing red aura on bomb
                let pulse = Math.abs(Math.sin(this.bombFlash));
                ctx.shadowColor = `rgba(255, 50, 0, ${pulse})`;
                ctx.shadowBlur = 25 * pulse;

                if (typeof bombImg !== 'undefined' && bombImg.complete && bombImg.naturalWidth > 0) {
                    ctx.drawImage(bombImg, -this.radius * 1.2, -this.radius * 1.2, this.radius * 2.4, this.radius * 2.4);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#222';
                    ctx.fill();
                    ctx.font = `${this.radius}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💣', 0, 0);
                }
            } else {
                drawFruit(ctx, this.type, this.radius);
            }

            ctx.restore();
        } else {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.life;

            if (!this.isBomb) {
                // Left half
                ctx.save();
                ctx.translate(this.leftHalf.x, this.leftHalf.y);
                ctx.rotate(this.leftHalf.rotation);
                drawHalfFruit(ctx, this.type, this.radius, true);
                ctx.restore();

                // Right half
                ctx.save();
                ctx.translate(this.rightHalf.x, this.rightHalf.y);
                ctx.rotate(this.rightHalf.rotation);
                drawHalfFruit(ctx, this.type, this.radius, false);
                ctx.restore();
            }

            ctx.restore();
        }
    }

    slice() {
        this.sliced = true;
        let splitV = 5;
        this.leftHalf = {
            x: this.x - 10, y: this.y,
            vx: this.vx - splitV, vy: this.vy,
            rotation: this.rotation, vr: this.vr - 0.1
        };
        this.rightHalf = {
            x: this.x + 10, y: this.y,
            vx: this.vx + splitV, vy: this.vy,
            rotation: this.rotation, vr: this.vr + 0.1
        };
    }
}

// ─── Difficulty Table (score-based) ───────────────────────────────────────────
// Each tier activates at `minScore` and sets difficulty parameters
const DIFFICULTY_TIERS = [
    { minScore: 0,   label: 'Easy',      spawnInterval: 3000, spawnDecay: 20,  minInterval: 1600, maxCount: 1, bombChance: 0.00, diffMult: 1.0  },
    { minScore: 100, label: 'Normal',    spawnInterval: null, spawnDecay: 30,  minInterval: 1200, maxCount: 2, bombChance: 0.15, diffMult: 1.1  },
    { minScore: 250, label: 'Hard',      spawnInterval: null, spawnDecay: 40,  minInterval: 900,  maxCount: 3, bombChance: 0.25, diffMult: 1.25 },
    { minScore: 500, label: 'Intense',   spawnInterval: null, spawnDecay: 50,  minInterval: 700,  maxCount: 3, bombChance: 0.30, diffMult: 1.45 },
    { minScore: 800, label: 'Nightmare', spawnInterval: null, spawnDecay: 60,  minInterval: 550,  maxCount: 4, bombChance: 0.35, diffMult: 1.7  },
];

function getTier(score) {
    let tier = DIFFICULTY_TIERS[0];
    for (let t of DIFFICULTY_TIERS) {
        if (score >= t.minScore) tier = t;
    }
    return tier;
}
// ──────────────────────────────────────────────────────────────────────────────

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.gravity = 0.22;
        this.fruits = [];
        this.particles = [];
        this.splashes = [];
        this.trail = new Trail();

        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboTimer = 0;

        this.state = 'MENU';
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 3000;
        this.currentTierIndex = 0;

        this.isMouseDown = false;
        this.lastMousePos = null;

        this.onGameOver = null;
        this.onScoreUpdate = null;
        this.onLivesUpdate = null;
        this.onComboUpdate = null;
        this.onDifficultyChange = null;

        this.bindEvents();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        });

        const handleMove = (x, y) => {
            if (this.state !== 'PLAYING') return;
            this.trail.addPoint(x, y);
            if (this.lastMousePos) {
                this.checkSlices(this.lastMousePos, new Vector(x, y));
            }
            this.lastMousePos = new Vector(x, y);
        };

        const handleStart = (x, y) => {
            this.isMouseDown = true;
            this.trail.clear();
            this.trail.color = shopData.getTrailColor();
            this.trail.addPoint(x, y);
            this.lastMousePos = new Vector(x, y);
        };

        const handleEnd = () => {
            this.isMouseDown = false;
            this.trail.clear();
            this.lastMousePos = null;
            if (this.combo > 2) {
                let bonus = this.combo * 5;
                this.score += bonus;
                if (this.onComboUpdate) this.onComboUpdate(this.combo, bonus);
            }
            this.combo = 0;
        };

        this.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => { if (this.isMouseDown) handleMove(e.clientX, e.clientY); });
        this.canvas.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('mouseleave', handleEnd);
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        this.canvas.addEventListener('touchend', handleEnd);
    }

    start() {
        this.fruits = [];
        this.particles = [];
        this.splashes = [];
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.spawnInterval = 3000;
        this.currentTierIndex = 0;
        this.gravity = 0.22;
        this.state = 'PLAYING';

        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onLivesUpdate) this.onLivesUpdate(this.lives);
        if (this.onDifficultyChange) this.onDifficultyChange(DIFFICULTY_TIERS[0].label);

        let bgItem = SHOP_ITEMS.find(i => i.id === shopData.equippedBg);
        if (bgItem && bgItem.value !== 'none') {
            document.getElementById('game-container').style.background = `url('${bgItem.value}') no-repeat center center`;
            document.getElementById('game-container').style.backgroundSize = 'cover';
        } else {
            document.getElementById('game-container').style.background = '#111';
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.trail.clear();
        let isNewHigh = shopData.updateHighScore(this.score);
        let coinsEarned = Math.floor(this.score / 10);
        shopData.addCoins(coinsEarned);
        if (this.onGameOver) this.onGameOver(this.score, coinsEarned, isNewHigh);
    }

    spawnBomb(x, y) {
        // Flash screen red briefly
        this.bombFlashAlpha = 0.5;
    }

    checkSlices(p1, p2) {
        let slicedThisSwipe = 0;
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            let f = this.fruits[i];
            if (f.sliced) continue;

            let dist = distToSegment(new Vector(f.x, f.y), p1, p2);
            if (dist < f.radius) {
                f.slice();

                if (f.isBomb) {
                    // Bomb hit! lose a life
                    this.bombFlashAlpha = 0.6;
                    this.lives--;
                    for (let j = 0; j < 20; j++) {
                        this.particles.push(new Particle(f.x, f.y, '#ff4400'));
                    }
                    this.splashes.push(new Splash(f.x, f.y, '#333'));
                    if (this.onLivesUpdate) this.onLivesUpdate(this.lives);
                    if (this.lives <= 0) this.gameOver();
                } else {
                    // Normal fruit slice
                    slicedThisSwipe++;
                    this.score += f.typeObj.score;
                    this.splashes.push(new Splash(f.x, f.y, f.typeObj.color));
                    for (let j = 0; j < 15; j++) {
                        this.particles.push(new Particle(f.x, f.y, f.typeObj.color));
                    }
                }
            }
        }

        if (slicedThisSwipe > 0) {
            this.combo += slicedThisSwipe;
            if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // ── Difficulty: check score-based tier ──────────────────────────────
        let tier = getTier(this.score);
        let newTierIndex = DIFFICULTY_TIERS.indexOf(tier);
        if (newTierIndex > this.currentTierIndex) {
            this.currentTierIndex = newTierIndex;
            this.gravity = 0.22 * tier.diffMult;
            if (this.onDifficultyChange) this.onDifficultyChange(tier.label);
        }

        // Bomb flash fade
        if (this.bombFlashAlpha > 0) {
            this.bombFlashAlpha -= 0.03;
            if (this.bombFlashAlpha < 0) this.bombFlashAlpha = 0;
        }

        // ── Spawn ────────────────────────────────────────────────────────────
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;

            let maxCount = tier.maxCount;
            let count = Math.floor(Math.random() * maxCount) + 1;

            // Decide wave type based on score / bomb chance
            let rollBomb = Math.random() < tier.bombChance;

            if (rollBomb && this.score >= 100) {
                // Either a pure bomb wave or a mixed wave
                let mixWave = Math.random() < 0.5; // 50% chance mixed vs pure bomb
                if (mixWave) {
                    // Spawn 1–2 fruits + 1 bomb
                    let fruitCount = Math.max(1, count - 1);
                    for (let i = 0; i < fruitCount; i++) {
                        this.fruits.push(new Fruit(this.width, this.height, tier.diffMult, false));
                    }
                    this.fruits.push(new Fruit(this.width, this.height, tier.diffMult, true));
                } else {
                    // Pure bomb
                    this.fruits.push(new Fruit(this.width, this.height, tier.diffMult, true));
                }
            } else {
                // Normal fruit wave
                for (let i = 0; i < count; i++) {
                    this.fruits.push(new Fruit(this.width, this.height, tier.diffMult, false));
                }
            }

            // Decrease spawn interval
            this.spawnInterval = Math.max(tier.minInterval, this.spawnInterval - tier.spawnDecay);
        }

        // ── Update entities ──────────────────────────────────────────────────
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            let f = this.fruits[i];
            f.update(this.gravity);

            if (f.y > this.height + 100 && f.vy > 0 && !f.sliced) {
                this.fruits.splice(i, 1);
                // Missing a fruit (not a bomb) costs a life
                if (!f.isBomb) {
                    this.lives--;
                    if (this.onLivesUpdate) this.onLivesUpdate(this.lives);
                    if (this.lives <= 0) this.gameOver();
                }
            } else if (f.sliced && f.life <= 0) {
                this.fruits.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.splashes.length - 1; i >= 0; i--) {
            this.splashes[i].update();
            if (this.splashes[i].life <= 0) this.splashes.splice(i, 1);
        }

        if (!this.isMouseDown) {
            this.trail.clear();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Bomb flash overlay
        if (this.bombFlashAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.bombFlashAlpha;
            this.ctx.fillStyle = '#ff2200';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }

        this.splashes.forEach(s => s.draw(this.ctx));
        this.fruits.forEach(f => f.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));

        if (this.state === 'PLAYING') {
            this.trail.draw(this.ctx);
        }
    }

    loop(timestamp) {
        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.update(dt);
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
