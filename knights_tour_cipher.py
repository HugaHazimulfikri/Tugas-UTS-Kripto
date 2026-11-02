#!/usr/bin/env python3
"""Knight's Tour Cipher - cipher klasik berbasis langkah kuda catur (8x8).

Cara pakai:
    python knights_tour_cipher.py                    -> mode interaktif
    python knights_tour_cipher.py enc KUNCI "teks"   -> enkripsi
    python knights_tour_cipher.py dec KUNCI "teks"   -> dekripsi
    python knights_tour_cipher.py board KUNCI        -> tampilkan papan
    python knights_tour_cipher.py test               -> uji enkripsi-dekripsi
Hanya untuk pembelajaran, bukan pengaman data sungguhan.
"""
import sys

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ."
MOVES = [(-2, -1), (-2, 1), (-1, 2), (1, 2), (2, 1), (2, -1), (1, -2), (-1, -2)]
MASK = 0xFFFFFFFF


def seed_from_key(key):
    """FNV-1a 32-bit dari kunci."""
    h = 2166136261
    for ch in key:
        h ^= ord(ch)
        h = (h * 16777619) & MASK
    return h


def build_tour(key):
    """Bangun knight's tour 8x8 yang ditentukan kunci.

    Kunci menentukan: urutan prioritas 8 langkah kuda, titik awal, dan arah awal.
    Pencarian memakai heuristik Warnsdorff dengan backtracking.
    """
    state = [seed_from_key(key or " ")]

    def rnd():
        state[0] = (state[0] * 1664525 + 1013904223) & MASK
        return state[0]

    order = list(range(8))
    for i in range(7, 0, -1):
        j = rnd() % (i + 1)
        order[i], order[j] = order[j], order[i]
    start = rnd() % 64

    visited = [False] * 64
    path = []

    def neighbours(p):
        r, c = divmod(p, 8)
        result = []
        for m in order:
            a, b = r + MOVES[m][0], c + MOVES[m][1]
            if 0 <= a < 8 and 0 <= b < 8 and not visited[a * 8 + b]:
                result.append(a * 8 + b)
        return result

    def degree(q):
        visited[q] = True
        n = len(neighbours(q))
        visited[q] = False
        return n

    calls = [0]

    def dfs(p):
        visited[p] = True
        path.append(p)
        if len(path) == 64:
            return True
        calls[0] += 1
        if calls[0] > 200000:
            visited[p] = False
            path.pop()
            return False
        cands = sorted(((degree(q), i, q) for i, q in enumerate(neighbours(p))))
        for _, _, q in cands:
            if dfs(q):
                return True
        visited[p] = False
        path.pop()
        return False

    if not dfs(start):
        raise ValueError("Tour tidak ditemukan untuk kunci ini, coba kunci lain.")
    d0 = sum(ord(c) for c in key) % 8
    return path, d0


class Board:
    def __init__(self, key):
        if not key:
            raise ValueError("Kunci tidak boleh kosong.")
        self.path, self.d0 = build_tour(key)
        self.cell = [""] * 64          # kotak -> karakter
        self.pos = {}                  # karakter -> kotak
        self.index = {}                # karakter -> indeks pada tour
        for i, p in enumerate(self.path):
            self.cell[p] = ALPHABET[i]
            self.pos[ALPHABET[i]] = p
            self.index[ALPHABET[i]] = i

    def show(self):
        order = [0] * 64
        for i, p in enumerate(self.path):
            order[p] = i
        lines = ["     " + "".join(f" {c:^5}" for c in range(8))]
        for r in range(8):
            row = "".join(f" {self.cell[r*8+c]}:{order[r*8+c]:<3} " for c in range(8))
            lines.append(f"  {r}  " + row)
        return "\n".join(lines)


def process(text, key, encrypt=True, trace=False):
    """Enkripsi atau dekripsi. Karakter di luar ALPHABET dilewati."""
    board = Board(key)
    d, j, out, log = board.d0, 0, [], []
    sign = 1 if encrypt else -1
    for ch in text:
        if ch not in board.pos:
            continue
        p = board.pos[ch]
        r, c = divmod(p, 8)
        q = ((r + sign * MOVES[d][0]) % 8) * 8 + ((c + sign * MOVES[d][1]) % 8)
        o = board.cell[q]
        log.append((ch, divmod(p, 8), d, divmod(q, 8), o))
        out.append(o)
        j += 1
        d = (board.index[o if encrypt else ch] + j) % 8
    result = "".join(out)
    return (result, log) if trace else result


def encrypt(text, key):
    return process(text, key, True)


def decrypt(text, key):
    return process(text, key, False)


def self_test():
    key, pt = "KRIPTO", "Selamat Pagi Kriptografi"
    ct = encrypt(pt, key)
    print("Kunci      :", key)
    print("Plaintext  :", pt)
    print("Ciphertext :", ct)
    print("Dekripsi   :", decrypt(ct, key))
    assert decrypt(ct, key) == pt
    for k in ["a", "Noval", ".", "kunci rahasia 123"]:
        t = "Uji 2026. AAAA aaaa"
        assert decrypt(encrypt(t, k), k) == t
    print("Semua uji lulus.")


def interactive():
    print("Knight's Tour Cipher")
    key = input("Kunci: ")
    while True:
        mode = input("[e]nkripsi, [d]ekripsi, [b]oard, [q]uit: ").strip().lower()
        if mode == "q":
            break
        if mode == "b":
            print(Board(key).show())
        elif mode in ("e", "d"):
            text = input("Teks: ")
            result, log = process(text, key, mode == "e", trace=True)
            print("Hasil:", result)
            if input("Tampilkan langkah? (y/n): ").lower() == "y":
                for n, (ch, src, d, dst, o) in enumerate(log, 1):
                    print(f"{n:>3}. '{ch}' {src} --arah {d}--> {dst} = '{o}'")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        interactive()
    elif a[0] in ("enc", "dec") and len(a) == 3:
        print((encrypt if a[0] == "enc" else decrypt)(a[2], a[1]))
    elif a[0] == "board" and len(a) == 2:
        print(Board(a[1]).show())
    elif a[0] == "test":
        self_test()
    else:
        print(__doc__)
