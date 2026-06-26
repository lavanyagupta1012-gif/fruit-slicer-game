// Game Engine

class Fruit {
    constructor(canvasWidth, canvasHeight, diffMult = 1.0) {
        this.typeObj = FruitTypes[Math.floor(Math.random() * FruitTypes.length)];
        this.type = this.typeObj.name;
        this.radius = Math.random() * 15 + 40; // 40-55px
        
        // Spawn from bottom
        this.x = Math.random() * (canvasWidth - 100) + 50;
        this.y = canvasHeight + this.radius;
        
        // Velocity (arc trajectory)
        let targetX = canvasWidth / 2;
        this.vx = ((targetX - this.x) * 0.006 + (Math.random() - 0.5) * 3) * diffMult;
        this.vy = -(Math.random() * 3 + 12) * Math.sqrt(diffMult); // Jump strength
        
        this.rotation = 0;
        this.vr = (Math.random() - 0.5) * 0.2;
        
        this.sliced = false;
        this.leftHalf = null;
        this.rightHalf = null;
        this.life = 1.0; // for fading out halves
    }

    update(gravity) {
        if (!this.sliced) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += gravity;
            this.rotation += this.vr;
        } else {
            this.leftHalf.x += this.leftHalf.vx;
            this.leftHalf.y += this.leftHalf.vy;
            this.leftHalf.vy += gravity;
            this.leftHalf.rotation += this.leftHalf.vr;
            
            this.rightHalf.x += this.rightHalf.vx;
            this.rightHalf.y += this.rightHalf.vy;
            this.rightHalf.vy += gravity;
            this.rightHalf.rotation += this.rightHalf.vr;
            
            this.life -= 0.02;
        }
    }

    draw(ctx) {
        if (!this.sliced) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            drawFruit(ctx, this.type, this.radius);
            ctx.restore();
        } else {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.life;
            
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
            
            ctx.restore();
        }
    }

    slice(vx, vy) {
        this.sliced = true;
        
        // Splitting velocity based on swipe direction
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
        
        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 3000;
        
        this.isMouseDown = false;
        this.lastMousePos = null;
        
        this.onGameOver = null;
        this.onScoreUpdate = null;
        this.onLivesUpdate = null;
        this.onComboUpdate = null;
        
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

        // Touch and Mouse events
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
            
            // Check combo at end of swipe
            if (this.combo > 2) {
                let bonus = this.combo * 5;
                this.score += bonus;
                if(this.onComboUpdate) this.onComboUpdate(this.combo, bonus);
            }
            this.combo = 0;
        };

        this.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) handleMove(e.clientX, e.clientY);
        });
        this.canvas.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('mouseleave', handleEnd);

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
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
        this.difficultyMult = 1.0;
        this.gravity = 0.22;
        this.state = 'PLAYING';
        
        if(this.onScoreUpdate) this.onScoreUpdate(this.score);
        if(this.onLivesUpdate) this.onLivesUpdate(this.lives);
        
        // Update bg
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

    checkSlices(p1, p2) {
        let slicedThisSwipe = 0;
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            let f = this.fruits[i];
            if (f.sliced) continue;

            let dist = distToSegment(new Vector(f.x, f.y), p1, p2);
            if (dist < f.radius) {
                // Slice!
                f.slice(p2.x - p1.x, p2.y - p1.y);
                slicedThisSwipe++;
                this.score += f.typeObj.score;
                
                // Add splash
                this.splashes.push(new Splash(f.x, f.y, f.typeObj.color));
                
                // Add particles
                for(let j=0; j<15; j++) {
                    this.particles.push(new Particle(f.x, f.y, f.typeObj.color));
                }
            }
        }
        
        if (slicedThisSwipe > 0) {
            this.combo += slicedThisSwipe;
            if(this.onScoreUpdate) this.onScoreUpdate(this.score);
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Spawn fruits
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            
            // Logic for fruit count: 1 initially, scales up as it gets faster
            let maxFruits = 1;
            if (this.spawnInterval < 2000) maxFruits = 2;
            if (this.spawnInterval < 1200) maxFruits = 3;
            if (this.spawnInterval < 900) maxFruits = 4;
            
            let count = Math.floor(Math.random() * maxFruits) + 1;
            for(let i=0; i<count; i++) {
                this.fruits.push(new Fruit(this.width, this.height, this.difficultyMult));
            }
            // Slowly increase difficulty
            this.spawnInterval = Math.max(700, this.spawnInterval - 30);
            this.difficultyMult = Math.min(1.8, this.difficultyMult + 0.02);
            this.gravity = 0.22 * this.difficultyMult;
        }

        // Update entities
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            let f = this.fruits[i];
            f.update(this.gravity);
            
            // Remove if out of bounds (bottom)
            if (f.y > this.height + 100 && f.vy > 0 && !f.sliced) {
                this.fruits.splice(i, 1);
                this.lives--;
                if(this.onLivesUpdate) this.onLivesUpdate(this.lives);
                if (this.lives <= 0) {
                    this.gameOver();
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
        
        // Trail auto fade if mouse not moving but down
        if (this.isMouseDown && this.trail.points.length > 0) {
            // Option to slowly remove points if static
        } else if (!this.isMouseDown) {
            this.trail.clear();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Splashes (background)
        this.splashes.forEach(s => s.draw(this.ctx));
        
        // Draw Fruits
        this.fruits.forEach(f => f.draw(this.ctx));
        
        // Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));
        
        // Draw Trail (foreground)
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
