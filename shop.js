// Shop System

const SHOP_ITEMS = [
    { id: 'trail_white', name: 'Classic Trail', type: 'trail', price: 0, value: '#ffffff', iconColor: '#ffffff' },
    { id: 'trail_red', name: 'Ninja Red', type: 'trail', price: 50, value: '#ff3333', iconColor: '#ff3333' },
    { id: 'trail_gold', name: 'Golden Flash', type: 'trail', price: 200, value: '#ffd700', iconColor: '#ffd700' },
    { id: 'trail_blue', name: 'Ice Blade', type: 'trail', price: 500, value: '#00ffff', iconColor: '#00ffff' },
    { id: 'bg_dojo', name: 'Classic Dojo', type: 'bg', price: 0, value: 'background.png', iconColor: '#8b4513' },
    { id: 'bg_dark', name: 'Midnight', type: 'bg', price: 300, value: 'none', iconColor: '#111111' }
];

class ShopData {
    constructor() {
        this.load();
    }

    load() {
        let saved = localStorage.getItem('fruitSlicerData');
        if (saved) {
            let data = JSON.parse(saved);
            this.coins = data.coins || 0;
            this.highScore = data.highScore || 0;
            this.unlocked = data.unlocked || ['trail_white', 'bg_dojo'];
            this.equippedTrail = data.equippedTrail || 'trail_white';
            this.equippedBg = data.equippedBg || 'bg_dojo';
        } else {
            this.coins = 0;
            this.highScore = 0;
            this.unlocked = ['trail_white', 'bg_dojo'];
            this.equippedTrail = 'trail_white';
            this.equippedBg = 'bg_dojo';
            this.save();
        }
    }

    save() {
        localStorage.setItem('fruitSlicerData', JSON.stringify({
            coins: this.coins,
            highScore: this.highScore,
            unlocked: this.unlocked,
            equippedTrail: this.equippedTrail,
            equippedBg: this.equippedBg
        }));
    }

    addCoins(amount) {
        this.coins += amount;
        this.save();
    }

    updateHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            this.save();
            return true;
        }
        return false;
    }

    buyItem(id) {
        let item = SHOP_ITEMS.find(i => i.id === id);
        if (item && !this.unlocked.includes(id) && this.coins >= item.price) {
            this.coins -= item.price;
            this.unlocked.push(id);
            this.equipItem(id);
            this.save();
            return true;
        }
        return false;
    }

    equipItem(id) {
        if (!this.unlocked.includes(id)) return;
        let item = SHOP_ITEMS.find(i => i.id === id);
        if (item.type === 'trail') {
            this.equippedTrail = id;
        } else if (item.type === 'bg') {
            this.equippedBg = id;
        }
        this.save();
    }
    
    getTrailColor() {
        let item = SHOP_ITEMS.find(i => i.id === this.equippedTrail);
        return item ? item.value : '#ffffff';
    }
}

const shopData = new ShopData();
