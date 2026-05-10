class QuizManager {
    constructor(unitData) {
        this.unitData = unitData;
        this.wrongAnswers = this.loadWrongAnswers();
        this.usedQuestions = [];
    }

    generateQuestion(type) {
        if (!this.unitData) {
            return this.fallbackQuestion();
        }

        let question;
        switch (type) {
            case 'vocabulary':
                question = this.generateVocabQuestion();
                break;
            case 'listening':
                question = this.generateListeningQuestion();
                break;
            case 'sentence':
                question = this.generateSentenceQuestion();
                break;
            case 'grammar':
                question = this.generateGrammarQuestion();
                break;
            case 'phonics':
                question = this.generatePhonicsQuestion();
                break;
            case 'spelling':
                question = this.generateSpellingQuestion();
                break;
            case 'cloze':
                question = this.generateClozeQuestion();
                break;
            default:
                question = this.generateVocabQuestion();
        }

        // Mix in review question occasionally (30% chance if reviews available)
        if (Math.random() < 0.3) {
            const reviews = this.getReviewQuestions(1);
            if (reviews.length > 0) {
                const rd = reviews[0].data;
                if (rd && rd.type && rd.question && Array.isArray(rd.choices) && rd.correctIndex !== undefined) {
                    question = rd;
                    question.isReview = true;
                }
            }
        }

        return question;
    }

    generateVocabQuestion() {
        const vocab = [...this.unitData.vocabulary];
        const correct = Phaser.Math.Between(0, vocab.length - 1);
        const correctWord = vocab[correct];

        // Pick 3 wrong options
        const wrongs = vocab.filter((_, i) => i !== correct)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Randomly choose direction: en→cn or cn→en
        const showEn = Math.random() > 0.5;

        const choices = [correctWord, ...wrongs].sort(() => Math.random() - 0.5);
        const correctIndex = choices.indexOf(correctWord);

        return {
            type: 'vocabulary',
            question: showEn ? correctWord.en : correctWord.cn,
            questionSub: showEn ? `/${correctWord.phonetic}/` : '',
            hint: showEn ? '选择中文意思' : '选择对应的英文',
            choices: choices.map(c => showEn ? c.cn : c.en),
            correctIndex: correctIndex,
            correctAnswer: showEn ? correctWord.cn : correctWord.en,
            audioText: correctWord.en,
            explain: `${correctWord.en} = ${correctWord.cn}`,
            isReview: false
        };
    }

    generateListeningQuestion() {
        const vocab = [...this.unitData.vocabulary];
        const correct = Phaser.Math.Between(0, vocab.length - 1);
        const correctWord = vocab[correct];

        const wrongs = vocab.filter((_, i) => i !== correct)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const choices = [correctWord, ...wrongs].sort(() => Math.random() - 0.5);
        const correctIndex = choices.indexOf(correctWord);

        return {
            type: 'listening',
            question: '听发音，选择对应的单词',
            questionSub: '点击喇叭重复播放',
            hint: '仔细听发音哦~',
            choices: choices.map(c => c.en),
            correctIndex: correctIndex,
            correctAnswer: correctWord.en,
            audioText: correctWord.en,
            explain: `${correctWord.en} ${correctWord.phonetic} = ${correctWord.cn}`,
            isReview: false
        };
    }

    generateSentenceQuestion() {
        const sentences = [...this.unitData.sentences];
        const sentence = sentences[Phaser.Math.Between(0, sentences.length - 1)];

        // Split into words, strip punctuation and lowercase for clean display
        const rawWords = sentence.en.split(' ');
        const words = rawWords.map(w => w.replace(/[.,!?;:'"]/g, '').toLowerCase());
        const shuffled = [...words].sort(() => Math.random() - 0.5);

        return {
            type: 'sentence',
            question: `连词成句：${sentence.cn}`,
            questionSub: '',
            hint: '把单词排成正确的句子（点击单词放置，点击已放单词可修改）',
            choices: shuffled,
            correctOrder: words,
            correctIndex: 0,
            correctAnswer: sentence.en,
            audioText: sentence.en,
            explain: `${sentence.en}\n${sentence.cn}`,
            isReview: false
        };
    }

    generateGrammarQuestion() {
        const grammar = this.unitData.grammar;
        if (!grammar || !grammar.quizOptions) {
            return this.generateVocabQuestion();
        }

        const entries = Object.entries(grammar.quizOptions);
        const entry = entries[Phaser.Math.Between(0, entries.length - 1)];
        const [question, options] = entry;

        // The correct answer should be among the options
        // For simplicity, assume first option is correct
        const correctIndex = 0;
        const shuffled = [...options].sort(() => Math.random() - 0.5);

        return {
            type: 'grammar',
            question: question,
            questionSub: '选择正确的答案填空',
            hint: `语法点：${grammar.title}`,
            choices: shuffled,
            correctIndex: shuffled.indexOf(options[0]),
            correctAnswer: options[0],
            audioText: question.replace('___', options[0]),
            explain: `正确：${question.replace('___', options[0])}`,
            isReview: false
        };
    }

    generatePhonicsQuestion() {
        const phonics = this.unitData.phonics;
        if (!phonics || !phonics.words || phonics.words.length === 0) {
            return this.generateVocabQuestion();
        }

        const correct = phonics.words[Phaser.Math.Between(0, phonics.words.length - 1)];
        if (!correct || !correct.en) return this.generateVocabQuestion();

        // Pick wrong words from vocabulary with different sound patterns
        const vocab = [...this.unitData.vocabulary]
            .filter(v => v.en !== correct.en)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Ensure minimum 2 choices
        const choices = [correct, ...vocab].sort(() => Math.random() - 0.5);
        const correctIndex = choices.indexOf(correct);

        if (correctIndex < 0 || choices.length < 2) {
            return this.generateVocabQuestion();
        }

        return {
            type: 'phonics',
            question: `哪个单词包含 ${(phonics.pattern || '').split(',')[0]}？`,
            questionSub: `语音规律：${phonics.pattern || ''}`,
            hint: '仔细看单词的发音',
            choices: choices.map(c => `${c.en} ${c.phonetic || ''}`),
            correctIndex: correctIndex,
            correctAnswer: `${correct.en} ${correct.phonetic || ''}`,
            audioText: correct.en,
            explain: `${correct.en} 包含 ${(phonics.pattern || '').split(',')[0]}`,
            isReview: false
        };
    }

    generateSpellingQuestion() {
        const vocab = [...this.unitData.vocabulary].filter(v => v.en.length >= 3);
        if (vocab.length === 0) return this.generateVocabQuestion();

        const correct = vocab[Phaser.Math.Between(0, vocab.length - 1)];
        const word = correct.en;
        const letters = word.split('');

        // Hide 30-50% of letters (at least 1, at most all but 2)
        const numToHide = Math.max(1, Math.min(Math.floor(word.length * 0.5), Math.floor(word.length * 0.3)));
        const numHide = Phaser.Math.Between(Math.max(1, Math.floor(word.length * 0.3)), Math.max(1, Math.floor(word.length * 0.5)));

        // Pick random positions to hide (prefer consonants, avoid first letter being hidden)
        const hideable = letters.map((l, i) => ({ letter: l, index: i }))
            .filter(item => item.index > 0); // keep first letter visible as hint
        const shuffled = hideable.sort(() => Math.random() - 0.5);
        const toHide = shuffled.slice(0, Math.min(numHide, hideable.length));
        const hideIndices = new Set(toHide.map(h => h.index));

        // Build letter blanks
        const blanks = letters.map((l, i) => ({
            letter: l,
            hidden: hideIndices.has(i),
            filled: hideIndices.has(i) ? '' : l
        }));

        // Collect hidden letters as the correct answer
        const hiddenLetters = toHide.map(h => h.letter);

        // Generate distractor letters from other vocab words
        const otherWords = [...this.unitData.vocabulary]
            .filter(v => v.en !== word)
            .sort(() => Math.random() - 0.5);
        const distractors = [];
        for (const ow of otherWords) {
            for (const ch of ow.en.toLowerCase()) {
                if (!hiddenLetters.includes(ch) && !distractors.includes(ch) && /[a-z]/.test(ch)) {
                    distractors.push(ch);
                    if (distractors.length >= hiddenLetters.length + 3) break;
                }
            }
            if (distractors.length >= hiddenLetters.length + 3) break;
        }

        // All letter choices = hidden letters + extra distractors (ensure all hidden letters are included)
        const allChoices = [...new Set([...hiddenLetters, ...distractors])];
        // Ensure at least 6 choices and ALL hidden letters are present
        let finalChoices = [...hiddenLetters];
        const extraChoices = allChoices.filter(c => !hiddenLetters.includes(c))
            .sort(() => Math.random() - 0.5);
        finalChoices.push(...extraChoices.slice(0, Math.max(0, 6 - hiddenLetters.length)));
        finalChoices = [...new Set(finalChoices)].sort(() => Math.random() - 0.5);

        // Build display text: "d _ c t _ r"
        const displayWord = blanks.map(b => b.hidden ? '_' : b.letter).join(' ');
        const correctBlanks = blanks.map(b => b.hidden ? b.letter : '').join('');

        return {
            type: 'spelling',
            question: `补全单词：${displayWord}`,
            questionSub: `${correct.cn}  /${correct.phonetic}/`,
            hint: '听发音，选择正确的字母补全单词',
            choices: finalChoices,
            correctIndex: -1, // special: multiple blanks, answer is the completed word
            correctAnswer: word,
            correctBlanks: hiddenLetters,
            blanks: blanks,
            displayWord: displayWord,
            audioText: word,
            explain: `${word} = ${correct.cn}`,
            isReview: false
        };
    }

    generateClozeQuestion() {
        const sentences = this.unitData.sentences;
        if (!sentences || sentences.length === 0) return this.generateVocabQuestion();
        const vocab = this.unitData.vocabulary;

        // Pick a sentence and find a content word that exists in unit vocab
        const sentence = sentences[Phaser.Math.Between(0, sentences.length - 1)];
        const words = sentence.en.split(/\s+/);
        const vocabWords = new Set(vocab.map(v => v.en.toLowerCase()));
        const contentWords = [];

        words.forEach((w, i) => {
            const clean = w.replace(/[.,!?;:'"]/g, '').toLowerCase();
            if (vocabWords.has(clean) && clean.length > 1) {
                contentWords.push({ word: w, clean: clean, index: i });
            }
        });

        if (contentWords.length === 0) {
            // Fallback: pick any non-trivial word not in stop-words
            const stopWords = ['a', 'an', 'the', 'is', 'are', 'am', 'was', 'were',
                'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'but',
                'it', 'this', 'that', 'he', 'she', 'they', 'we', 'you', 'I', 'my',
                'do', 'does', 'did', 'can', 'will', 'not', 'no', 'yes', 'has', 'have'];
            words.forEach((w, i) => {
                const clean = w.replace(/[.,!?;:'"]/g, '').toLowerCase();
                if (!stopWords.includes(clean) && clean.length > 1) {
                    contentWords.push({ word: w, clean: clean, index: i });
                }
            });
        }

        if (contentWords.length === 0) return this.generateVocabQuestion();

        const picked = contentWords[Phaser.Math.Between(0, contentWords.length - 1)];
        const blankWord = picked.clean;
        const cleanWord = picked.word.replace(/[.,!?;:'"]/g, '');

        // Find matching vocab entry
        const correctVocab = vocab.find(v => v.en.toLowerCase() === blankWord);

        // Build sentence with blank
        const sentenceWithBlank = words.map((w, i) =>
            i === picked.index ? '________' : w
        ).join(' ');

        // Generate wrong options from unit vocabulary
        const wrongs = vocab
            .filter(v => v.en.toLowerCase() !== blankWord)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const choices = [correctVocab || { en: cleanWord, cn: '' }, ...wrongs]
            .sort(() => Math.random() - 0.5);
        const correctIndex = choices.findIndex(c => c.en.toLowerCase() === blankWord);

        return {
            type: 'cloze',
            question: sentenceWithBlank,
            questionSub: `句子意思：${sentence.cn}`,
            hint: '选择正确的单词填入空白处',
            choices: choices.map(c => c.en),
            correctIndex: correctIndex,
            correctAnswer: cleanWord,
            audioText: sentence.en,
            explain: `完整句子：${sentence.en}\n${sentence.cn}`,
            isReview: false
        };
    }

    fallbackQuestion() {
        return {
            type: 'vocabulary',
            question: 'What is this?',
            questionSub: '',
            hint: '',
            choices: ['A', 'B', 'C'],
            correctIndex: 0,
            correctAnswer: 'A',
            audioText: 'A',
            explain: '',
            isReview: false
        };
    }

    checkAnswer(question, userIndex) {
        const correct = userIndex === question.correctIndex;
        if (!correct) {
            this.recordWrongAnswer(question);
        }
        return correct;
    }

    recordWrongAnswer(question) {
        const key = question.question;
        const existing = this.wrongAnswers.find(w => w.question === key);
        if (existing) {
            existing.count++;
            existing.lastWrong = Date.now();
            existing.nextReview = Date.now() + 86400000; // 1 day
        } else {
            this.wrongAnswers.push({
                question: key,
                data: { ...question, isReview: true },
                count: 1,
                lastWrong: Date.now(),
                nextReview: Date.now() + 86400000
            });
        }
        this.saveWrongAnswers();
    }

    getReviewQuestions(count) {
        const now = Date.now();
        const due = this.wrongAnswers.filter(w => w.nextReview <= now);
        return due.slice(0, count);
    }

    getStats() {
        return {
            totalWrong: this.wrongAnswers.length,
            reviewDue: this.getReviewQuestions(99).length
        };
    }

    loadWrongAnswers() {
        try {
            const raw = JSON.parse(localStorage.getItem('wrongAnswers_v2') || '[]');
            // Filter out corrupted entries
            return raw.filter(w => w.data && w.data.type && w.data.question && Array.isArray(w.data.choices));
        } catch {
            return [];
        }
    }

    saveWrongAnswers() {
        try {
            localStorage.setItem('wrongAnswers_v2', JSON.stringify(this.wrongAnswers));
        } catch { /* storage full */ }
    }

    resetWrongAnswers() {
        this.wrongAnswers = [];
        this.saveWrongAnswers();
    }
}
