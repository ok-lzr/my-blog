// 配置常量
const CONFIG = {
    MAX_TRANSCRIPT_LINES: 50,
    DURATION_UPDATE_INTERVAL: 100, // ms
    NORMAL_SPEED_MIN: 100,
    NORMAL_SPEED_MAX: 160,
    SPEED_WARNING_MIN: 80,
    SPEED_WARNING_MAX: 180,
    FILLER_PATTERN: /(嗯|呃|就是|然后|啊|那个|这个|那个那个|就是说|这样的话)/g,
    FILLER_COLORS: {
        '嗯': '#4b7bec',
        '呃': '#f59e0b',
        '就是': '#10b981',
        '然后': '#ef4444',
        '啊': '#8e9db1',
        '那个': '#9b59b6',
        '这个': '#e67e22',
        '那个那个': '#1abc9c',
        '就是说': '#e84342',
        '这样的话': '#3498db'
    }
};

// 初始状态
const INITIAL_STATS = {
    wordCount: 0,
    fillerCount: 0,
    startTime: null,
    pauseTime: null,
    totalPausedDuration: 0,
    speedHistory: [],
    totalSpeedSamples: 0,
    averageSpeed: 0,
    fillerBreakdown: {
        '嗯': 0, '呃': 0, '就是': 0, '然后': 0, '啊': 0,
        '那个': 0, '这个': 0, '那个那个': 0, '就是说': 0, '这样的话': 0
    }
};

class SpeechCoach {
    constructor() {
        this.state = {
            isListening: false,
            isPaused: false,
            finalTranscript: '',
            interimTranscript: '',
            transcriptLines: [],
            stats: { ...INITIAL_STATS },
            isDarkMode: false
        };

        // 缓存 DOM 元素
        this.dom = {};
        
        // 图表实例
        this.charts = {
            speed: null,
            filler: null
        };

        // 动画帧 ID
        this.animationFrameId = null;
        
        // 语音识别实例
        this.recognition = null;
        
        // 绑定方法
        this.updateDurationDisplay = this.updateDurationDisplay.bind(this);
        
        this.init();
    }

    // 初始化
    init() {
        this.cacheDOMElements();
        this.initSpeechRecognition();
        this.initCharts();
        this.bindEvents();
        this.initTheme();
        this.updateAllDisplays();
    }

    // 缓存 DOM 元素（一次性查询）
    cacheDOMElements() {
        const ids = [
            'start-btn', 'pause-btn', 'theme-btn', 'transcript-box',
            'placeholder-text', 'speed-value', 'avg-speed-value',
            'filler-count', 'filler-breakdown', 'duration-value',
            'status-dot', 'status-text', 'interim-indicator', 'suggestions'
        ];
        
        ids.forEach(id => {
            this.dom[id] = document.getElementById(id);
        });
        
        this.dom.speedProgress = document.querySelector('#speed-progress .progress-fill');
    }

    // 初始化主题
    initTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.state.isDarkMode = prefersDark;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
        }
    }

    // 切换主题
    toggleTheme = () => {
        this.state.isDarkMode = !this.state.isDarkMode;
        document.body.classList.toggle('dark-mode', this.state.isDarkMode);
        this.updateCharts();
    }

    // 初始化语音识别
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showError('您的浏览器不支持语音识别，请使用 Chrome 或 Edge');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'zh-CN';
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = this.handleRecognitionResult.bind(this);
        this.recognition.onerror = this.handleRecognitionError.bind(this);
        this.recognition.onend = this.handleRecognitionEnd.bind(this);
    }

    // 处理识别结果
    handleRecognitionResult(event) {
        let interim = '';
        let final = '';

        // 使用 for 循环而不是 forEach，性能更好
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final += transcript;
                this.addTranscriptLine(transcript, true);
            } else {
                interim += transcript;
            }
        }

        if (final) {
            this.state.finalTranscript += final;
            this.updateStats(final);
            this.updateSpeedDisplay();
        }
        
        this.state.interimTranscript = interim;
        this.updateTranscriptDisplay();
    }

    // 处理识别错误
    handleRecognitionError(event) {
        if (event.error === 'no-speech') return;
        
        this.updateStatus('error', `错误: ${event.error}`);
        if (event.error === 'not-allowed') {
            this.showSuggestion('请允许麦克风权限以使用语音识别');
        }
    }

    // 处理识别结束
    handleRecognitionEnd() {
        if (this.state.isListening && !this.state.isPaused) {
            // 自动重启
            try {
                this.recognition.start();
            } catch (error) {
                setTimeout(() => {
                    if (this.state.isListening && !this.state.isPaused) {
                        try {
                            this.recognition.start();
                        } catch (e) {}
                    }
                }, 1000);
            }
        } else {
            this.updateStatus('idle', '已停止');
        }
    }

    // 初始化图表
    initCharts() {
        this.initSpeedChart();
        this.initFillerChart();
    }

    initSpeedChart() {
        const chartDom = document.getElementById('speed-chart');
        if (!chartDom) return;

        this.charts.speed = echarts.init(chartDom);
        this.charts.speed.setOption({
            grid: { top: 20, left: 35, right: 15, bottom: 20 },
            tooltip: { trigger: 'axis', formatter: '第 {b} 秒<br/>语速: {c} 字/分钟' },
            xAxis: {
                type: 'category',
                data: [],
                axisLabel: { fontSize: 10, color: this.getChartTextColor() }
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 200,
                splitLine: { lineStyle: { color: this.getChartLineColor(), type: 'dashed' } },
                axisLabel: { fontSize: 10, color: this.getChartTextColor() }
            },
            series: [{
                data: [],
                type: 'line',
                smooth: true,
                lineStyle: { color: '#4b7bec', width: 2 },
                areaStyle: { color: 'rgba(75, 123, 236, 0.05)' },
                symbol: 'circle',
                symbolSize: 6,
                markPoint: {
                    data: [
                        { type: 'max', name: '峰值' },
                        { type: 'min', name: '谷值' }
                    ]
                }
            }]
        });
    }

    initFillerChart() {
        const chartDom = document.getElementById('filler-chart');
        if (!chartDom) return;

        this.charts.filler = echarts.init(chartDom);
        this.charts.filler.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
            legend: { show: false },
            series: [{
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                label: { show: false },
                emphasis: { scale: true },
                data: Object.entries(CONFIG.FILLER_COLORS).map(([name, color]) => ({
                    value: 0, name, itemStyle: { color }
                }))
            }]
        });
    }

    getChartTextColor() {
        return this.state.isDarkMode ? '#a0a0a0' : '#8e9db1';
    }

    getChartLineColor() {
        return this.state.isDarkMode ? '#333333' : '#edf0f5';
    }

    // 绑定事件
    bindEvents() {
        this.dom['start-btn'].addEventListener('click', this.toggleStart.bind(this));
        this.dom['pause-btn'].addEventListener('click', this.togglePause.bind(this));
        this.dom['theme-btn'].addEventListener('click', this.toggleTheme);
    }

    // 切换开始/停止
    toggleStart() {
        if (this.state.isListening) {
            this.stop();
        } else {
            this.clear();
            this.start();
        }
    }

    // 开始练习
    start() {
        if (!this.recognition) return;

        try {
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (error) {
                    this.showSuggestion('启动失败，请重试', 'warning');
                    return;
                }
                
                this.state.isListening = true;
                this.state.isPaused = false;
                this.state.stats.startTime = this.state.stats.startTime || Date.now();
                
                this.startDurationAnimation();
                this.updateStatus('active', '聆听中...');
                this.updateButtons();
                this.updateInterimIndicator('正在聆听...');
                
                this.updateButtonHTML('start-btn', 'stop');
                this.showSuggestion('✅ 开始练习，请自然表达', 'success');
            }, 100);
        } catch (error) {
            console.error('启动失败:', error);
        }
    }

    // 停止练习
    stop() {
        try {
            this.recognition?.stop();
        } catch (error) {}

        this.stopDurationAnimation();
        this.state.isListening = false;
        this.state.isPaused = false;
        
        this.updateButtons();
        this.updateStatus('idle', '已停止');
        this.updateInterimIndicator('已停止');
        this.updateButtonHTML('start-btn', 'start');
        this.updateDurationDisplay();
    }

    // 暂停/继续
    togglePause() {
        if (!this.state.isListening) return;

        if (this.state.isPaused) {
            // 继续
            try {
                this.recognition.start();
                this.state.isPaused = false;
                this.updateStatus('active', '聆听中...');
                
                if (this.state.stats.pauseTime) {
                    this.state.stats.totalPausedDuration += Date.now() - this.state.stats.pauseTime;
                    this.state.stats.pauseTime = null;
                }
                
                this.showSuggestion('▶️ 继续练习', 'neutral');
            } catch (error) {
                this.showSuggestion('恢复失败，请重试', 'warning');
            }
        } else {
            // 暂停
            try {
                this.recognition.stop();
                this.state.isPaused = true;
                this.state.stats.pauseTime = Date.now();
                this.updateStatus('paused', '已暂停');
                this.state.interimTranscript = '';
                this.updateTranscriptDisplay();
                this.updateDurationDisplay();
                this.showSuggestion('⏸️ 已暂停，点击继续', 'neutral');
            } catch (error) {}
        }
        
        this.updateButtons();
        this.updateInterimIndicator(this.state.isPaused ? '已暂停' : '正在聆听...');
    }

    // 清空数据
    clear() {
        this.state.finalTranscript = '';
        this.state.interimTranscript = '';
        this.state.transcriptLines = [];
        this.state.stats = JSON.parse(JSON.stringify(INITIAL_STATS));
        
        this.updateTranscriptDisplay(true);
        this.updateAllDisplays();
        this.showSuggestion('👋 开始新的练习', 'neutral');
        this.dom['duration-value'].textContent = '00:00';
    }

    // 添加转录行
    addTranscriptLine(text, isFinal) {
        this.state.transcriptLines.push({ text, timestamp: Date.now(), isFinal });
        
        if (this.state.transcriptLines.length > CONFIG.MAX_TRANSCRIPT_LINES) {
            this.state.transcriptLines.shift();
        }
    }

    // 更新转录显示
    updateTranscriptDisplay(showPlaceholder = false) {
        if (showPlaceholder) {
            this.dom['transcript-box'].innerHTML = '<div class="placeholder">点击开始练习，我会实时分析你的演讲</div>';
            return;
        }

        const finalLines = this.state.transcriptLines
            .filter(l => l.isFinal)
            .slice(-10)
            .map(l => `<div class="transcript-line final">${l.text}</div>`)
            .join('');

        const interimHtml = this.state.interimTranscript 
            ? `<div class="transcript-line interim">${this.state.interimTranscript}</div>` 
            : '';

        const html = finalLines + interimHtml || '<div class="placeholder">等待语音输入...</div>';
        
        this.dom['transcript-box'].innerHTML = html;
        this.dom['transcript-box'].scrollTop = this.dom['transcript-box'].scrollHeight;
    }

    // 更新统计
    updateStats(text) {
        const words = text.replace(/[，。、；：""''\s]/g, '').length;
        this.state.stats.wordCount += words;
        
        const fillers = text.match(CONFIG.FILLER_PATTERN) || [];
        this.state.stats.fillerCount += fillers.length;
        
        fillers.forEach(filler => {
            if (this.state.stats.fillerBreakdown[filler] !== undefined) {
                this.state.stats.fillerBreakdown[filler]++;
            }
        });
        
        const currentSpeed = this.calculateSpeed();
        const elapsedSeconds = Math.floor((Date.now() - this.state.stats.startTime - this.state.stats.totalPausedDuration) / 1000);
        
        this.state.stats.speedHistory.push({
            speed: currentSpeed,
            elapsedSeconds
        });
        
        if (this.state.stats.speedHistory.length > 30) {
            this.state.stats.speedHistory.shift();
        }
        
        // 更新平均语速（使用累积平均，避免大数计算）
        this.state.stats.totalSpeedSamples++;
        this.state.stats.averageSpeed += (currentSpeed - this.state.stats.averageSpeed) / this.state.stats.totalSpeedSamples;
        
        this.updateMetricDisplays();
        this.updateCharts();
        this.generateSuggestions(currentSpeed);
    }

    // 计算语速
    calculateSpeed() {
        if (!this.state.stats.startTime) return 0;
        
        const elapsedMinutes = (Date.now() - this.state.stats.startTime - this.state.stats.totalPausedDuration) / 60000;
        return elapsedMinutes < 0.1 ? 0 : Math.round(this.state.stats.wordCount / elapsedMinutes);
    }

    // 更新语速显示
    updateSpeedDisplay() {
        const speed = this.calculateSpeed();
        this.dom['speed-value'].textContent = speed;
        
        const percent = Math.min(100, (speed / CONFIG.SPEED_WARNING_MAX) * 100);
        this.dom.speedProgress.style.width = `${percent}%`;
    }

    // 更新所有显示
    updateAllDisplays() {
        this.updateMetricDisplays();
        this.updateCharts();
    }

    // 更新指标显示
    updateMetricDisplays() {
        this.updateSpeedDisplay();
        
        this.dom['filler-count'].textContent = this.state.stats.fillerCount;
        this.dom['avg-speed-value'].textContent = Math.round(this.state.stats.averageSpeed) || 0;
        
        const sortedFillers = Object.entries(this.state.stats.fillerBreakdown)
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (sortedFillers.length) {
            this.dom['filler-breakdown'].innerHTML = sortedFillers
                .map(([name, value]) => `<span>${name} ${value}</span>`)
                .join(' · ');
        } else {
            this.dom['filler-breakdown'].innerHTML = '<span>暂无语气词</span>';
        }
    }

    // 更新图表
    updateCharts() {
        // 使用 requestAnimationFrame 优化图表更新
        requestAnimationFrame(() => {
            if (this.charts.speed && this.state.stats.speedHistory.length) {
                this.charts.speed.setOption({
                    xAxis: { 
                        axisLabel: { color: this.getChartTextColor() },
                        data: this.state.stats.speedHistory.map(d => d.elapsedSeconds || 0)
                    },
                    yAxis: {
                        splitLine: { lineStyle: { color: this.getChartLineColor() } },
                        axisLabel: { color: this.getChartTextColor() }
                    },
                    series: [{ data: this.state.stats.speedHistory.map(d => d.speed) }]
                });
            }
            
            if (this.charts.filler) {
                const data = Object.entries(this.state.stats.fillerBreakdown)
                    .filter(([_, v]) => v > 0)
                    .map(([name, value]) => ({ name, value }));
                
                this.charts.filler.setOption({
                    series: [{
                        data: data.length ? data : [{ 
                            name: '无语气词', 
                            value: 1, 
                            itemStyle: { color: this.getChartLineColor() } 
                        }]
                    }]
                });
            }
        });
    }

    // 开始时长动画（使用 requestAnimationFrame 替代 setInterval）
    startDurationAnimation() {
        let lastUpdate = 0;
        
        const animate = (timestamp) => {
            if (!this.state.isListening || this.state.isPaused) return;
            
            if (timestamp - lastUpdate >= CONFIG.DURATION_UPDATE_INTERVAL) {
                this.updateDurationDisplay();
                lastUpdate = timestamp;
            }
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }

    // 停止时长动画
    stopDurationAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // 更新时长显示
    updateDurationDisplay() {
        if (!this.state.stats.startTime || !this.state.isListening || this.state.isPaused) return;
        
        const elapsedSeconds = Math.floor((Date.now() - this.state.stats.startTime - this.state.stats.totalPausedDuration) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        this.dom['duration-value'].textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 生成建议
    generateSuggestions(speed) {
        const suggestions = [];
        const { fillerCount, wordCount, averageSpeed, startTime } = this.state.stats;
        
        // 语速建议
        if (speed === 0) {
            suggestions.push({ type: 'neutral', text: '🎤 开始说话，我会分析你的演讲表现' });
        } else if (speed < CONFIG.SPEED_WARNING_MIN) {
            suggestions.push({ type: 'warning', text: `🐢 语速偏慢（<${CONFIG.SPEED_WARNING_MIN}字/分），听众容易走神，可以适当加快` });
        } else if (speed > CONFIG.SPEED_WARNING_MAX) {
            suggestions.push({ type: 'warning', text: `🐇 语速偏快（>${CONFIG.SPEED_WARNING_MAX}字/分），听众可能跟不上，建议放慢` });
        } else if (speed >= CONFIG.NORMAL_SPEED_MIN && speed <= CONFIG.NORMAL_SPEED_MAX) {
            suggestions.push({ type: 'success', text: `✅ 当前语速适中（${speed}字/分），适合大多数演讲场景` });
        }
        
        // 平均语速建议
        if (averageSpeed > 0) {
            const avg = Math.round(averageSpeed);
            if (avg >= CONFIG.NORMAL_SPEED_MIN && avg <= CONFIG.NORMAL_SPEED_MAX) {
                suggestions.push({ type: 'success', text: `📊 平均语速 ${avg}字/分，整体节奏把控很好` });
            }
        }
        
        // 语气词建议
        if (fillerCount > 0) {
            const rate = (fillerCount / (wordCount || 1)) * 100;
            if (rate > 15) {
                suggestions.push({ type: 'warning', text: `⚠️ 语气词偏多（${fillerCount}次，占${rate.toFixed(1)}%），尝试用停顿代替` });
            } else if (rate > 5) {
                suggestions.push({ type: 'neutral', text: `📊 语气词出现${fillerCount}次，占比${rate.toFixed(1)}%，还有改进空间` });
            } else {
                suggestions.push({ type: 'success', text: `👍 语气词控制良好（${fillerCount}次，仅占${rate.toFixed(1)}%）` });
            }
        }
        
        // 时长建议
        if (startTime && this.state.isListening && !this.state.isPaused) {
            const elapsedSeconds = (Date.now() - startTime - this.state.stats.totalPausedDuration) / 1000;
            if (elapsedSeconds > 60 && elapsedSeconds < 120) {
                suggestions.push({ type: 'neutral', text: '⏱️ 练习已超过1分钟，继续保持' });
            } else if (elapsedSeconds >= 120) {
                suggestions.push({ type: 'success', text: '🎉 专注练习超过2分钟，很棒！' });
            }
        }
        
        this.renderSuggestions(suggestions.slice(0, 3));
    }

    // 渲染建议
    renderSuggestions(suggestions) {
        if (!suggestions.length) {
            this.dom['suggestions'].innerHTML = '<div class="suggestion-item neutral">👋 开始练习，我会给你实时反馈</div>';
            return;
        }
        
        const html = suggestions.map(s => 
            `<div class="suggestion-item ${s.type}">${s.text}</div>`
        ).join('');
        
        this.dom['suggestions'].innerHTML = html;
    }

    // 显示单条建议
    showSuggestion(text, type = 'neutral') {
        this.dom['suggestions'].innerHTML = `<div class="suggestion-item ${type}">${text}</div>`;
    }

    // 更新状态
    updateStatus(status, text) {
        this.dom['status-text'].textContent = text;
        this.dom['status-dot'].className = `status-dot ${status !== 'idle' ? status : ''}`;
    }

    // 更新指示器
    updateInterimIndicator(text) {
        this.dom['interim-indicator'].textContent = text;
    }

    // 更新按钮状态
    updateButtons() {
        this.dom['pause-btn'].disabled = !this.state.isListening;
    }

    // 更新按钮 HTML
    updateButtonHTML(btnId, type) {
        const btn = this.dom[btnId];
        if (type === 'start') {
            btn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                    <circle cx="12" cy="12" r="6" fill="currentColor"/>
                </svg>
                开始练习
            `;
        } else if (type === 'stop') {
            btn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
                    <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
                </svg>
                停止练习
            `;
        } else if (type === 'pause') {
            this.dom['pause-btn'].innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                </svg>
                继续
            `;
        } else if (type === 'resume') {
            this.dom['pause-btn'].innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
                    <rect x="7" y="6" width="3" height="12" fill="currentColor"/>
                    <rect x="14" y="6" width="3" height="12" fill="currentColor"/>
                </svg>
                暂停
            `;
        }
    }

    // 显示错误
    showError(message) {
        this.dom['transcript-box'].innerHTML = `<div class="error-message">❌ ${message}</div>`;
        this.dom['start-btn'].disabled = true;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SpeechCoach();
});