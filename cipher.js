/**
 * Knight's Tour Cipher — JavaScript Implementation
 * Port dari knights_tour_cipher.py
 * 
 * Cipher klasik berbasis langkah kuda catur (8×8).
 * Hanya untuk pembelajaran, bukan pengaman data sungguhan.
 */

const KnightCipher = (() => {
    'use strict';

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .";
    const MOVES = [
        [-2, -1], [-2, 1], [-1, 2], [1, 2],
        [2, 1], [2, -1], [1, -2], [-1, -2]
    ];
    const MASK = 0xFFFFFFFF;

    /**
     * FNV-1a 32-bit hash dari string kunci.
     * @param {string} key
     * @returns {number}
     */
    function seedFromKey(key) {
        let h = 2166136261;
        for (const ch of key) {
            h ^= ch.charCodeAt(0);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }

    /**
     * Bangun knight's tour 8×8 berdasarkan kunci.
     * Mengembalikan { path: number[], d0: number }
     * path[i] = posisi ke-i pada tour (0..63)
     * d0 = arah awal (0..7)
     * 
     * @param {string} key
     * @returns {{ path: number[], d0: number }}
     */
    function buildTour(key) {
        let state = seedFromKey(key || " ");

        function rnd() {
            // Linear Congruential Generator
            state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
            return state;
        }

        // Shuffle move order berdasarkan key
        const order = [0, 1, 2, 3, 4, 5, 6, 7];
        for (let i = 7; i > 0; i--) {
            const j = rnd() % (i + 1);
            [order[i], order[j]] = [order[j], order[i]];
        }
        const start = rnd() % 64;

        const visited = new Array(64).fill(false);
        const path = [];

        function neighbours(p) {
            const r = Math.floor(p / 8);
            const c = p % 8;
            const result = [];
            for (const m of order) {
                const a = r + MOVES[m][0];
                const b = c + MOVES[m][1];
                if (a >= 0 && a < 8 && b >= 0 && b < 8 && !visited[a * 8 + b]) {
                    result.push(a * 8 + b);
                }
            }
            return result;
        }

        function degree(q) {
            visited[q] = true;
            const n = neighbours(q).length;
            visited[q] = false;
            return n;
        }

        let calls = 0;

        function dfs(p) {
            visited[p] = true;
            path.push(p);
            if (path.length === 64) return true;

            calls++;
            if (calls > 200000) {
                visited[p] = false;
                path.pop();
                return false;
            }

            // Warnsdorff: sort candidates by degree ascending
            const cands = neighbours(p)
                .map((q, i) => ({ deg: degree(q), idx: i, pos: q }))
                .sort((a, b) => a.deg - b.deg || a.idx - b.idx);

            for (const { pos: q } of cands) {
                if (dfs(q)) return true;
            }

            visited[p] = false;
            path.pop();
            return false;
        }

        if (!dfs(start)) {
            throw new Error("Tour tidak ditemukan untuk kunci ini, coba kunci lain.");
        }

        let d0 = 0;
        for (const ch of key) {
            d0 += ch.charCodeAt(0);
        }
        d0 = d0 % 8;

        return { path, d0 };
    }

    /**
     * Representasi papan 8×8 dengan pemetaan karakter.
     */
    class Board {
        /**
         * @param {string} key - Kunci cipher (tidak boleh kosong)
         */
        constructor(key) {
            if (!key) throw new Error("Kunci tidak boleh kosong.");

            const { path, d0 } = buildTour(key);
            this.path = path;
            this.d0 = d0;
            this.cell = new Array(64).fill("");    // kotak → karakter
            this.pos = {};                          // karakter → kotak
            this.index = {};                        // karakter → indeks pada tour

            for (let i = 0; i < path.length; i++) {
                const p = path[i];
                this.cell[p] = ALPHABET[i];
                this.pos[ALPHABET[i]] = p;
                this.index[ALPHABET[i]] = i;
            }
        }

        /**
         * Kembalikan data papan untuk rendering.
         * @returns {{ cell: string[], path: number[], order: number[] }}
         */
        getData() {
            const order = new Array(64).fill(0);
            for (let i = 0; i < this.path.length; i++) {
                order[this.path[i]] = i;
            }
            return {
                cell: [...this.cell],
                path: [...this.path],
                order
            };
        }
    }

    /**
     * Proses enkripsi atau dekripsi.
     * @param {string} text - Teks input
     * @param {string} key - Kunci
     * @param {boolean} encrypt - true = enkripsi, false = dekripsi
     * @returns {{ result: string, log: Array }}
     */
    function process(text, key, encrypt) {
        const board = new Board(key);
        let d = board.d0;
        let j = 0;
        const out = [];
        const log = [];
        const sign = encrypt ? 1 : -1;

        for (const ch of text) {
            if (!(ch in board.pos)) continue;

            const p = board.pos[ch];
            const r = Math.floor(p / 8);
            const c = p % 8;

            // Hitung posisi tujuan dengan wrapping modular
            const newR = ((r + sign * MOVES[d][0]) % 8 + 8) % 8;
            const newC = ((c + sign * MOVES[d][1]) % 8 + 8) % 8;
            const q = newR * 8 + newC;
            const o = board.cell[q];

            log.push({
                inputChar: ch,
                sourcePos: p,
                sourceRow: r,
                sourceCol: c,
                direction: d,
                move: MOVES[d],
                destPos: q,
                destRow: newR,
                destCol: newC,
                outputChar: o,
                step: j + 1
            });

            out.push(o);
            j++;
            d = (board.index[encrypt ? o : ch] + j) % 8;
        }

        return {
            result: out.join(""),
            log,
            board
        };
    }

    /**
     * Enkripsi teks.
     * @param {string} text
     * @param {string} key
     * @returns {{ result: string, log: Array, board: Board }}
     */
    function encrypt(text, key) {
        return process(text, key, true);
    }

    /**
     * Dekripsi teks.
     * @param {string} text
     * @param {string} key
     * @returns {{ result: string, log: Array, board: Board }}
     */
    function decrypt(text, key) {
        return process(text, key, false);
    }

    /**
     * Self-test: verifikasi enkripsi-dekripsi.
     * @returns {boolean}
     */
    function selfTest() {
        const key = "KRIPTO";
        const pt = "Selamat Pagi Kriptografi";
        const ct = encrypt(pt, key).result;
        const dt = decrypt(ct, key).result;

        if (dt !== pt) {
            console.error(`Self-test GAGAL: "${dt}" !== "${pt}"`);
            return false;
        }

        const testKeys = ["a", "Noval", ".", "kunci rahasia 123"];
        const testText = "Uji 2026. AAAA aaaa";

        for (const k of testKeys) {
            const encrypted = encrypt(testText, k).result;
            const decrypted = decrypt(encrypted, k).result;
            if (decrypted !== testText) {
                console.error(`Self-test GAGAL untuk kunci "${k}"`);
                return false;
            }
        }

        console.log("✅ Semua self-test lulus.");
        return true;
    }

    // Public API
    return {
        ALPHABET,
        MOVES,
        Board,
        encrypt,
        decrypt,
        process,
        selfTest
    };
})();
