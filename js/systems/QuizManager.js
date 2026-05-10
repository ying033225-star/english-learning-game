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
