/**
 * Animation Engine for Tamagotchi
 *
 * Handles sprite animation playback, transitions, and effects.
 */

class AnimationEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 200; // ms between frames
        this.isPlaying = true;
        this.scale = 4; // Pixel scale
        this.position = { x: 0, y: 0 };
        this.effects = [];
        this.onFrameChange = null;

        // Animation-specific settings
        this.animationSettings = {
            idle: { frameDelay: 500, loop: true },
            walk: { frameDelay: 150, loop: true },
            drink: { frameDelay: 300, loop: false, onComplete: () => this.play('idle') },
            vape: { frameDelay: 250, loop: false, onComplete: () => this.play('idle') },
            computer: { frameDelay: 400, loop: true },
            sleep: { frameDelay: 800, loop: true },
            sad: { frameDelay: 600, loop: true },
            happy: { frameDelay: 200, loop: true }
        };

        this.lastTime = 0;
        this.animate = this.animate.bind(this);
    }

    // Start animation loop
    start() {
        this.isPlaying = true;
        requestAnimationFrame(this.animate);
    }

    // Stop animation loop
    stop() {
        this.isPlaying = false;
    }

    // Play a specific animation
    play(animationName) {
        if (!SPRITES[animationName]) {
            console.warn(`Animation "${animationName}" not found`);
            return;
        }

        if (this.currentAnimation !== animationName) {
            this.currentAnimation = animationName;
            this.currentFrame = 0;
            this.frameTimer = 0;
        }
    }

    // Main animation loop
    animate(currentTime) {
        if (!this.isPlaying) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.animate);
    }

    // Update animation state
    update(deltaTime) {
        const settings = this.animationSettings[this.currentAnimation] || { frameDelay: 200, loop: true };
        const frames = SPRITES[this.currentAnimation];

        if (!frames) return;

        this.frameTimer += deltaTime;

        if (this.frameTimer >= settings.frameDelay) {
            this.frameTimer = 0;
            this.currentFrame++;

            if (this.currentFrame >= frames.length) {
                if (settings.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = frames.length - 1;
                    if (settings.onComplete) {
                        settings.onComplete();
                    }
                }
            }

            // Callback for frame info display
            if (this.onFrameChange) {
                this.onFrameChange(this.currentFrame, frames.length);
            }
        }

        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.update(deltaTime);
            return effect.isAlive;
        });
    }

    // Render current frame
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Get current sprite frame
        const frames = SPRITES[this.currentAnimation];
        if (!frames || !frames[this.currentFrame]) return;

        const spriteData = frames[this.currentFrame];

        // Center the sprite
        const spriteWidth = 16 * this.scale;
        const spriteHeight = 16 * this.scale;
        const x = (this.canvas.width - spriteWidth) / 2 + this.position.x;
        const y = (this.canvas.height - spriteHeight) / 2 + this.position.y;

        // Render the sprite
        renderSprite(this.ctx, spriteData, x, y, this.scale);

        // Render effects
        this.effects.forEach(effect => effect.render(this.ctx));
    }

    // Add particle effect
    addParticles(type, x, y) {
        const effect = new ParticleEffect(type, x, y);
        this.effects.push(effect);
    }

    // Set canvas size
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

/**
 * Particle Effect class
 */
class ParticleEffect {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.isAlive = true;
        this.lifetime = 0;
        this.maxLifetime = 1000;

        this.initParticles();
    }

    initParticles() {
        const count = this.type === 'smoke' ? 5 : 10;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 2,
                vy: this.type === 'smoke' ? -Math.random() * 2 : (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                alpha: 1,
                color: this.getColor()
            });
        }
    }

    getColor() {
        const colors = {
            smoke: '#cccccc',
            sparkle: '#ffd700',
            energy: '#00ff88',
            hearts: '#ff6b6b'
        };
        return colors[this.type] || '#ffffff';
    }

    update(deltaTime) {
        this.lifetime += deltaTime;

        if (this.lifetime >= this.maxLifetime) {
            this.isAlive = false;
            return;
        }

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = 1 - (this.lifetime / this.maxLifetime);

            if (this.type === 'smoke') {
                p.size += 0.1;
            }
        });
    }

    render(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;

            if (this.type === 'smoke') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
        });

        ctx.globalAlpha = 1;
    }
}

// Export
window.AnimationEngine = AnimationEngine;
window.ParticleEffect = ParticleEffect;
