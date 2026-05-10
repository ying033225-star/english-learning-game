class AudioManager {
    constructor() {
        // TTS
        this.synth = window.speechSynthesis || null;
        this.voice = null;
        this.speaking = false;
        if (this.synth) {
            try { this.initVoice(); } catch (e) { /* ignore */ }
        }

        // Speech Recognition
        this.recognition = null;
        this.recognitionSupported = false;
        try { this.initRecognition(); } catch (e) { /* ignore */ }

        // Sound Effects via Web Audio API
        this.audioCtx = null;
        this.sfxEnabled = false;
        try { this.initAudioContext(); } catch (e) { /* ignore */ }
    }

    // ==================== TTS ====================

    initVoice() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            if (voices.length === 0) return;
            this.voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
                || voices.find(v => v.lang.startsWith('en-US'))
                || voices.find(v => v.lang.startsWith('en'))
                || voices[0];
        };
        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }

        // Warm up speech synthesis on first user click
        const warmUp = () => {
            if (!this.voice) loadVoices();
            // Speak a silent utterance to activate audio context
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            u.rate = 2;
            this.synth.speak(u);
            document.removeEventListener('click', warmUp);
            document.removeEventListener('keydown', warmUp);
        };
        document.addEventListener('click', warmUp, { once: true });
        document.addEventListener('keydown', warmUp, { once: true });
    }

    speak(text, rate = 0.85, pitch = 1.3) {
        if (!this.synth) return false;

        // Reload voices on every call (they load async on Mac)
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
            // Prefer cute/higher-pitched voices: Samantha (Mac), Google female, Zira (Win)
            this.voice = voices.find(v => v.name.includes('Samantha'))
                || voices.find(v => v.name.includes('Google') && v.name.includes('Female'))
                || voices.find(v => v.name.includes('Zira'))
                || voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Female'))
                || voices.find(v => v.lang.startsWith('en-US'))
                || voices.find(v => v.lang.startsWith('en'))
                || voices[0];
        }

        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1.0;

        this.speaking = true;
        utterance.onend = () => { this.speaking = false; };
        utterance.onerror = () => {
            this.speaking = false;
            // Retry once without voice on any error
            if (this.voice) {
                this.voice = null;
                this.synth.cancel();
                const retry = new SpeechSynthesisUtterance(text);
                retry.rate = rate;
                retry.pitch = pitch;
                retry.volume = 1.0;
                retry.onend = () => { this.speaking = false; };
                retry.onerror = () => { this.speaking = false; };
                this.synth.speak(retry);
            }
        };

        this.synth.speak(utterance);
        return true;
    }

    speakWord(word) {
        this.speak(word, 0.8, 1.4);
    }

    speakSentence(sentence) {
        this.speak(sentence, 0.8, 1.2);
    }

    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.speaking = false;
        }
    }

    // ==================== Speech Recognition (跟读) ====================

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.recognitionSupported = false;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;
        this.recognitionSupported = true;
    }

    listenAndCompare(targetText, onResult) {
        if (!this.recognitionSupported) {
            // Fallback: show alert that device doesn't support
            onResult({ success: false, reason: 'not_supported', message: '你的浏览器不支持语音识别，请使用Chrome浏览器并在localhost或HTTPS下打开' });
            return;
        }

        this.recognition.onresult = (event) => {
            const results = event.results[0];
            const transcripts = [];
            for (let i = 0; i < results.length; i++) {
                transcripts.push(results[i].transcript.toLowerCase().trim());
            }

            const target = targetText.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
            const bestMatch = transcripts[0] || '';
            const similarity = this.calculateSimilarity(bestMatch.replace(/[^a-z0-9\s]/g, ''), target);

            const passed = similarity >= 0.6;
            onResult({
                success: true,
                passed: passed,
                similarity: similarity,
                transcript: bestMatch,
                target: targetText,
                message: passed
                    ? `很棒! 相似度: ${Math.round(similarity * 100)}%`
                    : `再试一次~ 你说的是: "${bestMatch}" 相似度: ${Math.round(similarity * 100)}%`
            });
        };

        this.recognition.onerror = (event) => {
            onResult({ success: false, reason: event.error, message: `语音识别出错: ${event.error}` });
        };

        this.recognition.onnomatch = () => {
            onResult({ success: false, reason: 'no_match', message: '没有识别到语音，请再试一次' });
        };

        try {
            this.recognition.start();
        } catch (e) {
            onResult({ success: false, reason: 'error', message: '语音识别启动失败' });
        }
    }

    stopListening() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) { /* ignore */ }
        }
    }

    calculateSimilarity(a, b) {
        if (!a || !b) return 0;
        if (a === b) return 1;

        // Simple word-level similarity
        const wordsA = a.split(/\s+/);
        const wordsB = b.split(/\s+/);
        let matches = 0;
        const setB = new Set(wordsB);
        for (const w of wordsA) {
            if (setB.has(w)) matches++;
        }

        const total = Math.max(wordsA.length, wordsB.length);
        return total > 0 ? matches / total : 0;
    }

    // ==================== Sound Effects ====================

    initAudioContext() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.sfxEnabled = true;
        } catch (e) {
            this.sfxEnabled = false;
        }
    }

    ensureContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Play a simple tone
    playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.sfxEnabled || !this.audioCtx) return;
        this.ensureContext();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
    }

    sfxJump() {
        this.playTone(400, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(600, 0.08, 'square', 0.1), 50);
    }

    sfxCoin() {
        this.playTone(988, 0.08, 'square', 0.2);
        setTimeout(() => this.playTone(1319, 0.15, 'square', 0.2), 80);
    }

    sfxCorrect() {
        this.playTone(523, 0.1, 'sine', 0.25);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.25), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.25), 200);
    }

    sfxWrong() {
        this.playTone(200, 0.2, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.15), 150);
    }

    sfxLevelComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 150);
        });
    }

    sfxHit() {
        this.playTone(300, 0.08, 'triangle', 0.2);
    }

    sfxStomp() {
        this.playTone(200, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(100, 0.15, 'square', 0.2), 50);
    }
}

let audioManager;
