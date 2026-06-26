// Vector Math Utility
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
    }
    
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

// Distance point to line segment
function distToSegment(p, v, w) {
    let l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return p.sub(v).mag();
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    let proj = new Vector(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
    return p.sub(proj).mag();
}
