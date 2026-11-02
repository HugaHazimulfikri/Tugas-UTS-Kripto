/**
 * Knight's Tour Cipher — App Controller
 * Menangani semua interaksi UI, animasi papan, dan trace langkah.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ===================== ELEMEN DOM =====================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const keyInput = $('#keyInput');
    const inputText = $('#inputText');
    const outputText = $('#outputText');
    const btnProcess = $('#btnProcess');
    const btnEncrypt = $('#btnEncrypt');
    const btnDecrypt = $('#btnDecrypt');
    const btnShowTour = $('#btnShowTour');
    const btnShowChars = $('#btnShowChars');
    const btnAnimate = $('#btnAnimate');
    const boardGrid = $('#boardGrid');
    const colLabels = $('#colLabels');
    const rowLabels = $('#rowLabels');
    const traceContainer = $('#traceContainer');
    const alphabetDisplay = $('#alphabetDisplay');
    const boardLegend = $('#boardLegend');
    const bgParticles = $('#bgParticles');

    // ===================== STATE =====================
    let currentMode = 'encrypt';
    let currentBoard = null;
    let currentLog = [];
    let boardCells = [];
    let showTourPath = false;
    let showCharsMode = true;
    let animationTimer = null;

    // ===================== INIT =====================
    init();

    function init() {
        createParticles();
        setupAlphabetDisplay();
        setupEventListeners();
        buildBoard();
        runSelfTest();
        setupIntersectionObserver();
    }

    // ===================== PARTIKEL LATAR =====================
    function createParticles() {
        const count = 30;
        const colors = [
            'rgba(99, 102, 241, 0.6)',
            'rgba(6, 182, 212, 0.5)',
            'rgba(245, 158, 11, 0.4)',
            'rgba(139, 92, 246, 0.5)'
        ];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (2 + Math.random() * 3) + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDuration = (8 + Math.random() * 15) + 's';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            bgParticles.appendChild(particle);
        }
    }

    // ===================== ALFABET =====================
    function setupAlphabetDisplay() {
        const chars = KnightCipher.ALPHABET.split('').map((ch, i) => {
            const display = ch === ' ' ? '␣' : ch === '.' ? '.' : ch;
            return `<span title="Index ${i}: '${display}'">${display}</span>`;
        }).join('');
        alphabetDisplay.innerHTML = chars;
    }

    // ===================== EVENT LISTENERS =====================
    function setupEventListeners() {
        // Mode toggle
        btnEncrypt.addEventListener('click', () => setMode('encrypt'));
        btnDecrypt.addEventListener('click', () => setMode('decrypt'));

        // Process button
        btnProcess.addEventListener('click', handleProcess);

        // Key change → rebuild board
        let keyDebounce;
        keyInput.addEventListener('input', () => {
            clearTimeout(keyDebounce);
            keyDebounce = setTimeout(() => {
                buildBoard();
            }, 300);
        });

        // Board view toggles
        btnShowTour.addEventListener('click', () => {
            showTourPath = !showTourPath;
            btnShowTour.style.borderColor = showTourPath ? 'var(--accent-tertiary)' : '';
            btnShowTour.style.color = showTourPath ? 'var(--accent-tertiary)' : '';
            renderBoard();
        });

        btnShowChars.addEventListener('click', () => {
            showCharsMode = !showCharsMode;
            btnShowChars.style.borderColor = showCharsMode ? 'var(--accent-primary)' : '';
            btnShowChars.style.color = showCharsMode ? 'var(--accent-primary)' : '';
            renderBoard();
        });

        // Animate button
        btnAnimate.addEventListener('click', animateTrace);

        // Ripple effect on process button
        btnProcess.addEventListener('mousedown', (e) => {
            const ripple = btnProcess.querySelector('.btn-ripple');
            const rect = btnProcess.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            ripple.style.animation = 'none';
            ripple.offsetHeight; // force reflow
            ripple.style.animation = 'ripple 0.6s ease-out';
        });

        // Keyboard shortcut: Enter to process
        inputText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleProcess();
            }
        });
    }

    // ===================== MODE TOGGLE =====================
    function setMode(mode) {
        currentMode = mode;
        btnEncrypt.classList.toggle('active', mode === 'encrypt');
        btnDecrypt.classList.toggle('active', mode === 'decrypt');
    }

    // ===================== PROSES CIPHER =====================
    function handleProcess() {
        const key = keyInput.value.trim();
        const text = inputText.value;

        if (!key) {
            shakeElement(keyInput);
            keyInput.focus();
            return;
        }
        if (!text) {
            shakeElement(inputText);
            inputText.focus();
            return;
        }

        try {
            const isEncrypt = currentMode === 'encrypt';
            const { result, log, board } = isEncrypt
                ? KnightCipher.encrypt(text, key)
                : KnightCipher.decrypt(text, key);

            currentBoard = board;
            currentLog = log;

            // Animate output
            animateOutput(result);

            // Render trace
            renderTrace(log);

            // Enable animate button
            btnAnimate.disabled = false;

            // Show legend
            boardLegend.classList.add('visible');

            // Pulse process button
            btnProcess.style.boxShadow = '0 0 30px var(--accent-primary-glow)';
            setTimeout(() => {
                btnProcess.style.boxShadow = '';
            }, 500);

        } catch (err) {
            outputText.value = `❌ Error: ${err.message}`;
            outputText.style.borderColor = 'var(--accent-danger)';
            setTimeout(() => {
                outputText.style.borderColor = '';
            }, 2000);
        }
    }

    // ===================== ANIMASI OUTPUT =====================
    function animateOutput(result) {
        outputText.value = '';
        outputText.style.borderColor = 'var(--accent-success)';
        let i = 0;
        const speed = Math.max(15, 300 / result.length);

        function type() {
            if (i < result.length) {
                outputText.value += result[i];
                i++;
                setTimeout(type, speed);
            } else {
                setTimeout(() => {
                    outputText.style.borderColor = '';
                }, 1000);
            }
        }
        type();
    }

    // ===================== BANGUN PAPAN =====================
    function buildBoard() {
        const key = keyInput.value.trim();
        if (!key) return;

        try {
            currentBoard = new KnightCipher.Board(key);
            renderBoard();
        } catch (err) {
            console.warn('Board build error:', err.message);
        }
    }

    function renderBoard() {
        if (!currentBoard) return;

        const data = currentBoard.getData();

        // Column labels
        colLabels.innerHTML = '<span></span>';
        for (let c = 0; c < 8; c++) {
            colLabels.innerHTML += `<span>${c}</span>`;
        }

        // Row labels
        rowLabels.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            rowLabels.innerHTML += `<span>${r}</span>`;
        }

        // Grid cells
        boardGrid.innerHTML = '';
        boardCells = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const idx = r * 8 + c;
                const cell = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                cell.className = `board-cell ${isLight ? 'cell-light' : 'cell-dark'}`;
                cell.dataset.index = idx;
                cell.dataset.row = r;
                cell.dataset.col = c;

                const charSpan = document.createElement('span');
                charSpan.className = 'cell-char';
                const ch = data.cell[idx];
                charSpan.textContent = showCharsMode
                    ? (ch === ' ' ? '␣' : ch)
                    : '';

                const orderSpan = document.createElement('span');
                orderSpan.className = 'cell-order';
                orderSpan.textContent = showCharsMode ? '' : data.order[idx];

                cell.appendChild(charSpan);
                cell.appendChild(orderSpan);

                // Highlight tour path
                if (showTourPath) {
                    cell.classList.add('highlight-tour');
                    orderSpan.textContent = data.order[idx];
                }

                // Hover tooltip
                cell.title = `[${r},${c}] = '${ch === ' ' ? 'spasi' : ch}' (tour #${data.order[idx]})`;

                // Click to highlight
                cell.addEventListener('click', () => {
                    clearHighlights();
                    cell.classList.add('highlight-source');
                });

                boardGrid.appendChild(cell);
                boardCells.push(cell);
            }
        }

        // Animate cells appearing
        boardCells.forEach((cell, i) => {
            cell.style.opacity = '0';
            cell.style.transform = 'scale(0.8)';
            setTimeout(() => {
                cell.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                cell.style.opacity = '1';
                cell.style.transform = 'scale(1)';
            }, i * 8);
        });
    }

    // ===================== HIGHLIGHT PAPAN =====================
    function clearHighlights() {
        boardCells.forEach(cell => {
            cell.classList.remove('highlight-source', 'highlight-dest', 'highlight-path');
        });
    }

    function highlightStep(step) {
        clearHighlights();
        if (!step) return;

        const srcCell = boardCells[step.sourcePos];
        const dstCell = boardCells[step.destPos];

        if (srcCell) {
            srcCell.classList.add('highlight-source');
        }
        if (dstCell) {
            dstCell.classList.add('highlight-dest');
        }
    }

    // ===================== RENDER TRACE =====================
    function renderTrace(log) {
        if (!log || log.length === 0) {
            traceContainer.innerHTML = '<p class="trace-placeholder">Tidak ada data trace.</p>';
            return;
        }

        const moveNames = ['↖ (-2,-1)', '↗ (-2,+1)', '➚ (-1,+2)', '↘ (+1,+2)',
            '↘ (+2,+1)', '↙ (+2,-1)', '➘ (+1,-2)', '↖ (-1,-2)'];

        let html = `
            <table class="trace-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Input</th>
                        <th>Posisi</th>
                        <th>Arah</th>
                        <th></th>
                        <th>Tujuan</th>
                        <th>Output</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const entry of log) {
            const inChar = entry.inputChar === ' ' ? '␣' : entry.inputChar;
            const outChar = entry.outputChar === ' ' ? '␣' : entry.outputChar;
            html += `
                <tr data-step="${entry.step}" data-src="${entry.sourcePos}" data-dst="${entry.destPos}">
                    <td>${entry.step}</td>
                    <td><span class="trace-char">${inChar}</span></td>
                    <td>[${entry.sourceRow},${entry.sourceCol}]</td>
                    <td>${moveNames[entry.direction] || entry.direction}</td>
                    <td class="trace-arrow">→</td>
                    <td>[${entry.destRow},${entry.destCol}]</td>
                    <td><span class="trace-char out">${outChar}</span></td>
                </tr>
            `;
        }

        html += '</tbody></table>';
        traceContainer.innerHTML = html;

        // Add hover/click interaction to trace rows
        const rows = traceContainer.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                const step = currentLog[parseInt(row.dataset.step) - 1];
                if (step) highlightStep(step);
                row.classList.add('active');
            });
            row.addEventListener('mouseleave', () => {
                row.classList.remove('active');
            });
            row.addEventListener('click', () => {
                const step = currentLog[parseInt(row.dataset.step) - 1];
                if (step) highlightStep(step);
                // Remove active from all, add to clicked
                rows.forEach(r => r.classList.remove('active'));
                row.classList.add('active');
            });
        });
    }

    // ===================== ANIMASI TRACE =====================
    function animateTrace() {
        if (currentLog.length === 0) return;

        // Stop previous animation
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
            btnAnimate.textContent = '▶ Animasi';
            clearHighlights();
            return;
        }

        btnAnimate.textContent = '⏹ Stop';
        const rows = traceContainer.querySelectorAll('tbody tr');
        let i = 0;
        const speed = Math.max(200, 2000 / currentLog.length);

        function step() {
            if (i >= currentLog.length) {
                btnAnimate.textContent = '▶ Animasi';
                animationTimer = null;
                return;
            }

            // Highlight current step on board
            highlightStep(currentLog[i]);

            // Highlight current row in trace
            rows.forEach(r => r.classList.remove('active'));
            if (rows[i]) {
                rows[i].classList.add('active');
                // Scroll hanya di dalam trace container, bukan halaman
                const rowTop = rows[i].offsetTop - traceContainer.offsetTop;
                traceContainer.scrollTo({ top: rowTop - 80, behavior: 'smooth' });
            }

            i++;
            animationTimer = setTimeout(step, speed);
        }
        step();
    }

    // ===================== UTILITAS =====================
    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight; // force reflow
        el.style.animation = 'shake 0.5s ease';
        el.style.borderColor = 'var(--accent-danger)';
        setTimeout(() => {
            el.style.animation = '';
            el.style.borderColor = '';
        }, 1000);
    }

    // Add shake keyframes dynamically
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 50%, 90% { transform: translateX(-4px); }
            30%, 70% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ===================== SELF TEST =====================
    function runSelfTest() {
        try {
            const passed = KnightCipher.selfTest();
            if (passed) {
                console.log('🏇 Knight\'s Tour Cipher siap digunakan!');
            }
        } catch (err) {
            console.error('Self-test error:', err);
        }
    }

    // ===================== INTERSECTION OBSERVER =====================
    function setupIntersectionObserver() {
        const sections = $$('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            observer.observe(section);
        });
    }

    // ===================== SCROLL INDICATOR =====================
    const scrollIndicator = $('#scrollIndicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '';
            }
        }, { passive: true });
    }
});
