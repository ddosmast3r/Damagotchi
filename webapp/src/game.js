/**
 * Tamagotchi Game - Development Environment
 *
 * Main game controller that ties everything together.
 */

class TamagotchiGame {
    constructor() {
        this.stats = {
            mood: 80,
            energy: 60,
            anxiety: 20,
            sleep: 70,
            addiction: 0,
            mental_health: 70,
            coins: 150
        };

        this.character = document.getElementById('character');
        this.room = document.getElementById('room');
        this.currentStateEl = document.getElementById('currentState');
        this.frameInfoEl = document.getElementById('frameInfo');

        // Create canvas for sprite rendering
        this.setupCanvas();

        // Initialize animation engine
        this.animEngine = new AnimationEngine(this.canvas);
        this.animEngine.onFrameChange = (frame, total) => {
            this.updateFrameInfo(frame, total);
        };

        // Start the engine
        this.animEngine.start();

        // Button highlighting
        this.activeButton = null;

        console.log('Tamagotchi Dev Environment loaded!');
        console.log('Use game.playAnimation("name") or buttons to test animations');
    }

    setupCanvas() {
        // Replace character div with canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'characterCanvas';
        this.canvas.width = 128;
        this.canvas.height = 128;
        this.canvas.style.cssText = `
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        `;

        this.character.style.display = 'none';
        this.room.appendChild(this.canvas);
    }

    // Play animation by name
    playAnimation(name) {
        this.animEngine.play(name);
        this.updateCurrentState(name);
        this.highlightButton(name);

        // Special effects for certain animations
        if (name === 'vape') {
            setTimeout(() => {
                this.addSmokeEffect();
            }, 500);
        }

        if (name === 'drink') {
            setTimeout(() => {
                this.addParticleEffect('energy');
            }, 600);
        }

        if (name === 'happy') {
            this.addParticleEffect('sparkle');
        }
    }

    // Update stat display
    updateStat(statName, value) {
        this.stats[statName] = parseInt(value);

        // Update visual bars
        const barEl = document.querySelector(`.stat-fill.${statName}`);
        if (barEl) {
            barEl.style.width = `${value}%`;
        }

        // Auto-switch to sad animation if mental health is low
        if (statName === 'mental' && value < 30) {
            this.playAnimation('sad');
        }

        // Sync sliders
        const slider = document.getElementById(`${statName}Slider`);
        if (slider) {
            slider.value = value;
        }
    }

    // Update current state display
    updateCurrentState(name) {
        if (this.currentStateEl) {
            this.currentStateEl.textContent = name;
        }
    }

    // Update frame info display
    updateFrameInfo(frame, total) {
        if (this.frameInfoEl) {
            this.frameInfoEl.textContent = `Frame: ${frame + 1} / ${total}`;
        }
    }

    // Highlight active animation button
    highlightButton(name) {
        // Remove previous highlight
        document.querySelectorAll('.anim-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Find and highlight current button
        document.querySelectorAll('.anim-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(name.toLowerCase()) ||
                btn.onclick.toString().includes(`'${name}'`)) {
                btn.classList.add('active');
            }
        });
    }

    // Add smoke effect for vaping
    addSmokeEffect() {
        const smoke = document.createElement('div');
        smoke.className = 'smoke';
        smoke.style.left = `${this.canvas.offsetLeft + 60}px`;
        smoke.style.bottom = '140px';
        this.room.appendChild(smoke);

        setTimeout(() => smoke.remove(), 1500);

        // Add multiple smoke puffs
        for (let i = 1; i < 4; i++) {
            setTimeout(() => {
                const s = document.createElement('div');
                s.className = 'smoke';
                s.style.left = `${this.canvas.offsetLeft + 60 + (Math.random() - 0.5) * 20}px`;
                s.style.bottom = '140px';
                this.room.appendChild(s);
                setTimeout(() => s.remove(), 1500);
            }, i * 300);
        }
    }

    // Add particle effect
    addParticleEffect(type) {
        const container = document.createElement('div');
        container.className = 'effect-particles';
        container.style.left = `${this.canvas.offsetLeft + 32}px`;
        container.style.bottom = '120px';
        container.style.position = 'absolute';
        this.room.appendChild(container);

        const colors = {
            energy: '#00ff88',
            sparkle: '#ffd700',
            hearts: '#ff6b6b'
        };

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`);
            particle.style.setProperty('--ty', `${-Math.random() * 40 - 20}px`);
            particle.style.background = colors[type] || '#fff';
            particle.style.left = `${Math.random() * 30}px`;
            particle.style.top = `${Math.random() * 20}px`;
            container.appendChild(particle);
        }

        setTimeout(() => container.remove(), 700);
    }

    // Move character to position
    moveCharacter(targetX) {
        const currentLeft = parseInt(this.canvas.style.left) || 0;
        this.canvas.style.transition = 'left 0.5s ease';
        this.canvas.style.left = `${targetX}px`;
    }

    // Simulate game actions
    doAction(action) {
        switch (action) {
            case 'work':
                this.playAnimation('computer');
                this.stats.coins += 10;
                this.stats.energy -= 15;
                this.stats.mental_health -= 5;
                break;

            case 'sleep':
                this.playAnimation('sleep');
                this.stats.energy += 30;
                this.stats.sleep += 20;
                break;

            case 'rest':
                this.playAnimation('happy');
                this.stats.mood += 10;
                this.stats.mental_health += 5;
                break;

            case 'energy_drink':
                this.playAnimation('drink');
                this.stats.energy += 25;
                this.stats.addiction += 5;
                this.stats.coins -= 20;
                break;

            case 'vape':
                this.playAnimation('vape');
                this.stats.anxiety -= 10;
                this.stats.addiction += 10;
                this.stats.coins -= 15;
                break;
        }

        this.syncStatsDisplay();
    }

    // Sync all stats to display
    syncStatsDisplay() {
        this.updateStat('mood', Math.max(0, Math.min(100, this.stats.mood)));
        this.updateStat('energy', Math.max(0, Math.min(100, this.stats.energy)));
        this.updateStat('mental', Math.max(0, Math.min(100, this.stats.mental_health)));

        document.getElementById('coins').textContent = this.stats.coins;
    }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TamagotchiGame();

    // Make game globally accessible for console testing
    window.game = game;
});
