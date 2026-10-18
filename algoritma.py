"""
algoritma.py
============
Semua logika algoritma ada di file ini (dipisah dari app.py).

Isi file:
  BAGIAN 1 - LINKED LIST  : class Node & LinkedList buatan sendiri
  BAGIAN 2 - REKURSIF     : Menara Hanoi, Faktorial, Fibonacci (dengan jejak langkah)
  BAGIAN 3 - BACKTRACKING : pembuat laberin & penyelesai laberin
"""

import random


# =====================================================================
# BAGIAN 1 - LINKED LIST
# =====================================================================
# Ide sederhana: linked list itu seperti kereta api.
# Tiap gerbong (Node) menyimpan isi (data) dan "gandengan" (next)
# yang menunjuk ke gerbong berikutnya.

class Node:
    """Satu gerbong: menyimpan data dan pointer ke node berikutnya."""

    def __init__(self, data):
        self.data = data    # isi node
        self.next = None    # pointer ke node berikutnya (None = tidak ada lagi)


class LinkedList:
    """Kumpulan node yang saling tersambung. TIDAK memakai list bawaan Python
    untuk menyimpan data; hanya pointer head -> node -> node -> ... -> None."""

    def __init__(self):
        self.head = None    # node pertama (kepala kereta)
        self.size = 0       # jumlah node

    def append(self, data):
        """Tambah node di AKHIR list."""
        node_baru = Node(data)
        if self.head is None:           # list masih kosong
            self.head = node_baru
        else:
            saat_ini = self.head
            while saat_ini.next is not None:    # jalan sampai node terakhir
                saat_ini = saat_ini.next
            saat_ini.next = node_baru           # sambungkan di ujung
        self.size += 1

    def prepend(self, data):
        """Tambah node di AWAL list (jadi head baru)."""
        node_baru = Node(data)
        node_baru.next = self.head      # node baru menunjuk ke head lama
        self.head = node_baru           # head pindah ke node baru
        self.size += 1

    def insert_at(self, posisi, data):
        """Sisipkan node di posisi tertentu (mulai dari 0)."""
        if posisi < 0 or posisi > self.size:
            raise IndexError("Posisi di luar jangkauan")
        if posisi == 0:
            self.prepend(data)
            return
        sebelum = self.head
        for _ in range(posisi - 1):     # berhenti di node sebelum posisi tujuan
            sebelum = sebelum.next
        node_baru = Node(data)
        node_baru.next = sebelum.next   # 1) node baru menunjuk ke node sesudahnya
        sebelum.next = node_baru        # 2) node sebelumnya menunjuk ke node baru
        self.size += 1

    def delete_value(self, data):
        """Hapus node pertama yang berisi data tertentu. Return True kalau berhasil."""
        if self.head is None:
            return False
        if self.head.data == data:      # kasus khusus: yang dihapus adalah head
            self.head = self.head.next
            self.size -= 1
            return True
        sebelum = self.head
        while sebelum.next is not None:
            if sebelum.next.data == data:
                sebelum.next = sebelum.next.next    # lewati (lepas) node target
                self.size -= 1
                return True
            sebelum = sebelum.next
        return False

    def traverse(self):
        """Telusuri dari head sampai akhir, kembalikan isi sebagai list Python
        (hanya untuk dikirim ke tampilan web)."""
        hasil = []
        saat_ini = self.head
        while saat_ini is not None:
            hasil.append(saat_ini.data)
            saat_ini = saat_ini.next
        return hasil

    def search(self, data):
        """Cari data, return posisi (0,1,2,...) atau -1 kalau tidak ketemu."""
        saat_ini = self.head
        posisi = 0
        while saat_ini is not None:
            if saat_ini.data == data:
                return posisi
            saat_ini = saat_ini.next
            posisi += 1
        return -1

    @classmethod
    def dari_list(cls, daftar):
        """Bangun LinkedList dari list Python (dipakai saat menerima data dari web)."""
        ll = cls()
        for item in daftar:
            ll.append(item)
        return ll


def buat_puzzle_urutan(jumlah=5):
    """Puzzle 'Susun Gerbong': buat angka acak yang harus diurutkan kecil -> besar.
    Return: node_acak (urutan awal), jawaban (urutan benar)."""
    angka = random.sample(range(1, 30), jumlah)     # angka unik
    jawaban = sorted(angka)
    acak = angka[:]
    while acak == jawaban:                          # pastikan tidak sudah urut
        random.shuffle(acak)
    return {"acak": acak, "jawaban": jawaban}


def cek_urutan(susunan_user, jawaban):
    """Cek apakah susunan node dari pemain sudah benar."""
    return susunan_user == jawaban


def jalankan_operasi(data, operasi, nilai=None, posisi=None):
    """Jalankan satu operasi pada linked list lalu kembalikan hasil + pesan.
    data   : isi list saat ini (list Python dari tampilan)
    operasi: 'append' | 'prepend' | 'insert' | 'delete' | 'search' | 'traverse'
    """
    ll = LinkedList.dari_list(data)     # bangun linked list asli dari data
    pesan = ""
    jejak = []                          # urutan node yang dikunjungi (untuk animasi)

    if operasi == "append":
        ll.append(nilai)
        pesan = f"Node {nilai} ditambah di akhir. 🚂"
    elif operasi == "prepend":
        ll.prepend(nilai)
        pesan = f"Node {nilai} ditambah di depan jadi head baru! 🚀"
    elif operasi == "insert":
        try:
            ll.insert_at(posisi, nilai)
            pesan = f"Node {nilai} disisipkan di posisi {posisi}. ✨"
        except IndexError:
            pesan = f"Posisi {posisi} tidak ada, coba angka 0 sampai {ll.size}."
    elif operasi == "delete":
        if ll.delete_value(nilai):
            pesan = f"Node {nilai} berhasil dihapus. 🗑️"
        else:
            pesan = f"Node {nilai} tidak ditemukan, coba cek lagi ya."
    elif operasi == "search":
        pos = ll.search(nilai)
        jejak = list(range(pos + 1)) if pos != -1 else list(range(ll.size))
        pesan = (f"Ketemu! {nilai} ada di posisi {pos}. 🔍" if pos != -1
                 else f"{nilai} tidak ada di list ini.")
    elif operasi == "traverse":
        jejak = list(range(ll.size))
        pesan = "Kita telusuri dari head sampai ujung. 👀"

    return {"data": ll.traverse(), "pesan": pesan, "jejak": jejak}


# =====================================================================
# BAGIAN 2 - REKURSIF
# =====================================================================
# Rekursif = fungsi yang memanggil DIRINYA SENDIRI untuk masalah yang
# lebih kecil, sampai ketemu "kasus dasar" (base case) yang berhenti.
# Di sini tiap fungsi juga mencatat 'jejak' agar bisa dianimasikan.

def hanoi(n, asal, bantu, tujuan, langkah):
    """Menara Hanoi. Pindahkan n piringan dari 'asal' ke 'tujuan' lewat 'bantu'.
    Aturan: pindah satu-satu, piringan besar tidak boleh di atas yang kecil."""
    if n == 0:                                  # KASUS DASAR: tidak ada piringan
        return
    hanoi(n - 1, asal, tujuan, bantu, langkah)  # 1) pindahkan n-1 piringan ke tiang bantu
    langkah.append({"piringan": n, "dari": asal, "ke": tujuan})  # 2) pindahkan piringan terbesar
    hanoi(n - 1, bantu, asal, tujuan, langkah)  # 3) pindahkan n-1 piringan ke tujuan


def selesaikan_hanoi(n):
    """Bungkus hanoi() supaya mudah dipanggil dari Flask. Batas n agar tidak kebanyakan."""
    n = max(1, min(n, 5))
    langkah = []
    hanoi(n, "A", "B", "C", langkah)
    return {"n": n, "langkah": langkah, "total": len(langkah)}   # total = 2^n - 1


def faktorial(n, jejak, kedalaman=0):
    """n! = n x (n-1)!  dengan 0! = 1. Jejak mencatat tiap panggilan & hasilnya."""
    jejak.append({"aksi": "panggil", "teks": f"faktorial({n})", "kedalaman": kedalaman})
    if n <= 1:                                  # KASUS DASAR
        hasil = 1
    else:                                       # KASUS REKURSIF
        hasil = n * faktorial(n - 1, jejak, kedalaman + 1)
    jejak.append({"aksi": "kembali", "teks": f"faktorial({n}) = {hasil}",
                  "kedalaman": kedalaman, "nilai": hasil})
    return hasil


def fibonacci(n, jejak, kedalaman=0):
    """fib(n) = fib(n-1) + fib(n-2), dengan fib(0)=0 dan fib(1)=1."""
    jejak.append({"aksi": "panggil", "teks": f"fib({n})", "kedalaman": kedalaman})
    if n <= 1:                                  # KASUS DASAR
        hasil = n
    else:                                       # KASUS REKURSIF (bercabang dua)
        hasil = (fibonacci(n - 1, jejak, kedalaman + 1)
                 + fibonacci(n - 2, jejak, kedalaman + 1))
    jejak.append({"aksi": "kembali", "teks": f"fib({n}) = {hasil}",
                  "kedalaman": kedalaman, "nilai": hasil})
    return hasil


def hitung_rekursif(jenis, n):
    """Jalankan faktorial/fibonacci dan kembalikan hasil + jejak panggilan."""
    jejak = []
    if jenis == "faktorial":
        n = max(0, min(n, 8))
        hasil = faktorial(n, jejak)
    else:
        n = max(0, min(n, 6))       # fib dibatasi kecil karena cabangnya banyak
        hasil = fibonacci(n, jejak)
    return {"jenis": jenis, "n": n, "hasil": hasil, "jejak": jejak}


# =====================================================================
# BAGIAN 3 - BACKTRACKING (LABERIN)
# =====================================================================
# Laberin berupa grid: 1 = tembok, 0 = jalan.
# Backtracking = coba satu arah; kalau buntu, MUNDUR ke persimpangan
# sebelumnya dan coba arah lain.

# Arah gerak: (perubahan baris, perubahan kolom)
ARAH = [(0, 1), (1, 0), (0, -1), (-1, 0)]   # kanan, bawah, kiri, atas


def buat_laberin(ukuran=11):
    """Buat laberin acak dengan algoritma Prim acak.
    Cara kerjanya: mulai dari satu petak, lalu terus 'memperluas' jalan lewat
    tembok-tembok perbatasan yang dipilih acak. Hasilnya banyak cabang & jalan buntu,
    jadi komputer (dan kamu!) sering salah belok dan harus mundur. Seru untuk backtracking!
    ukuran harus ganjil (dipaksa ganjil). Start di (1,1), finish di pojok kanan bawah."""
    ukuran = max(7, min(ukuran, 21))
    if ukuran % 2 == 0:
        ukuran += 1
    grid = [[1] * ukuran for _ in range(ukuran)]    # awalnya semua tembok

    perbatasan = []     # daftar tembok yang bisa dibobol: (tembok_r, tembok_c, sel_r, sel_c)

    def tambah_perbatasan(r, c):
        """Catat tembok di sekitar petak (r,c) yang mengarah ke sel yang belum digali."""
        for dr, dc in ARAH:
            rb, cb = r + dr * 2, c + dc * 2         # sel di seberang tembok (2 petak)
            if 0 < rb < ukuran - 1 and 0 < cb < ukuran - 1 and grid[rb][cb] == 1:
                perbatasan.append((r + dr, c + dc, rb, cb))

    grid[1][1] = 0
    tambah_perbatasan(1, 1)
    while perbatasan:
        # Ambil satu tembok perbatasan secara acak
        i = random.randrange(len(perbatasan))
        perbatasan[i], perbatasan[-1] = perbatasan[-1], perbatasan[i]
        rt, ct, rb, cb = perbatasan.pop()
        if grid[rb][cb] == 1:                       # sel seberang masih tembok -> bobol
            grid[rt][ct] = 0
            grid[rb][cb] = 0
            tambah_perbatasan(rb, cb)

    return {"grid": grid, "mulai": [1, 1], "selesai": [ukuran - 2, ukuran - 2]}


def selesaikan_laberin(grid, mulai, selesai):
    """Cari jalan keluar dengan backtracking. Mengembalikan:
      - langkah: urutan kejadian untuk animasi ('coba' / 'mundur' / 'selesai')
      - jalur  : jalan keluar yang benar (kalau ada)"""
    baris, kolom = len(grid), len(grid[0])
    dikunjungi = set()      # petak yang sudah pernah dicoba
    jalur = []              # jalur yang sedang ditempuh
    langkah = []            # catatan animasi

    def telusuri(r, c):
        # Basis 1: keluar dari grid / tembok / sudah dikunjungi -> gagal
        if not (0 <= r < baris and 0 <= c < kolom):
            return False
        if grid[r][c] == 1 or (r, c) in dikunjungi:
            return False

        dikunjungi.add((r, c))
        jalur.append([r, c])                            # COBA petak ini
        langkah.append({"aksi": "coba", "pos": [r, c]})

        # Basis 2: sampai finish -> berhasil
        if [r, c] == list(selesai):
            langkah.append({"aksi": "selesai", "pos": [r, c]})
            return True

        # Coba keempat arah satu per satu (rekursif)
        for dr, dc in ARAH:
            if telusuri(r + dr, c + dc):
                return True                             # ketemu, teruskan kabar baik

        # BACKTRACK: semua arah buntu -> mundur
        jalur.pop()
        langkah.append({"aksi": "mundur", "pos": [r, c]})
        return False

    ketemu = telusuri(mulai[0], mulai[1])
    return {"ketemu": ketemu, "langkah": langkah, "jalur": jalur if ketemu else []}


def cek_jalur_pemain(grid, jalur, mulai, selesai):
    """Cek apakah jalur buatan pemain valid: mulai di start, tiap langkah
    bersebelahan, tidak menembus tembok, dan berakhir di finish."""
    if not jalur or list(jalur[0]) != list(mulai) or list(jalur[-1]) != list(selesai):
        return False
    for i, (r, c) in enumerate(jalur):
        if grid[r][c] == 1:
            return False
        if i > 0:
            pr, pc = jalur[i - 1]
            if abs(r - pr) + abs(c - pc) != 1:
                return False
    return True
