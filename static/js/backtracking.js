/*
  backtracking.js
  ===============
  Mengatur tampilan & interaksi halaman Laberin.
  Algoritma backtracking yang asli ada di Python (selesaikan_laberin di algoritma.py).
  File ini menggambar laberin, menggerakkan pemain, dan menganimasikan
  langkah-langkah dari server: coba -> buntu -> mundur -> ketemu.

  Fungsi global dari base.html yang dipakai: tampilToast(), hujanKonfeti(), tunggu()
*/

// ---------------------------------------------------------------------
// 1. DATA & ELEMEN
// ---------------------------------------------------------------------
const wadah = document.getElementById("laberin");
const pilihUkuran = document.getElementById("pilih-ukuran");
const infoLaberin = document.getElementById("info-laberin");
const pesanLaberin = document.getElementById("pesan-laberin");
const btnBaru = document.getElementById("btn-laberin-baru");
const btnUlang = document.getElementById("btn-ulang");
const btnSolusi = document.getElementById("btn-solusi");

// Semua kelas status yang bisa menempel di sebuah petak
const KELAS_STATUS = ["pemain", "posisi", "coba", "mundur", "jalur"];

let grid = [];          // 1 = tembok, 0 = jalan (dari server)
let mulai = [1, 1];     // posisi start [baris, kolom]
let selesai = [];       // posisi finish
let baris = 0, kolom = 0;
let sel = [];           // sel[r][c] = elemen HTML petak
let jalurPemain = [];   // jalur yang sudah dilalui pemain: [[r,c], [r,c], ...]
let terkunci = false;   // true saat pemain sudah menang atau solusi sedang dianimasikan
let sibuk = false;      // true saat animasi solusi berjalan

// Kirim data ke server (POST, JSON) lalu kembalikan jawabannya
async function kirimJSON(url, data) {
  const respons = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return respons.json();
}


// ---------------------------------------------------------------------
// 2. MENGGAMBAR LABERIN
// ---------------------------------------------------------------------

// Teks bawaan petak: bendera di start, keju di finish
function teksDasar(r, c) {
  if (r === mulai[0] && c === mulai[1]) return "🚩";
  if (r === selesai[0] && c === selesai[1]) return "🧀";
  return "";
}

// Buat semua petak laberin (dilakukan sekali tiap laberin baru)
function gambarLaberin() {
  wadah.innerHTML = "";
  wadah.style.gridTemplateColumns = `repeat(${kolom}, 1fr)`;
  sel = [];
  for (let r = 0; r < baris; r++) {
    const barisSel = [];
    for (let c = 0; c < kolom; c++) {
      const el = document.createElement("div");
      el.className = "sel";
      if (grid[r][c] === 1) el.classList.add("tembok");
      if (r === mulai[0] && c === mulai[1]) el.classList.add("mulai");
      if (r === selesai[0] && c === selesai[1]) el.classList.add("selesai");
      el.textContent = teksDasar(r, c);
      wadah.appendChild(el);
      barisSel.push(el);
    }
    sel.push(barisSel);
  }
}

// Hapus semua warna status & tikus dari semua petak jalan
function bersihkanStatus() {
  for (let r = 0; r < baris; r++) {
    for (let c = 0; c < kolom; c++) {
      if (grid[r][c] === 1) continue;
      sel[r][c].classList.remove(...KELAS_STATUS);
      sel[r][c].textContent = teksDasar(r, c);
    }
  }
}

// Gambar jalur milik pemain + posisi tikusnya
function gambarJalurPemain() {
  bersihkanStatus();
  if (jalurPemain.length === 0) return;
  jalurPemain.forEach(([r, c]) => sel[r][c].classList.add("pemain"));
  const [pr, pc] = jalurPemain[jalurPemain.length - 1];
  sel[pr][pc].classList.add("posisi");
  sel[pr][pc].textContent = "🐭";
  infoLaberin.textContent = `Langkah: ${jalurPemain.length - 1}`;
}


// ---------------------------------------------------------------------
// 3. MEMULAI LABERIN
// ---------------------------------------------------------------------

// Ulangi dari start di laberin yang sama
function mulaiUlang() {
  jalurPemain = [mulai.slice()];
  terkunci = false;
  pesanLaberin.textContent = "Ayo cari jalan ke keju! 🧀";
  gambarJalurPemain();
}

// Minta laberin acak baru dari server
async function laberinBaru() {
  if (sibuk) return;
  try {
    const data = await (await fetch("/api/laberin/baru?ukuran=" + pilihUkuran.value)).json();
    grid = data.grid;
    mulai = data.mulai;
    selesai = data.selesai;
    baris = grid.length;
    kolom = grid[0].length;
    gambarLaberin();
    mulaiUlang();
  } catch (e) {
    tampilToast("Ups, laberinnya belum bisa dimuat. Coba lagi ya! 🙏", "salah");
  }
}


// ---------------------------------------------------------------------
// 4. PEMAIN BERGERAK (tombol arah & keyboard)
// ---------------------------------------------------------------------

// dr = perubahan baris, dc = perubahan kolom
function gerak(dr, dc) {
  if (terkunci || sibuk || jalurPemain.length === 0) return;

  const [r, c] = jalurPemain[jalurPemain.length - 1];   // posisi sekarang
  const br = r + dr, bc = c + dc;                       // posisi tujuan

  // Tembok atau di luar laberin: tidak bisa lewat
  if (br < 0 || br >= baris || bc < 0 || bc >= kolom || grid[br][bc] === 1) {
    tampilToast("Ada tembok di situ! Coba arah lain ya 🧱", "info");
    return;
  }

  // Kalau tujuannya petak sebelumnya, berarti pemain MUNDUR (backtrack): buang petak terakhir
  const sebelumnya = jalurPemain.length >= 2 ? jalurPemain[jalurPemain.length - 2] : null;
  if (sebelumnya && sebelumnya[0] === br && sebelumnya[1] === bc) {
    jalurPemain.pop();
    pesanLaberin.textContent = "Mundur satu langkah, itu namanya backtracking! 🔙";
  } else {
    jalurPemain.push([br, bc]);
    pesanLaberin.textContent = "";
  }
  gambarJalurPemain();

  if (br === selesai[0] && bc === selesai[1]) cekMenang();
}

// Tanya server apakah jalur pemain benar-benar sampai ke finish
async function cekMenang() {
  terkunci = true;
  try {
    const hasil = await kirimJSON("/api/laberin/cek", { grid, mulai, selesai, jalur: jalurPemain });
    if (hasil.benar) {
      pesanLaberin.textContent = "Hore! Tikusnya dapat kejunya! 🧀🎉";
      tampilToast("Kamu hebat, berhasil keluar dari laberin! 🌟", "benar");
      hujanKonfeti();
    } else {
      terkunci = false;
    }
  } catch (e) {
    terkunci = false;
    tampilToast("Ups, ada masalah koneksi. Coba lagi ya! 🙏", "salah");
  }
}

// Tombol arah di layar
document.getElementById("btn-atas").addEventListener("click", () => gerak(-1, 0));
document.getElementById("btn-bawah").addEventListener("click", () => gerak(1, 0));
document.getElementById("btn-kiri").addEventListener("click", () => gerak(0, -1));
document.getElementById("btn-kanan").addEventListener("click", () => gerak(0, 1));

// Keyboard: tombol panah atau W A S D
const ARAH_KEYBOARD = {
  ArrowUp: [-1, 0], w: [-1, 0],
  ArrowDown: [1, 0], s: [1, 0],
  ArrowLeft: [0, -1], a: [0, -1],
  ArrowRight: [0, 1], d: [0, 1],
};
document.addEventListener("keydown", (e) => {
  const tag = e.target.tagName;
  if (tag === "SELECT" || tag === "INPUT") return;   // jangan ganggu kotak pilihan
  const arah = ARAH_KEYBOARD[e.key];
  if (!arah) return;
  e.preventDefault();                                // cegah halaman ikut bergulir
  gerak(arah[0], arah[1]);
});


// ---------------------------------------------------------------------
// 5. LIHAT SOLUSI: animasi backtracking dari server
// ---------------------------------------------------------------------
function aturTombol(aktif) {
  btnBaru.disabled = !aktif;
  btnUlang.disabled = !aktif;
  btnSolusi.disabled = !aktif;
  pilihUkuran.disabled = !aktif;
}

async function lihatSolusi() {
  if (sibuk) return;
  sibuk = true;
  terkunci = true;
  aturTombol(false);

  jalurPemain = [];          // singkirkan jalur pemain, kita tampilkan solusi komputer
  bersihkanStatus();
  infoLaberin.textContent = "";

  try {
    const hasil = await kirimJSON("/api/laberin/solusi", { grid, mulai, selesai });

    // Semakin banyak langkahnya, semakin cepat animasinya (supaya tidak kelamaan)
    const jeda = Math.max(20, Math.min(120, Math.floor(5000 / hasil.langkah.length)));
    let jumlahCoba = 0, jumlahMundur = 0;

    for (const langkah of hasil.langkah) {
      const [r, c] = langkah.pos;
      const el = sel[r][c];

      if (langkah.aksi === "coba") {
        el.classList.remove(...KELAS_STATUS);
        el.classList.add("coba");                    // biru: sedang dicoba
        jumlahCoba++;
        pesanLaberin.textContent = "Mencoba jalan ini... 🔍";
      } else if (langkah.aksi === "mundur") {
        el.classList.remove(...KELAS_STATUS);
        el.classList.add("mundur");                  // merah muda: buntu, mundur
        jumlahMundur++;
        pesanLaberin.textContent = "Buntu! Mundur dulu ke persimpangan sebelumnya 🔙";
      } else if (langkah.aksi === "selesai") {
        pesanLaberin.textContent = "Ketemu jalan keluarnya! 🎉";
      }
      infoLaberin.textContent = `Dicoba: ${jumlahCoba}  |  Mundur: ${jumlahMundur}`;
      await tunggu(jeda);
    }

    // Warnai jalan keluar yang benar dengan hijau
    for (const [r, c] of hasil.jalur) {
      sel[r][c].classList.remove(...KELAS_STATUS);
      sel[r][c].classList.add("jalur");
      await tunggu(40);
    }
    pesanLaberin.textContent =
      `Selesai! Komputer mundur ${jumlahMundur} kali sebelum ketemu jalan keluar. Coba lagi sendiri, yuk! 🎓`;
  } catch (e) {
    tampilToast("Ups, solusinya belum bisa dimuat. Coba lagi ya! 🙏", "salah");
  }

  sibuk = false;
  aturTombol(true);     // terkunci tetap true sampai pemain menekan Mulai Ulang / Laberin Baru
}

btnBaru.addEventListener("click", laberinBaru);
btnUlang.addEventListener("click", () => { if (!sibuk) mulaiUlang(); });
btnSolusi.addEventListener("click", lihatSolusi);
pilihUkuran.addEventListener("change", laberinBaru);


// ---------------------------------------------------------------------
// MULAI: buat laberin saat halaman dibuka
// ---------------------------------------------------------------------
laberinBaru();
