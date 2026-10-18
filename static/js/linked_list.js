/*
  linked_list.js
  ==============
  Mengatur tampilan & interaksi halaman Linked List.
  Logika linked list yang asli ada di Python (algoritma.py);
  file ini hanya menggambar hasilnya dan mengirim permintaan ke server.

  Fungsi global dari base.html yang dipakai di sini:
    tampilToast(), hujanKonfeti(), tunggu()
*/

// ---------------------------------------------------------------------
// 1. FUNGSI BANTU
// ---------------------------------------------------------------------

// Kirim data ke server (POST, format JSON) lalu kembalikan jawabannya
async function kirimJSON(url, data) {
  const respons = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return respons.json();
}

// Gambar rantai node ke dalam sebuah wadah.
//   wadah : elemen HTML tempat menggambar
//   data  : array angka, mis. [3, 5, 8]
//   opsi  : { dipilih: index node yang dipilih, saatKlik: fungsi(index), kelas: {index: "benar"} }
function gambarRantai(wadah, data, opsi = {}) {
  wadah.innerHTML = "";   // kosongkan dulu

  // Label HEAD menunjuk ke node pertama
  const head = document.createElement("span");
  head.className = "label-head";
  head.textContent = "HEAD";
  wadah.appendChild(head);
  wadah.appendChild(buatPanah());

  // Gambar tiap node + panah (pointer) ke node berikutnya
  data.forEach((nilai, i) => {
    const node = document.createElement("div");
    node.className = "node";
    node.textContent = nilai;
    node.dataset.index = i;

    if (opsi.dipilih === i) node.classList.add("dipilih");
    if (opsi.kelas && opsi.kelas[i]) node.classList.add(opsi.kelas[i]);
    if (opsi.saatKlik) {
      node.classList.add("bisa-geser");
      node.addEventListener("click", () => opsi.saatKlik(i));
    }

    wadah.appendChild(node);
    wadah.appendChild(buatPanah());   // pointer ke node berikutnya (atau NULL)
  });

  // Ujung rantai: NULL = tidak ada gerbong lagi
  const kosong = document.createElement("span");
  kosong.className = "null-kotak";
  kosong.textContent = "NULL";
  wadah.appendChild(kosong);
}

function buatPanah() {
  const p = document.createElement("span");
  p.className = "panah";
  p.textContent = "➜";
  return p;
}


// ---------------------------------------------------------------------
// 2. PUZZLE 1: SUSUN GERBONG (ketuk dua node untuk bertukar)
// ---------------------------------------------------------------------
const rantaiPuzzle = document.getElementById("rantai-puzzle");
const pesanPuzzle = document.getElementById("pesan-puzzle");

let susunan = [];          // urutan node yang sedang tampil
let jawaban = [];          // urutan yang benar (dari server)
let nodeDipilih = null;    // index node yang sedang diketuk pertama

function tampilkanPuzzle(kelas = {}) {
  gambarRantai(rantaiPuzzle, susunan, {
    dipilih: nodeDipilih,
    saatKlik: ketukNodePuzzle,
    kelas: kelas,
  });
}

// Dipanggil setiap kali pemain mengetuk sebuah node
function ketukNodePuzzle(index) {
  if (nodeDipilih === null) {
    nodeDipilih = index;                     // ketukan pertama: pilih node
  } else if (nodeDipilih === index) {
    nodeDipilih = null;                      // ketuk node yang sama: batal pilih
  } else {
    // ketukan kedua: tukar posisi dua node
    [susunan[nodeDipilih], susunan[index]] = [susunan[index], susunan[nodeDipilih]];
    nodeDipilih = null;
    pesanPuzzle.textContent = "";
  }
  tampilkanPuzzle();
}

async function puzzleBaru() {
  try {
    const hasil = await (await fetch("/api/linked-list/puzzle?jumlah=5")).json();
    susunan = hasil.acak;
    jawaban = hasil.jawaban;
    nodeDipilih = null;
    pesanPuzzle.textContent = "Ayo urutkan dari yang paling kecil! 💪";
    tampilkanPuzzle();
  } catch (e) {
    tampilToast("Ups, puzzle belum bisa dimuat. Coba lagi ya! 🙏", "salah");
  }
}

async function cekPuzzle() {
  try {
    const hasil = await kirimJSON("/api/linked-list/cek", { susunan, jawaban });
    if (hasil.benar) {
      // BENAR: semua node jadi hijau + konfeti
      const semuaBenar = {};
      susunan.forEach((_, i) => (semuaBenar[i] = "benar"));
      nodeDipilih = null;
      gambarRantai(rantaiPuzzle, susunan, { kelas: semuaBenar });   // tanpa saatKlik: terkunci
      pesanPuzzle.textContent = "Hebat! Semua gerbong sudah berurutan! 🎉";
      tampilToast("Yeay, kamu berhasil! 🌟", "benar");
      hujanKonfeti();
    } else {
      // SALAH: beri semangat + info berapa yang sudah pas (tidak menyalahkan)
      const pas = susunan.filter((n, i) => n === jawaban[i]).length;
      pesanPuzzle.textContent = `Hampir! ${pas} gerbong sudah di tempat yang pas. Coba lagi ya! 💪`;
      tampilToast("Sedikit lagi, kamu pasti bisa! ✨", "salah");
    }
  } catch (e) {
    tampilToast("Ups, ada masalah koneksi. Coba lagi ya! 🙏", "salah");
  }
}

document.getElementById("btn-puzzle-baru").addEventListener("click", puzzleBaru);
document.getElementById("btn-puzzle-cek").addEventListener("click", cekPuzzle);


// ---------------------------------------------------------------------
// 3. PUZZLE 2: LAB LINKED LIST (insert, delete, search, traverse)
// ---------------------------------------------------------------------
const rantaiLab = document.getElementById("rantai-lab");
const pesanLab = document.getElementById("pesan-lab");
const inputNilai = document.getElementById("input-nilai");
const inputPosisi = document.getElementById("input-posisi");
const DATA_AWAL = [3, 5, 8];

let dataLab = DATA_AWAL.slice();   // isi linked list di lab
let sibuk = false;                 // true saat animasi berjalan (tombol dikunci)

function aturTombolLab(aktif) {
  document.querySelectorAll(".btn-operasi, #btn-lab-reset").forEach((b) => (b.disabled = !aktif));
}

// Kirim operasi ke server (Python menjalankan LinkedList asli), lalu tampilkan hasilnya
async function jalankanOperasi(operasi) {
  if (sibuk) return;
  sibuk = true;
  aturTombolLab(false);

  try {
    const hasil = await kirimJSON("/api/linked-list/operasi", {
      data: dataLab,
      operasi: operasi,
      nilai: inputNilai.value,
      posisi: inputPosisi.value,
    });

    // Cari & Telusuri: animasikan kunjungan node satu per satu
    if (hasil.jejak && hasil.jejak.length > 0) {
      pesanLab.textContent = "Mari kita jalan satu per satu... 🚶";
      for (const index of hasil.jejak) {
        gambarRantai(rantaiLab, dataLab, { kelas: { [index]: "aktif" } });
        await tunggu(500);
      }
      // Kalau ketemu, node terakhir diberi warna hijau
      if (hasil.pesan.startsWith("Ketemu")) {
        const terakhir = hasil.jejak[hasil.jejak.length - 1];
        gambarRantai(rantaiLab, dataLab, { kelas: { [terakhir]: "benar" } });
        await tunggu(700);
      }
    }

    // Tampilkan isi list terbaru dan pesan dari server
    dataLab = hasil.data;
    gambarRantai(rantaiLab, dataLab);
    pesanLab.textContent = hasil.pesan;

    // Kosongkan input setelah operasi yang mengubah isi list
    if (["append", "prepend", "insert", "delete"].includes(operasi)) {
      inputNilai.value = "";
      inputPosisi.value = "";
    }
  } catch (e) {
    tampilToast("Ups, ada masalah koneksi. Coba lagi ya! 🙏", "salah");
  }

  sibuk = false;
  aturTombolLab(true);
}

// Pasang aksi ke setiap tombol operasi (nama operasi diambil dari atribut data-operasi)
document.querySelectorAll(".btn-operasi").forEach((tombol) => {
  tombol.addEventListener("click", () => jalankanOperasi(tombol.dataset.operasi));
});

document.getElementById("btn-lab-reset").addEventListener("click", () => {
  dataLab = DATA_AWAL.slice();
  gambarRantai(rantaiLab, dataLab);
  pesanLab.textContent = "List kembali ke awal. Silakan coba lagi! ♻️";
});


// ---------------------------------------------------------------------
// 4. MULAI: tampilkan puzzle & lab saat halaman dibuka
// ---------------------------------------------------------------------
puzzleBaru();
gambarRantai(rantaiLab, dataLab);
pesanLab.textContent = "Ini list awalnya. Ayo bereksperimen! 🔬";
