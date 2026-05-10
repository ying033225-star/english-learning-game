class QuestionUI {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.container = null;
        this.audioMgr = null;
    }

    show(questionData, onAnswer) {
        if (this.isOpen) return;
        this.isOpen = true;

        const scene = this.scene;
        const { width, height } = scene.cameras.main;

        // Pause game physics
        scene.physics.pause();

        // Ensure we have an audio manager
        if (!this.audioMgr) {
            this.audioMgr = new AudioManager();
        }

        // Dark overlay
        this.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
            .setScrollFactor(0).setDepth(200);

        // Container for question elements
        const elements = [];

        // Question panel background
        const panelW = 500;
        const panelH = questionData.type === 'sentence' ? 420 : 300;
        const panelX = width / 2;
        const panelY = height / 2;

        const panel = scene.add.graphics().setScrollFactor(0).setDepth(201);
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
        panel.lineStyle(3, 0xff69b4);
        panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
        elements.push(panel);

        // Question type badge
        const typeLabels = {
            vocabulary: '单词',
            listening: '听力',
            sentence: '句型',
            grammar: '语法',
            phonics: '语音'
        };
        const badgeColors = {
            vocabulary: 0xffb6c1,
            listening: 0x87ceeb,
            sentence: 0xdda0dd,
            grammar: 0x90ee90,
            phonics: 0xffd700
        };
        const badgeColor = badgeColors[questionData.type] || 0xffb6c1;
        const badge = scene.add.graphics().setScrollFactor(0).setDepth(202);
        badge.fillStyle(badgeColor);
        badge.fillRoundedRect(panelX - 38, panelY - panelH / 2 - 10, 76, 24, 6);
        const badgeText = scene.add.text(panelX, panelY - panelH / 2 + 2, typeLabels[questionData.type] || '题目', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#333',
            strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(203);
        elements.push(badge, badgeText);

        // Review badge
        if (questionData.isReview) {
            const rBadge = scene.add.text(panelX + 60, panelY - panelH / 2, '复习', {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ff6b6b'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(203);
            elements.push(rBadge);
        }

        // Question text
        const questionText = scene.add.text(panelX, panelY - 70, questionData.question, {
            fontSize: questionData.question.length > 30 ? '16px' : '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#333333',
            wordWrap: { width: panelW - 40 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        elements.push(questionText);

        // Sub text (phonetic or hint)
        if (questionData.questionSub) {
            const subText = scene.add.text(panelX, panelY - 45, questionData.questionSub, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
            elements.push(subText);
        }

        // Audio button (speaker icon)
        if (questionData.audioText) {
            const speakerBtn = scene.add.text(panelX + panelW / 2 - 40, panelY - panelH / 2 + 5, '🔊', {
                fontSize: '22px'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(203).setInteractive({ useHandCursor: true });

            speakerBtn.on('pointerdown', () => {
                this.audioMgr.speakWord(questionData.audioText);
                speakerBtn.setScale(1.2);
                scene.time.delayedCall(200, () => speakerBtn.setScale(1));
            });
            elements.push(speakerBtn);
        }

        // Choices
        const choiceButtons = [];
        const choiceStartY = questionData.type === 'sentence' ? panelY - 10 : panelY;

        if (questionData.type === 'sentence') {
            // Sentence ordering: show words as draggable/clickable items
            // For simplicity, show as multiple choice (pick the right order)
            // Actually show individual word buttons that form the sentence
            this.createSentenceOrderUI(scene, panelX, panelY, questionData, elements, choiceButtons, onAnswer);
        } else {
            // Standard multiple choice
            const choiceLabels = ['A', 'B', 'C', 'D'];
            const choiceColors = [0xff69b4, 0x87ceeb, 0xdda0dd, 0x90ee90];

            for (let i = 0; i < questionData.choices.length; i++) {
                const cy = choiceStartY + i * 44;
                const btnW = panelW - 80;
                const btnH = 36;

                const btnBg = scene.add.graphics().setScrollFactor(0).setDepth(202);
                btnBg.fillStyle(choiceColors[i], 0.2);
                btnBg.fillRoundedRect(panelX - btnW / 2, cy - btnH / 2, btnW, btnH, 8);
                btnBg.lineStyle(2, choiceColors[i]);
                btnBg.strokeRoundedRect(panelX - btnW / 2, cy - btnH / 2, btnW, btnH, 8);

                const labelText = scene.add.text(panelX - btnW / 2 + 16, cy, choiceLabels[i], {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    color: '#' + choiceColors[i].toString(16).padStart(6, '0')
                }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(203);

                const choiceText = scene.add.text(panelX, cy, questionData.choices[i], {
                    fontSize: '15px',
                    fontFamily: 'Arial',
                    color: '#333333'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(203);

                const hitZone = scene.add.zone(panelX, cy, btnW, btnH)
                    .setInteractive({ useHandCursor: true })
                    .setScrollFactor(0).setDepth(204);

                const idx = i;
                hitZone.on('pointerover', () => {
                    btnBg.clear();
                    btnBg.fillStyle(choiceColors[idx], 0.5);
                    btnBg.fillRoundedRect(panelX - btnW / 2, cy - btnH / 2, btnW, btnH, 8);
                    btnBg.lineStyle(2, choiceColors[idx]);
                    btnBg.strokeRoundedRect(panelX - btnW / 2, cy - btnH / 2, btnW, btnH, 8);
                });
                hitZone.on('pointerout', () => {
                    btnBg.clear();
                    btnBg.fillStyle(choiceColors[idx], 0.2);
                    btnBg.fillRoundedRect(panelX - btnW / 2, cy - btnH / 2, btnW, btnH, 8);
                    btnBg.lineStyle(2, choiceColors[idx]);
                    btnBg.strokeRoundedRect(panelX - btnW / 2, cy - btnH / 2, btnW, btnH, 8);
                });
                hitZone.on('pointerdown', () => {
                    this.handleAnswer(questionData, idx, onAnswer, elements, choiceButtons, panelX, panelY);
                });

                elements.push(btnBg, labelText, choiceText, hitZone);
                choiceButtons.push({ bg: btnBg, zone: hitZone, texts: [labelText, choiceText] });
            }
        }

        this.elements = elements;
        this.choiceButtons = choiceButtons;
    }

    createSentenceOrderUI(scene, panelX, panelY, questionData, elements, choiceButtons, onAnswer) {
        const words = questionData.choices;
        const cols = Math.min(words.length, 4);
        const btnW = 80;
        const btnH = 36;
        const gap = 48;
        const rows = Math.ceil(words.length / cols);

        const selectedOrder = [];
        const wordSlots = [];
        const wordButtons = [];

        // Top area: selected word slots (clickable to undo)
        const slotY = panelY - 30;
        for (let i = 0; i < words.length; i++) {
            const sx = panelX - ((words.length - 1) * gap) / 2 + i * gap;
            const slot = scene.add.graphics().setScrollFactor(0).setDepth(202);
            slot.fillStyle(0xf0f0f0, 0.5);
            slot.fillRoundedRect(sx - btnW / 2, slotY - btnH / 2, btnW, btnH, 6);
            slot.lineStyle(2, 0xcccccc, 0.5);
            slot.strokeRoundedRect(sx - btnW / 2, slotY - btnH / 2, btnW, btnH, 6);

            const slotText = scene.add.text(sx, slotY, '', {
                fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#333333'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(203);

            const hitZone = scene.add.zone(sx, slotY, btnW, btnH)
                .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(204);

            const slotIdx = i;
            hitZone.on('pointerdown', () => {
                if (selectedOrder.length > slotIdx) {
                    const removed = selectedOrder[slotIdx];
                    selectedOrder.splice(slotIdx, 1);
                    this.redrawSentenceSlots(wordSlots, selectedOrder);
                    if (removed.btn) {
                        removed.btn.selected = false;
                        removed.btn.bg.setAlpha(1);
                        removed.btn.text.setAlpha(1);
                        removed.btn.zone.setInteractive({ useHandCursor: true });
                    }
                }
            });

            elements.push(slot, slotText, hitZone);
            wordSlots.push({ slot, bg: slot, text: slotText, zone: hitZone, x: sx });
        }

        // Bottom area: word choices
        const choiceStartY = panelY + 40;
        for (let i = 0; i < words.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = panelX - ((cols - 1) * (btnW + 8)) / 2 + col * (btnW + 8);
            const cy = choiceStartY + row * (btnH + 8);

            const wordBg = scene.add.graphics().setScrollFactor(0).setDepth(202);
            wordBg.fillStyle(0xdda0dd, 0.3);
            wordBg.fillRoundedRect(cx - btnW / 2 + 4, cy - btnH / 2, btnW, btnH, 8);
            wordBg.lineStyle(2, 0xdda0dd);
            wordBg.strokeRoundedRect(cx - btnW / 2 + 4, cy - btnH / 2, btnW, btnH, 8);

            const wordText = scene.add.text(cx + 4, cy, words[i], {
                fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: '#8b4789'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(203);

            const hitZone = scene.add.zone(cx + 4, cy, btnW, btnH)
                .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(204);

            const wb = { bg: wordBg, text: wordText, zone: hitZone, word: words[i], selected: false };
            wordButtons.push(wb);

            hitZone.on('pointerdown', () => {
                if (wb.selected) return;
                if (selectedOrder.length >= words.length) return;
                wb.selected = true;
                selectedOrder.push({ word: words[i], btn: wb });
                this.redrawSentenceSlots(wordSlots, selectedOrder);
                wb.bg.setAlpha(0.25);
                wb.text.setAlpha(0.25);
                wb.zone.disableInteractive();
            });

            elements.push(wordBg, wordText, hitZone);
            choiceButtons.push({ bg: wordBg, zone: hitZone, texts: [wordText] });
        }

        // Confirm button - positioned below all word rows
        const lastRowY = choiceStartY + (rows - 1) * (btnH + 8);
        const confirmY = lastRowY + btnH / 2 + 28;
        const confirmW = 140;
        const confirmH = 36;
        const confirmBg = scene.add.graphics().setScrollFactor(0).setDepth(202);
        this.drawConfirmBtn(confirmBg, panelX, confirmY, confirmW, confirmH, 0x90ee90);
        const confirmText = scene.add.text(panelX, confirmY, '✓ 确认提交', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
            stroke: '#333', strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(203);
        const confirmZone = scene.add.zone(panelX, confirmY, confirmW, confirmH)
            .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(204);

        confirmZone.on('pointerover', () => this.drawConfirmBtn(confirmBg, panelX, confirmY, confirmW, confirmH, 0xa0f0a0));
        confirmZone.on('pointerout', () => this.drawConfirmBtn(confirmBg, panelX, confirmY, confirmW, confirmH, 0x90ee90));
        confirmZone.on('pointerdown', () => {
            if (selectedOrder.length === 0) return;
            const userSentence = selectedOrder.map(s => s.word).join(' ');
            const correctSentence = questionData.correctOrder.join(' ');
            const isCorrect = userSentence === correctSentence;
            this.handleAnswer(questionData, isCorrect ? 0 : -1, onAnswer, elements, choiceButtons, panelX, panelY);
        });

        elements.push(confirmBg, confirmText, confirmZone);
        choiceButtons.push({ bg: confirmBg, zone: confirmZone, texts: [confirmText] });
    }

    redrawSentenceSlots(wordSlots, selectedOrder) {
        wordSlots.forEach((slot, i) => {
            // Reset all slots
            slot.bg.clear();
            if (i < selectedOrder.length) {
                slot.text.setText(selectedOrder[i].word);
                slot.bg.fillStyle(0xdda0dd, 0.3);
                slot.bg.fillRoundedRect(slot.x - 40, slot.text.y - 18, 80, 36, 6);
                slot.bg.lineStyle(2, 0xdda0dd);
                slot.bg.strokeRoundedRect(slot.x - 40, slot.text.y - 18, 80, 36, 6);
            } else {
                slot.text.setText('');
                slot.bg.fillStyle(0xf0f0f0, 0.5);
                slot.bg.fillRoundedRect(slot.x - 40, slot.text.y - 18, 80, 36, 6);
                slot.bg.lineStyle(2, 0xcccccc, 0.5);
                slot.bg.strokeRoundedRect(slot.x - 40, slot.text.y - 18, 80, 36, 6);
            }
        });
    }

    drawConfirmBtn(gfx, x, y, w, h, color) {
        gfx.clear();
        gfx.fillStyle(color, 0.9);
        gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        gfx.lineStyle(2, 0xffffff);
        gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    }

    handleAnswer(questionData, userIndex, onAnswer, elements, choiceButtons, panelX, panelY) {
        // Disable all choice buttons
        if (choiceButtons) {
            choiceButtons.forEach(btn => {
                if (btn.zone) btn.zone.disableInteractive();
            });
        }

        const correct = userIndex === questionData.correctIndex;
        const scene = this.scene;

        // Show feedback
        const feedbackText = scene.add.text(panelX, panelY - 130, correct ? '✓ 正确!' : '✗ 再想想~', {
            fontSize: '22px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: correct ? '#4caf50' : '#ff6b6b',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(205);

        // Show correct answer if wrong
        if (!correct && questionData.correctAnswer) {
            const correctText = scene.add.text(panelX, panelY - 105, `正确答案：${questionData.correctAnswer}`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#4caf50'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(205);
            elements.push(correctText);
        }

        // Explanation
        if (questionData.explain && !correct) {
            const explainText = scene.add.text(panelX, panelY - 85, questionData.explain, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#666666',
                wordWrap: { width: 400 },
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(205);
            elements.push(explainText);
        }

        elements.push(feedbackText);

        // For sentence type, add follow-along reading button
        if (correct && questionData.type === 'sentence' && questionData.audioText) {
            const delay = 600;
            scene.time.delayedCall(delay, () => {
                const readBtnY = panelY + 140;
                const readBtnW = 180;
                const readBtnH = 36;

                const readBg = scene.add.graphics().setScrollFactor(0).setDepth(205);
                readBg.fillStyle(0x87ceeb, 0.8);
                readBg.fillRoundedRect(panelX - readBtnW / 2, readBtnY - readBtnH / 2, readBtnW, readBtnH, 10);
                readBg.lineStyle(2, 0xffffff);
                readBg.strokeRoundedRect(panelX - readBtnW / 2, readBtnY - readBtnH / 2, readBtnW, readBtnH, 10);

                const readText = scene.add.text(panelX, readBtnY, '🔊 听发音跟读', {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    color: '#ffffff'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(206);

                const readZone = scene.add.zone(panelX, readBtnY, readBtnW, readBtnH)
                    .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(207);

                elements.push(readBg, readText, readZone);

                let reading = false;
                readZone.on('pointerdown', () => {
                    if (reading) return;
                    reading = true;

                    // First speak the sentence
                    if (!this.audioMgr) this.audioMgr = new AudioManager();
                    this.audioMgr.speakSentence(questionData.audioText);

                    readText.setText('🎤 请跟读...');
                    readBg.clear();
                    readBg.fillStyle(0xdda0dd, 0.8);
                    readBg.fillRoundedRect(panelX - readBtnW / 2, readBtnY - readBtnH / 2, readBtnW, readBtnH, 10);
                    readBg.lineStyle(2, 0xffffff);
                    readBg.strokeRoundedRect(panelX - readBtnW / 2, readBtnY - readBtnH / 2, readBtnW, readBtnH, 10);

                    // Wait for TTS then start recognition
                    scene.time.delayedCall(1500, () => {
                        this.audioMgr.listenAndCompare(questionData.audioText, (result) => {
                            readText.setText(result.message);
                            readBg.clear();
                            const resultColor = result.passed ? 0x90ee90 : 0xffb6b1;
                            readBg.fillStyle(resultColor, 0.8);
                            readBg.fillRoundedRect(panelX - readBtnW / 2, readBtnY - readBtnH / 2, readBtnW + 40, Math.min(readBtnH + 10, 50), 10);
                            readZone.disableInteractive();

                            // Close after delay
                            scene.time.delayedCall(1500, () => {
                                this.hide();
                                if (onAnswer) onAnswer(correct);
                            });
                        });
                    });
                });

                // Also provide a skip button
                const skipText = scene.add.text(panelX, readBtnY + 28, '跳过跟读', {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#aaa'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(206)
                    .setInteractive({ useHandCursor: true });

                skipText.on('pointerdown', () => {
                    this.hide();
                    if (onAnswer) onAnswer(correct);
                });
                elements.push(skipText);
            });
        } else {
            // Close after delay for non-sentence or wrong answers
            scene.time.delayedCall(correct ? 800 : 1800, () => {
                this.hide();
                if (onAnswer) onAnswer(correct);
            });
        }
    }

    hide() {
        this.isOpen = false;

        // Destroy all elements
        if (this.elements) {
            this.elements.forEach(el => {
                if (el && el.destroy) el.destroy();
            });
            this.elements = [];
        }

        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        this.choiceButtons = [];

        // Resume physics
        this.scene.physics.resume();
    }
}
