/* 贪吃蛇游戏主逻辑 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('bestScore');
    const snakeLengthElement = document.getElementById('snakeLength');
    const levelElement = document.getElementById('level');
    const speedElement = document.getElementById('speed');
    const foodEatenElement = document.getElementById('foodEaten');
    const newGameButton = document.getElementById('newGameButton');
    const pauseButton = document.getElementById('pauseButton');
    const hintButton = document.getElementById('hintButton');
    const restartButton = document.getElementById('restartButton');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const winScreen = document.getElementById('winScreen');
    const finalScoreElement = document.getElementById('finalScore');
    const winLevelElement = document.getElementById('winLevel');
    
    // 移动控制按钮
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // 游戏配置
    const config = {
        gridSize: 20,           // 网格大小
        initialSpeed: 10,       // 初始速度（帧/秒）
        speedIncrement: 0.5,    // 每关速度增量
        foodPoints: 10,         // 每个食物的分数
        levelUpThreshold: 10,   // 升级需要的食物数量
        maxLevel: 10,           // 最大关卡
        specialFoodChance: 0.1, // 特殊食物出现概率
        specialFoodPoints: 50   // 特殊食物分数
    };
    
    // 游戏状态
    let gameState = {
        snake: [],
        food: { x: 0, y: 0 },
        specialFood: null,
        direction: 'right',
        nextDirection: 'right',
        score: 0,
        bestScore: 0,
        level: 1,
        speed: config.initialSpeed,
        foodEaten: 0,
        gameOver: false,
        paused: false,
        gameLoopId: null,
        lastRenderTime: 0,
        gridWidth: Math.floor(canvas.width / config.gridSize),
        gridHeight: Math.floor(canvas.height / config.gridSize)
    };
    
    // 从本地存储加载最高分
    function loadBestScore() {
        const savedBestScore = GameTools.StorageUtils.load('snake-bestScore', 0);
        gameState.bestScore = savedBestScore;
        bestScoreElement.textContent = gameState.bestScore;
    }
    
    // 保存最高分到本地存储
    function saveBestScore() {
        if (gameState.score > gameState.bestScore) {
            gameState.bestScore = gameState.score;
            GameTools.StorageUtils.save('snake-bestScore', gameState.bestScore);
            bestScoreElement.textContent = gameState.bestScore;
        }
    }
    
    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        gameState.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        gameState.direction = 'right';
        gameState.nextDirection = 'right';
        gameState.score = 0;
        gameState.level = 1;
        gameState.speed = config.initialSpeed;
        gameState.foodEaten = 0;
        gameState.gameOver = false;
        gameState.paused = false;
        gameState.specialFood = null;
        
        // 生成第一个食物
        generateFood();
        
        // 更新UI
        updateUI();
        
        // 隐藏游戏结束和胜利屏幕
        gameOverScreen.style.display = 'none';
        winScreen.style.display = 'none';
        
        // 绘制游戏
        drawGame();
        
        // 开始游戏循环
        if (gameState.gameLoopId) {
            cancelAnimationFrame(gameState.gameLoopId);
        }
        gameState.lastRenderTime = 0;
        gameState.gameLoopId = requestAnimationFrame(gameLoop);
        
        // 更新按钮文本
        pauseButton.innerHTML = '<span class="icon">⏸️</span> 暂停';
    }
    
    // 生成食物
    function generateFood() {
        let foodPlaced = false;
        
        while (!foodPlaced) {
            gameState.food = {
                x: Math.floor(Math.random() * gameState.gridWidth),
                y: Math.floor(Math.random() * gameState.gridHeight)
            };
            
            // 检查食物是否在蛇身上
            let onSnake = false;
            for (const segment of gameState.snake) {
                if (segment.x === gameState.food.x && segment.y === gameState.food.y) {
                    onSnake = true;
                    break;
                }
            }
            
            if (!onSnake) {
                foodPlaced = true;
            }
        }
        
        // 随机生成特殊食物
        if (Math.random() < config.specialFoodChance && gameState.level >= 3) {
            generateSpecialFood();
        }
    }
    
    // 生成特殊食物
    function generateSpecialFood() {
        let foodPlaced = false;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!foodPlaced && attempts < maxAttempts) {
            gameState.specialFood = {
                x: Math.floor(Math.random() * gameState.gridWidth),
                y: Math.floor(Math.random() * gameState.gridHeight),
                type: 'special',
                lifetime: 300 // 特殊食物存在时间（帧数）
            };
            
            // 检查特殊食物是否在蛇身上或普通食物上
            let collision = false;
            
            // 检查蛇
            for (const segment of gameState.snake) {
                if (segment.x === gameState.specialFood.x && segment.y === gameState.specialFood.y) {
                    collision = true;
                    break;
                }
            }
            
            // 检查普通食物
            if (!collision && gameState.food.x === gameState.specialFood.x && gameState.food.y === gameState.specialFood.y) {
                collision = true;
            }
            
            if (!collision) {
                foodPlaced = true;
            }
            
            attempts++;
        }
        
        if (!foodPlaced) {
            gameState.specialFood = null;
        }
    }
    
    // 更新特殊食物
    function updateSpecialFood() {
        if (gameState.specialFood) {
            gameState.specialFood.lifetime--;
            
            if (gameState.specialFood.lifetime <= 0) {
                gameState.specialFood = null;
            }
        }
    }
    
    // 移动蛇
    function moveSnake() {
        // 更新方向
        gameState.direction = gameState.nextDirection;
        
        // 获取蛇头
        const head = { ...gameState.snake[0] };
        
        // 根据方向移动蛇头
        switch (gameState.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 检查边界碰撞
        if (head.x < 0 || head.x >= gameState.gridWidth || 
            head.y < 0 || head.y >= gameState.gridHeight) {
            gameOver();
            return;
        }
        
        // 检查自身碰撞
        for (const segment of gameState.snake) {
            if (segment.x === head.x && segment.y === head.y) {
                gameOver();
                return;
            }
        }
        
        // 添加新的蛇头
        gameState.snake.unshift(head);
        
        // 检查是否吃到食物
        let ateFood = false;
        let ateSpecialFood = false;
        
        if (head.x === gameState.food.x && head.y === gameState.food.y) {
            ateFood = true;
            gameState.score += config.foodPoints;
            gameState.foodEaten++;
            
            // 检查是否需要升级
            if (gameState.foodEaten >= config.levelUpThreshold) {
                levelUp();
            }
            
            // 生成新食物
            generateFood();
        } else if (gameState.specialFood && 
                   head.x === gameState.specialFood.x && head.y === gameState.specialFood.y) {
            ateSpecialFood = true;
            gameState.score += config.specialFoodPoints;
            gameState.foodEaten += 3; // 特殊食物算作3个普通食物
            
            // 检查是否需要升级
            if (gameState.foodEaten >= config.levelUpThreshold) {
                levelUp();
            }
            
            gameState.specialFood = null;
        } else {
            // 如果没有吃到食物，移除蛇尾
            gameState.snake.pop();
        }
        
        // 更新UI
        updateUI();
        
        // 播放音效
        if (ateFood) {
            GameTools.AudioUtils.playBeep(800, 100, 0.2);
        } else if (ateSpecialFood) {
            GameTools.AudioUtils.playBeep(1200, 200, 0.3);
        }
    }
    
    // 升级
    function levelUp() {
        gameState.level++;
        gameState.foodEaten = 0;
        gameState.speed += config.speedIncrement;
        
        // 检查是否达到最大关卡
        if (gameState.level > config.maxLevel) {
            winGame();
            return;
        }
        
        // 显示升级消息
        showMessage(`恭喜！升级到第${gameState.level}关！`, 2000);
        
        // 更新UI
        updateUI();
    }
    
    // 游戏结束
    function gameOver() {
        gameState.gameOver = true;
        cancelAnimationFrame(gameState.gameLoopId);
        
        // 保存最高分
        saveBestScore();
        
        // 显示游戏结束屏幕
        finalScoreElement.textContent = gameState.score;
        gameOverScreen.style.display = 'flex';
        
        // 播放游戏结束音效
        GameTools.AudioUtils.playBeep(300, 500, 0.3);
    }
    
    // 游戏胜利
    function winGame() {
        gameState.gameOver = true;
        cancelAnimationFrame(gameState.gameLoopId);
        
        // 保存最高分
        saveBestScore();
        
        // 显示胜利屏幕
        winLevelElement.textContent = gameState.level - 1;
        winScreen.style.display = 'flex';
        
        // 播放胜利音效
        GameTools.AudioUtils.playBeep(1000, 300, 0.3);
        setTimeout(() => GameTools.AudioUtils.playBeep(1200, 300, 0.3), 300);
        setTimeout(() => GameTools.AudioUtils.playBeep(1400, 500, 0.3), 600);
    }
    
    // 显示消息
    function showMessage(text, duration = 2000) {
        // 创建消息元素
        const message = document.createElement('div');
        message.className = 'hint-message';
        message.textContent = text;
        message.style.display = 'block';
        
        // 添加到游戏容器
        const gameBoard = document.querySelector('.game-board-container');
        gameBoard.appendChild(message);
        
        // 移除消息
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 500);
        }, duration);
    }
    
    // 更新UI
    function updateUI() {
        scoreElement.textContent = gameState.score;
        snakeLengthElement.textContent = gameState.snake.length;
        levelElement.textContent = gameState.level;
        speedElement.textContent = gameState.speed.toFixed(1);
        foodEatenElement.textContent = gameState.foodEaten;
        
        // 更新最高分显示
        loadBestScore();
    }
    
    // 绘制游戏
    function drawGame() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        drawGrid();
        
        // 绘制蛇
        drawSnake();
        
        // 绘制食物
        drawFood();
        
        // 绘制特殊食物
        if (gameState.specialFood) {
            drawSpecialFood();
        }
        
        // 绘制游戏信息
        drawGameInfo();
    }
    
    // 绘制网格
    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = 0; x <= canvas.width; x += config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= canvas.height; y += config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // 绘制蛇
    function drawSnake() {
        // 绘制蛇身
        for (let i = 0; i < gameState.snake.length; i++) {
            const segment = gameState.snake[i];
            const x = segment.x * config.gridSize;
            const y = segment.y * config.gridSize;
            const size = config.gridSize - 2;
            
            // 蛇头
            if (i === 0) {
                ctx.fillStyle = '#4cd137';
                ctx.strokeStyle = '#2ecc71';
                
                // 绘制眼睛
                ctx.fillStyle = 'white';
                let eyeX1, eyeY1, eyeX2, eyeY2;
                
                switch(gameState.direction) {
                    case 'right':
                        eyeX1 = x + size - 4; eyeY1 = y + 6;
                        eyeX2 = x + size - 4; eyeY2 = y + size - 6;
                        break;
                    case 'left':
                        eyeX1 = x + 4; eyeY1 = y + 6;
                        eyeX2 = x + 4; eyeY2 = y + size - 6;
                        break;
                    case 'up':
                        eyeX1 = x + 6; eyeY1 = y + 4;
                        eyeX2 = x + size - 6; eyeY2 = y + 4;
                        break;
                    case 'down':
                        eyeX1 = x + 6; eyeY1 = y + size - 4;
                        eyeX2 = x + size - 6; eyeY2 = y + size - 4;
                        break;
                }
                
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, 2, 0, Math.PI * 2);
                ctx.arc(eyeX2, eyeY2, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制舌头
                ctx.fillStyle = '#e74c3c';
                let tongueX, tongueY;
                
                switch(gameState.direction) {
                    case 'right':
                        tongueX = x + size + 2; tongueY = y + size / 2;
                        break;
                    case 'left':
                        tongueX = x - 2; tongueY = y + size / 2;
                        break;
                    case 'up':
                        tongueX = x + size / 2; tongueY = y - 2;
                        break;
                    case 'down':
                        tongueX = x + size / 2; tongueY = y + size + 2;
                        break;
                }
                
                ctx.beginPath();
                ctx.arc(tongueX, tongueY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // 蛇身
            else {
                // 颜色渐变
                const colorValue = Math.floor(200 - (i / gameState.snake.length) * 100);
                ctx.fillStyle = `rgb(76, ${colorValue}, 55)`;
                ctx.strokeStyle = `rgb(46, ${colorValue - 20}, 113)`;
            }
            
            // 绘制蛇段
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, size, size, 4);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    // 绘制食物
    function drawFood() {
        const x = gameState.food.x * config.gridSize;
        const y = gameState.food.y * config.gridSize;
        const size = config.gridSize - 4;
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // 食物主体
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 食物高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX - size / 4, centerY - size / 4, size / 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制特殊食物
    function drawSpecialFood() {
        const x = gameState.specialFood.x * config.gridSize;
        const y = gameState.specialFood.y * config.gridSize;
        const size = config.gridSize - 4;
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // 特殊食物主体（星星形状）
        ctx.fillStyle = '#9b59b6';
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 2;
        
        // 绘制星星
        drawStar(centerX, centerY, 5, size / 2, size / 4);
        
        // 旋转动画
        const rotation = (Date.now() / 20) % 360;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
        
        // 绘制旋转光环
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 绘制星星
    function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // 绘制游戏信息
    function drawGameInfo() {
        // 绘制分数和关卡信息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(5, 5, 150, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`得分: ${gameState.score}`, 10, 25);
        ctx.fillText(`长度: ${gameState.snake.length}`, 10, 45);
        ctx.fillText(`关卡: ${gameState.level}`, 10, 65);
        
        // 绘制特殊食物倒计时
        if (gameState.specialFood) {
            const timeLeft = Math.ceil(gameState.specialFood.lifetime / 60);
            ctx.fillStyle = 'rgba(155, 89, 182, 0.8)';
            ctx.fillRect(canvas.width - 100, 5, 95, 25);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`特殊食物: ${timeLeft}s`, canvas.width - 95, 22);
        }
    }
    
    // 游戏主循环
    function gameLoop(timestamp) {
        if (!gameState.lastRenderTime) {
            gameState.lastRenderTime = timestamp;
        }
        
        const deltaTime = timestamp - gameState.lastRenderTime;
        
        // 计算帧间隔（根据游戏速度）
        const frameInterval = 1000 / gameState.speed;
        
        if (deltaTime >= frameInterval && !gameState.paused && !gameState.gameOver) {
            gameState.lastRenderTime = timestamp - (deltaTime % frameInterval);
            
            // 更新游戏状态
            moveSnake();
            updateSpecialFood();
            
            // 绘制游戏
            drawGame();
        }
        
        // 继续游戏循环
        if (!gameState.gameOver) {
            gameState.gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
    
    // 切换暂停状态
    function togglePause() {
        gameState.paused = !gameState.paused;
        
        if (gameState.paused) {
            pauseButton.innerHTML = '<span class="icon">▶️</span> 继续';
            showMessage('游戏已暂停', 1000);
        } else {
            pauseButton.innerHTML = '<span class="icon">⏸️</span> 暂停';
            showMessage('游戏继续', 1000);
            
            // 重新开始游戏循环
            if (!gameState.gameLoopId && !gameState.gameOver) {
                gameState.lastRenderTime = 0;
                gameState.gameLoopId = requestAnimationFrame(gameLoop);
            }
        }
    }
    
    // 显示提示
    function showHint() {
        // 计算到食物的方向
        const head = gameState.snake[0];
        const dx = gameState.food.x - head.x;
        const dy = gameState.food.y - head.y;
        
        let direction = '';
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? '右' : '左';
        } else {
            direction = dy > 0 ? '下' : '上';
        }
        
        showMessage(`提示：食物在${direction}方`, 2000);
    }
    
    // 改变方向
    function changeDirection(newDirection) {
        // 防止直接反向移动
        if (
            (newDirection === 'up' && gameState.direction !== 'down') ||
            (newDirection === 'down' && gameState.direction !== 'up') ||
            (newDirection === 'left' && gameState.direction !== 'right') ||
            (newDirection === 'right' && gameState.direction !== 'left')
        ) {
            gameState.nextDirection = newDirection;
        }
    }
    
    // 事件监听
    newGameButton.addEventListener('click', initGame);
    restartButton.addEventListener('click', initGame);
    pauseButton.addEventListener('click', togglePause);
    hintButton.addEventListener('click', showHint);
    nextLevelButton.addEventListener('click', initGame);
    
    // 移动控制按钮事件
    upBtn.addEventListener('click', () => changeDirection('up'));
    downBtn.addEventListener('click', () => changeDirection('down'));
    leftBtn.addEventListener('click', () => changeDirection('left'));
    rightBtn.addEventListener('click', () => changeDirection('right'));
    
    // 键盘控制
    document.addEventListener('keydown', function(e) {
        if (gameState.gameOver) return;
        
        switch(e.key) {
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                togglePause();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                togglePause();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                changeDirection('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                changeDirection('down');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                changeDirection('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                changeDirection('right');
                break;
            case 'h':
            case 'H':
                e.preventDefault();
                showHint();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    initGame();
                }
                break;
        }
    });
    
    // 触摸滑动控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 确定滑动方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 0) {
                changeDirection('right');
            } else {
                changeDirection('left');
            }
        } else {
            // 垂直滑动
            if (dy > 0) {
                changeDirection('down');
            } else {
                changeDirection('up');
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
        e.preventDefault();
    }, { passive: false });
    
    // 窗口大小改变时重新绘制游戏
    window.addEventListener('resize', function() {
        drawGame();
    });
    
    // 初始化游戏
    initGame();
});

// 添加 roundRect 方法到 CanvasRenderingContext2D 原型（如果不存在）
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}