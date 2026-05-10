// ProgressManager - localStorage progress tracking
class ProgressManager {
    constructor() {
        this.progress = this.loadProgress();
    }

    getDefaultProgress() {
        return {
            currentWorld: 1,
            currentLevel: 1,
            worlds: {
                1: { unlocked: true, levels: { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false }, boss: { stars: 0, completed: false } } },
                2: { unlocked: false, levels: { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false }, boss: { stars: 0, completed: false } } },
                3: { unlocked: false, levels: { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false }, boss: { stars: 0, completed: false } } },
                4: { unlocked: false, levels: { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false }, boss: { stars: 0, completed: false } } },
                5: { unlocked: false, levels: { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false }, boss: { stars: 0, completed: false } } },
                6: { unlocked: false, levels: { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false }, boss: { stars: 0, completed: false } } }
            }
        };
    }

    loadProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem('gameProgress'));
            return saved || this.getDefaultProgress();
        } catch {
            return this.getDefaultProgress();
        }
    }

    saveProgress() {
        try {
            localStorage.setItem('gameProgress', JSON.stringify(this.progress));
        } catch { /* storage full */ }
    }

    completeLevel(world, level, stars) {
        if (!this.progress.worlds[world]) return;
        this.progress.worlds[world].levels[level].completed = true;
        this.progress.worlds[world].levels[level].stars = Math.max(
            this.progress.worlds[world].levels[level].stars,
            stars
        );

        // Unlock next level or world
        if (level === 'boss') {
            // Unlock next world
            const nextWorld = world + 1;
            if (this.progress.worlds[nextWorld]) {
                this.progress.worlds[nextWorld].unlocked = true;
            }
        } else {
            // Unlock next level
            const nextLevel = level + 1;
            if (this.progress.worlds[world].levels[nextLevel]) {
                this.progress.worlds[world].levels[nextLevel].unlocked = true;
            }
        }

        this.progress.currentWorld = world;
        this.progress.currentLevel = level;
        this.saveProgress();
    }

    getLevelStars(world, level) {
        return this.progress.worlds[world]?.levels[level]?.stars || 0;
    }

    isLevelUnlocked(world, level) {
        return this.progress.worlds[world]?.unlocked
            && this.progress.worlds[world]?.levels[level]?.unlocked !== false;
    }

    resetProgress() {
        this.progress = this.getDefaultProgress();
        this.saveProgress();
    }
}

// Global instance
let progressManager;
