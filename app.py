"""
app.py
======
File utama Flask. Tugasnya hanya:
  1. Menampilkan halaman (route HTML)
  2. Menerima permintaan dari JavaScript (route API JSON)
     lalu meneruskannya ke fungsi di algoritma.py

Logika algoritma TIDAK ditulis di sini, semuanya ada di algoritma.py.
Jalankan dengan:  python app.py
"""

from flask import Flask, render_template, request, jsonify

import algoritma    # modul buatan sendiri: Linked List, Rekursif, Backtracking

app = Flask(__name__)


# ---------------------------------------------------------------------
# Fungsi bantu: ambil angka dari input dengan aman
# ---------------------------------------------------------------------
def ambil_int(nilai, default=None):
    """Ubah nilai jadi integer. Kalau gagal (kosong/huruf), kembalikan default."""
    try:
        return int(nilai)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------
# Fungsi bantu: validasi data laberin dari klien
# ---------------------------------------------------------------------
def validasi_laberin(body, ukuran_maks=25):
    """Cek data laberin dari klien. Return (grid, mulai, selesai) atau None.

    Tujuan: tolak request aneh/berbahaya SEBELUM masuk ke algoritma backtracking.
    Tanpa ini, klien bisa kirim grid 500x500 -> Python crash karena RecursionError,
    dan kuota Vercel gratis bisa cepat habis.
    """
    grid = body.get("grid")
    mulai = body.get("mulai")
    selesai = body.get("selesai")

    # 1) grid harus list of list, ukuran wajar (7..ukuran_maks)
    if not isinstance(grid, list):
        return None
    if not (7 <= len(grid) <= ukuran_maks):
        return None

    # 2) setiap baris harus sama panjang & isinya cuma 0 atau 1
    n = len(grid)
    for baris in grid:
        if not isinstance(baris, list) or len(baris) != n:
            return None
        if not all(cell in (0, 1) for cell in baris):
            return None

    # 3) mulai & selesai harus [baris, kolom] integer di dalam grid
    def posisi_valid(p):
        return (
            isinstance(p, list) and len(p) == 2
            and all(isinstance(x, int) for x in p)
            and 0 <= p[0] < n and 0 <= p[1] < n
        )

    if not posisi_valid(mulai) or not posisi_valid(selesai):
        return None

    return grid, mulai, selesai


# =====================================================================
# ROUTE HALAMAN (yang tampil di browser)
# =====================================================================

@app.route("/")
def beranda():
    """Halaman beranda dengan 3 menu."""
    return render_template("index.html")


@app.route("/linked-list")
def halaman_linked_list():
    return render_template("linked_list.html")


@app.route("/rekursif")
def halaman_rekursif():
    return render_template("rekursif.html")


@app.route("/backtracking")
def halaman_backtracking():
    return render_template("backtracking.html")


# =====================================================================
# API LINKED LIST
# =====================================================================

@app.route("/api/linked-list/puzzle")
def api_ll_puzzle():
    """Buat puzzle 'Susun Gerbong': kirim angka acak + jawaban benar."""
    jumlah = ambil_int(request.args.get("jumlah"), 5)
    jumlah = max(3, min(jumlah, 8))
    return jsonify(algoritma.buat_puzzle_urutan(jumlah))


@app.route("/api/linked-list/cek", methods=["POST"])
def api_ll_cek():
    """Cek susunan node dari pemain apakah sudah urut dengan benar."""
    body = request.get_json(silent=True) or {}
    benar = algoritma.cek_urutan(body.get("susunan", []), body.get("jawaban", []))
    return jsonify({"benar": benar})


@app.route("/api/linked-list/operasi", methods=["POST"])
def api_ll_operasi():
    """Jalankan operasi insert/delete/search/traverse pada linked list."""
    body = request.get_json(silent=True) or {}
    data = body.get("data", [])
    operasi = body.get("operasi", "")
    nilai = ambil_int(body.get("nilai"))
    posisi = ambil_int(body.get("posisi"))

    # Operasi yang butuh nilai, tapi nilainya kosong -> beri pesan ramah
    if operasi in ("append", "prepend", "insert", "delete", "search") and nilai is None:
        return jsonify({"data": data, "jejak": [],
                        "pesan": "Isi dulu angkanya ya! 😊"})
    # Insert butuh posisi
    if operasi == "insert" and posisi is None:
        return jsonify({"data": data, "jejak": [],
                        "pesan": "Isi posisinya juga ya (mulai dari 0)."})

    return jsonify(algoritma.jalankan_operasi(data, operasi, nilai, posisi))


# =====================================================================
# API REKURSIF
# =====================================================================

@app.route("/api/rekursif/hanoi")
def api_hanoi():
    """Kirim seluruh langkah penyelesaian Menara Hanoi."""
    n = ambil_int(request.args.get("n"), 3)
    return jsonify(algoritma.selesaikan_hanoi(n))


@app.route("/api/rekursif/hitung")
def api_rekursif_hitung():
    """Hitung faktorial/fibonacci beserta jejak pemanggilan fungsinya."""
    jenis = request.args.get("jenis", "faktorial")
    if jenis not in ("faktorial", "fibonacci"):
        jenis = "faktorial"
    n = ambil_int(request.args.get("n"), 4)
    return jsonify(algoritma.hitung_rekursif(jenis, n))


# =====================================================================
# API BACKTRACKING (LABERIN)
# =====================================================================

@app.route("/api/laberin/baru")
def api_laberin_baru():
    """Buat laberin acak baru."""
    ukuran = ambil_int(request.args.get("ukuran"), 11)
    return jsonify(algoritma.buat_laberin(ukuran))


@app.route("/api/laberin/solusi", methods=["POST"])
def api_laberin_solusi():
    """Selesaikan laberin dengan backtracking dan kirim langkah animasinya."""
    body = request.get_json(silent=True) or {}
    data = validasi_laberin(body)
    if data is None:
        return jsonify({"error": "Data laberin tidak valid"}), 400
    grid, mulai, selesai = data
    return jsonify(algoritma.selesaikan_laberin(grid, mulai, selesai))


@app.route("/api/laberin/cek", methods=["POST"])
def api_laberin_cek():
    """Cek apakah jalur buatan pemain sampai ke finish dengan benar."""
    body = request.get_json(silent=True) or {}
    data = validasi_laberin(body)
    if data is None:
        return jsonify({"error": "Data laberin tidak valid"}), 400
    grid, mulai, selesai = data
    benar = algoritma.cek_jalur_pemain(grid, body.get("jalur", []), mulai, selesai)
    return jsonify({"benar": benar})


# ---------------------------------------------------------------------
# Titik awal program
# ---------------------------------------------------------------------
if __name__ == "__main__":
    # debug=True: server otomatis restart saat kode diubah (cocok untuk belajar)
    app.run(debug=True)