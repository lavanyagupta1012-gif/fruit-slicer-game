// Main UI and Game Initialization

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    
    // Screens
    const screenMenu = document.getElementById('main-menu');
    const screenHud = document.getElementById('hud');
    const screenGameOver = document.getElementById('game-over');
    const screenShop = document.getElementById('shop-screen');
    
    // UI Elements
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display');
    const comboDisplay = document.getElementById('combo-display');
    const finalScore = document.getElementById('final-score');
    const coinsEarned = document.getElementById('coins-earned');
    const totalCoins = document.getElementById('total-coins');
    const shopContainer = document.getElementById('shop-items-container');
    
    // Side Menu Elements
    const menuHighScore = document.getElementById('menu-highscore-display');
    const menuCoins = document.getElementById('menu-coins-display');
    
    // Switch Screen utility
    const showScreen = (screen) => {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        screen.classList.remove('hidden');
        screen.classList.add('active');
        
        if (screen === screenMenu) {
            updateMenuStats();
        }
    };
    
    const updateMenuStats = () => {
        menuHighScore.textContent = shopData.highScore;
        menuCoins.textContent = shopData.coins;
    };
    
    // Initial stat load
    updateMenuStats();

    // Game Callbacks
    game.onScoreUpdate = (score) => {
        scoreDisplay.textContent = score;
    };
    
    game.onLivesUpdate = (lives) => {
        let text = '';
        for(let i=0; i<lives; i++) text += '❤️ ';
        for(let i=lives; i<3; i++) text += '🖤 ';
        livesDisplay.textContent = text;
    };
    
    game.onComboUpdate = (combo, bonus) => {
        comboDisplay.textContent = `+${bonus} (${combo} COMBO!)`;
        comboDisplay.classList.add('combo-active');
        setTimeout(() => {
            comboDisplay.classList.remove('combo-active');
        }, 1000);
    };

    game.onDifficultyChange = (label) => {
        const diffEl = document.getElementById('difficulty-display');
        diffEl.textContent = `⚡ ${label}`;
        diffEl.classList.remove('show');
        void diffEl.offsetWidth; // force reflow to restart animation
        diffEl.classList.add('show');
        setTimeout(() => diffEl.classList.remove('show'), 2000);
    };
    
    game.onGameOver = (score, coins, isNewHigh) => {
        finalScore.textContent = score + (isNewHigh ? ' (NEW HIGH!)' : '');
        coinsEarned.textContent = coins;
        showScreen(screenGameOver);
    };

    document.getElementById('btn-play').addEventListener('click', () => {
        showScreen(screenHud);
        game.start();
    });
    
    document.getElementById('btn-restart').addEventListener('click', () => {
        showScreen(screenHud);
        game.start();
    });
    
    document.getElementById('btn-menu').addEventListener('click', () => {
        showScreen(screenMenu);
    });
    
    document.getElementById('btn-shop').addEventListener('click', () => {
        renderShop();
        showScreen(screenShop);
    });
    
    document.getElementById('btn-shop-back').addEventListener('click', () => {
        showScreen(screenMenu);
    });
    
    // Render Shop UI
    const renderShop = () => {
        totalCoins.textContent = shopData.coins;
        shopContainer.innerHTML = '';
        
        SHOP_ITEMS.forEach(item => {
            let div = document.createElement('div');
            div.className = 'shop-item';
            if (!shopData.unlocked.includes(item.id)) div.classList.add('locked');
            if (shopData.equippedTrail === item.id || shopData.equippedBg === item.id) div.classList.add('equipped');
            
            div.innerHTML = `
                <div class="shop-item-icon" style="background-color: ${item.iconColor}; ${item.type==='bg' && item.value!=='none' ? `background-image:url(${item.value})` : ''}"></div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">${shopData.unlocked.includes(item.id) ? 'UNLOCKED' : '🪙 ' + item.price}</div>
            `;
            
            div.addEventListener('click', () => {
                if (shopData.unlocked.includes(item.id)) {
                    shopData.equipItem(item.id);
                    renderShop(); // re-render to update equipped state
                } else {
                    if (shopData.buyItem(item.id)) {
                        renderShop();
                    } else {
                        // Flash red if not enough coins
                        if (shopData.coins < item.price) {
                            div.style.backgroundColor = 'rgba(255,0,0,0.3)';
                            setTimeout(() => div.style.backgroundColor = '', 200);
                        }
                    }
                }
            });
            
            shopContainer.appendChild(div);
        });
    };
});
