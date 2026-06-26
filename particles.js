// Particles and Effects

class Trail {
    constructor() {
        this.points = [];
        this.maxLength = 15;
        this.color = '#fff';
    }

    addPoint(x, y) {
        this.points.push(new Vector(x, y));
        if (this.points.length > this.maxLength) {
            this.points.shift();
        }
    }

    clear() {
        this.points = [];
    }

    draw(ctx) {
        if (this.points.length < 2) return;
        
        ctx.save();
        
        // Katana Trail effect: tapered polygon
        let topEdge = [];
        let bottomEdge = [];
        let maxWidth = 12; // Maximum blade width at the head
        
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            
            // Calculate normal vector for width
            let dir;
            if (i < this.points.length - 1) {
                let next = this.points[i + 1];
                dir = new Vector(next.x - p.x, next.y - p.y);
            } else {
                let prev = this.points[i - 1];
                dir = new Vector(p.x - prev.x, p.y - prev.y);
            }
            
            let len = dir.mag();
            if (len > 0) {
                dir.x /= len;
                dir.y /= len;
            } else {
                dir = new Vector(1, 0);
            }
            
            // Normal is perpendicular to direction
            let normal = new Vector(-dir.y, dir.x);
            
            // Tapering width: 0 at tail (i=0), max at head (i=length-1)
            // Use Math.pow for a sharper katana curve
            let progress = i / (this.points.length - 1);
            let w = Math.pow(progress, 1.5) * maxWidth; 
            
            topEdge.push(new Vector(p.x + normal.x * w, p.y + normal.y * w));
            bottomEdge.push(new Vector(p.x - normal.x * w, p.y - normal.y * w));
        }
        
        // Draw Outer Glow / Colored Aura
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.moveTo(topEdge[0].x, topEdge[0].y);
        for (let i = 1; i < topEdge.length; i++) {
            ctx.lineTo(topEdge[i].x, topEdge[i].y);
        }
        for (let i = bottomEdge.length - 1; i >= 0; i--) {
            ctx.lineTo(bottomEdge[i].x, bottomEdge[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw Inner White Blade Core
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffffff';
        
        // Core is thinner
        let coreTop = [];
        let coreBottom = [];
        for (let i = 0; i < this.points.length; i++) {
            let progress = i / (this.points.length - 1);
            let p = this.points[i];
            
            // Re-calculate normal just for the core
            let dir;
            if (i < this.points.length - 1) {
                let next = this.points[i+1];
                dir = new Vector(next.x - p.x, next.y - p.y);
            } else {
                let prev = this.points[i-1];
                dir = new Vector(p.x - prev.x, p.y - prev.y);
            }
            let len = dir.mag();
            if(len>0) { dir.x/=len; dir.y/=len; } else { dir=new Vector(1,0); }
            let normal = new Vector(-dir.y, dir.x);
            
            let coreW = Math.pow(progress, 2) * (maxWidth * 0.3); // Core is 30% width
            
            coreTop.push(new Vector(p.x + normal.x * coreW, p.y + normal.y * coreW));
            coreBottom.push(new Vector(p.x - normal.x * coreW, p.y - normal.y * coreW));
        }
        
        ctx.beginPath();
        ctx.moveTo(coreTop[0].x, coreTop[0].y);
        for (let i = 1; i < coreTop.length; i++) {
            ctx.lineTo(coreTop[i].x, coreTop[i].y);
        }
        for (let i = coreBottom.length - 1; i >= 0; i--) {
            ctx.lineTo(coreBottom[i].x, coreBottom[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class Splash {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 20 + 30;
        this.life = 1.0;
        this.points = [];
        
        // Create random blob shape
        let numPoints = 8;
        for(let i=0; i<numPoints; i++) {
            let angle = (i / numPoints) * Math.PI * 2;
            let dist = this.radius * (0.5 + Math.random() * 0.5);
            this.points.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            });
        }
    }

    update() {
        this.life -= 0.01;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.life * 0.5; // Background splashes are semi-transparent
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i=1; i<this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 15;
        this.vy = (Math.random() - 0.5) * 15;
        this.color = color;
        this.radius = Math.random() * 4 + 2;
        this.life = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5; // gravity
        this.life -= 0.02;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}
