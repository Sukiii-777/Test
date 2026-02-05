/* 共享工具函数 - 游戏项目通用工具 */

// 本地存储工具
const StorageUtils = {
    // 保存数据到本地存储
    save: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return false;
        }
    },
    
    // 从本地存储加载数据
    load: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('从本地存储加载失败:', error);
            return defaultValue;
        }
    },
    
    // 从本地存储移除数据
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('从本地存储移除失败:', error);
            return false;
        }
    },
    
    // 清空所有游戏相关数据
    clearGameData: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('game') || key.includes('score') || key.includes('best')) {
                localStorage.removeItem(key);
            }
        });
    }
};

// 数学工具
const MathUtils = {
    // 生成指定范围内的随机整数
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 生成指定范围内的随机浮点数
    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // 生成随机布尔值
    randomBool: function() {
        return Math.random() >= 0.5;
    },
    
    // 从数组中随机选择一个元素
    randomChoice: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // 限制数值在指定范围内
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 计算两点之间的距离
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    // 线性插值
    lerp: function(start, end, amount) {
        return start + (end - start) * amount;
    }
};

// 游戏工具
const GameUtils = {
    // 格式化分数显示（添加千位分隔符）
    formatScore: function(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // 格式化时间显示（MM:SS）
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // 检测碰撞（矩形 vs 矩形）
    rectRectCollision: function(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },
    
    // 检测碰撞（圆形 vs 圆形）
    circleCircleCollision: function(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    },
    
    // 检测碰撞（点 vs 矩形）
    pointRectCollision: function(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    },
    
    // 检测碰撞（点 vs 圆形）
    pointCircleCollision: function(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        return Math.sqrt(dx * dx + dy * dy) < circle.radius;
    },
    
    // 生成随机颜色
    randomColor: function() {
        const colors = [
            '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE',
            '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE',
            '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40',
            '#FF6E40', '#FF3D00'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 生成渐变色
    gradientColor: function(color1, color2, percent) {
        // 简化版本 - 实际实现需要解析颜色值
        return percent < 0.5 ? color1 : color2;
    },
    
    // 计算游戏难度系数
    calculateDifficulty: function(level, baseDifficulty = 1) {
        return baseDifficulty * Math.pow(1.1, level - 1);
    }
};

// 动画工具
const AnimationUtils = {
    // 缓动函数
    easeInOutQuad: function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    easeOutCubic: function(t) {
        return (--t) * t * t + 1;
    },
    
    easeInOutSine: function(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    },
    
    // 创建动画帧
    animate: function(duration, update, easing = 'linear') {
        const startTime = performance.now();
        
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            let easedProgress;
            switch(easing) {
                case 'easeInOutQuad':
                    easedProgress = AnimationUtils.easeInOutQuad(progress);
                    break;
                case 'easeOutCubic':
                    easedProgress = AnimationUtils.easeOutCubic(progress);
                    break;
                case 'easeInOutSine':
                    easedProgress = AnimationUtils.easeInOutSine(progress);
                    break;
                default:
                    easedProgress = progress;
            }
            
            update(easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        
        requestAnimationFrame(step);
    },
    
    // 淡入效果
    fadeIn: function(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        AnimationUtils.animate(duration, function(progress) {
            element.style.opacity = progress;
        }, 'easeInOutSine');
    },
    
    // 淡出效果
    fadeOut: function(element, duration = 300) {
        const initialOpacity = parseFloat(element.style.opacity) || 1;
        
        AnimationUtils.animate(duration, function(progress) {
            element.style.opacity = initialOpacity * (1 - progress);
        }, 'easeInOutSine');
        
        setTimeout(function() {
            element.style.display = 'none';
            element.style.opacity = initialOpacity;
        }, duration);
    }
};

// 音频工具
const AudioUtils = {
    sounds: {},
    
    // 预加载声音
    preload: function(sounds) {
        Object.keys(sounds).forEach(key => {
            this.sounds[key] = new Audio(sounds[key]);
            this.sounds[key].load();
        });
    },
    
    // 播放声音
    play: function(soundKey, volume = 0.5) {
        if (this.sounds[soundKey]) {
            const sound = this.sounds[soundKey].cloneNode();
            sound.volume = volume;
            sound.play().catch(e => console.log('音频播放失败:', e));
        }
    },
    
    // 播放简单音效
    playBeep: function(frequency = 440, duration = 100, volume = 0.1) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.log('Web Audio API 不支持:', error);
        }
    }
};

// 导出所有工具
window.GameTools = {
    StorageUtils,
    MathUtils,
    GameUtils,
    AnimationUtils,
    AudioUtils
};

// 初始化工具
document.addEventListener('DOMContentLoaded', function() {
    console.log('游戏工具已加载');
});