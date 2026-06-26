// Load 3D Fruit Images
const fruitImages = {};
const loadedImages = {};

const FruitTypes = [
    { name: 'apple', color: '#cc0000', score: 10, imgUrl: 'apple.png' },
    { name: 'orange', color: '#ff8800', score: 10, imgUrl: 'orange.png' },
    { name: 'watermelon', color: '#ff3333', score: 20, imgUrl: 'watermelon.png' },
    { name: 'lemon', color: '#ffe600', score: 15, imgUrl: 'lemon.png' },
    { name: 'pineapple', color: '#ffcc00', score: 25, imgUrl: 'pineapple.png' },
    { name: 'mango', color: '#ff9900', score: 15, imgUrl: 'mango.png' }
];

FruitTypes.forEach(f => {
    let img = new Image();
    img.src = f.imgUrl;
    fruitImages[f.name] = img;
});

const katanaImg = new Image();
katanaImg.src = 'katana.png';

const bombImg = new Image();
bombImg.src = 'bomb.png';

// Draw full 3D fruit
const drawFruit = (ctx, type, radius) => {
    let img = fruitImages[type];
    
    // Add soft shadow for 3D depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 10;
    
    if (img && img.complete) {
        ctx.drawImage(img, -radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    } else {
        // Fallback circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
    }
};

// Draw half fruit (after slicing)
const drawHalfFruit = (ctx, type, radius, isLeft) => {
    let img = fruitImages[type];
    
    if (img && img.complete) {
        ctx.save();
        
        // Clip to half
        ctx.beginPath();
        if (isLeft) {
            ctx.rect(-radius * 2, -radius * 2, radius * 2, radius * 4); // Left half
        } else {
            ctx.rect(0, -radius * 2, radius * 2, radius * 4); // Right half
        }
        ctx.clip();
        
        ctx.drawImage(img, -radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
        
        // Add a slight "flesh" inner glow on the cut line
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.2);
        ctx.lineTo(0, radius * 1.2);
        ctx.lineWidth = 4;
        
        // Color based on fruit
        let innerColor = 'rgba(255, 255, 255, 0.4)';
        if (type === 'watermelon') innerColor = 'rgba(255, 50, 50, 0.8)';
        if (type === 'orange') innerColor = 'rgba(255, 200, 100, 0.8)';
        if (type === 'mango') innerColor = 'rgba(255, 200, 0, 0.8)';
        
        ctx.strokeStyle = innerColor;
        ctx.shadowBlur = 5;
        ctx.shadowColor = innerColor;
        ctx.stroke();
        
        ctx.restore();
    }
};
