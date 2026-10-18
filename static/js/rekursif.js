/*
  rekursif.js
  ===========
  Mengatur tampilan & interaksi halaman Rekursif.
  Fungsi rekursif yang asli (hanoi, faktorial, fibonacci) ada di Python (algoritma.py).
  File ini menggambar papan, menerima langkah pemain, dan menganimasikan hasil dari server.

  Fungsi global dari base.html yang dipakai: tampilToast(), hujanKonfeti(), tunggu()
*/

// ---------------------------------------------------------------------
// BAGIAN 1: MENARA HANOI
// ---------------------------------------------------------------------
const NAMA_TIANG = ["A", "B", "C"];
const elTiang = {};   // elemen HTML tiap tiang
NAMA_TIANG.forEach((nama) => (elTiang[nama] = document.getElementById("tiang-" + nama)));

const pilihPiringan = document.getElementById("pilih-piringan");
const infoHanoi = document.getElementById("info-hanoi");
const pesanHanoi = document.getElementById("pesan-hanoi");
const btnHanoiReset = document.getElementById("btn-hanoi-reset");
const btnHanoiSolusi = document.getElementById("btn-hanoi-solusi");

// Isi tiap tiang disimpan sebagai array ukuran piringan, urutan dari BAWAH ke ATAS.
// Contoh 3 piringan di awal: A = [3, 2, 1], B = [], C = []
let tiang = { A: [], B: [], C: [] };
let jumlahPiringan = 3;
let jumlahLangkah = 0;
let tiangDipilih = null;     // tiang asal yang sedang diketuk
let terkunci = false;        // true saat animasi solusi berjalan atau permainan selesai

// Mulai permainan baru: semua piringan menumpuk di tiang A
function mulaiHanoi() {
  jumlahPiringan = parseInt(pilihPiringan.value, 10);
  tiang = { A: [], B: [], C: [] };
  for (let ukuran = jumlahPiringan; ukuran >= 1; ukuran--) tiang.A.push(ukuran);
  jumlahLangkah = 0;
  tiangDipilih = null;
  terkunci = false;
  pesanHanoi.textContent = "Ketuk tiang asal, lalu tiang tujuan. Semangat! 💪";
  gambarHanoi();
}

// Gambar ulang semua tiang beserta piringannya
function gambarHanoi() {
  NAMA_TIANG.forEach((nama) => {
    const el = elTiang[nama];
    el.innerHTML = "";
    tiang[nama].forEach((ukuran) => {
      const piringan = document.createElement("div");
      piringan.className = "piringan";
      piringan.dataset.ukuran = ukuran;     // CSS mengatur lebar & warna dari data-ukuran
      piringan.textContent = ukuran;
      el.appendChild(piringan);
    });
    el.classList.toggle("sorot", nama === tiangDipilih);   // tiang terpilih diberi warna kuning
  });
  const minimal = Math.pow(2, jumlahPiringan) - 1;          // langkah minimal = 2^n - 1
  infoHanoi.textContent = `Langkah: ${jumlahLangkah}  |  Langkah minimal: ${minimal}`;
}

// Aturan Hanoi: boleh pindah kalau tiang tujuan kosong atau piringan teratasnya lebih besar
function bolehPindah(dari, ke) {
  if (tiang[dari].length === 0) return false;
  const atasDari = tiang[dari][tiang[dari].length - 1];
  const atasKe = tiang[ke][tiang[ke].length - 1];
  return atasKe === undefined || atasDari < atasKe;
}

function pindahPiringan(dari, ke) {
  tiang[ke].push(tiang[dari].pop());
  jumlahLangkah++;
}

// Dipanggil saat pemain mengetuk sebuah tiang
function ketukTiang(nama) {
  if (terkunci) return;

  if (tiangDipilih === null) {
    // Ketukan pertama: pilih tiang asal (harus ada piringannya)
    if (tiang[nama].length === 0) {
      tampilToast("Tiang itu masih kosong, pilih tiang yang ada piringannya ya! 😊", "info");
      return;
    }
    tiangDipilih = nama;
  } else if (tiangDipilih === nama) {
    tiangDipilih = null;                         // ketuk tiang yang sama: batal pilih
  } else {
    // Ketukan kedua: coba pindahkan piringan
    if (bolehPindah(tiangDipilih, nama)) {
      pindahPiringan(tiangDipilih, nama);
      pesanHanoi.textContent = "";
      tiangDipilih = null;
      gambarHanoi();
      cekMenang();
      return;
    }
    // Pindah tidak boleh: beri tahu dengan ramah
    tampilToast("Ups, piringan besar tidak boleh di atas yang kecil. Coba tiang lain! 🙂", "salah");
    tiangDipilih = null;
  }
  gambarHanoi();
}

// Menang kalau semua piringan sudah ada di tiang C
function cekMenang() {
  if (tiang.C.length !== jumlahPiringan) return;
  terkunci = true;
  const minimal = Math.pow(2, jumlahPiringan) - 1;
  if (jumlahLangkah === minimal) {
    pesanHanoi.textContent = `Luar biasa! Kamu selesai dengan langkah minimal (${minimal})! 🏆`;
  } else {
    pesanHanoi.textContent = `Berhasil dalam ${jumlahLangkah} langkah! Langkah minimalnya ${minimal}, mau coba lagi? 😉`;
  }
  tampilToast("Yeay, menaranya pindah semua! 🎉", "benar");
  hujanKonfeti();
}

// Tombol "Lihat Solusi": minta langkah dari fungsi rekursif hanoi() di Python, lalu animasikan
async function lihatSolusiHanoi() {
  mulaiHanoi();                   // selalu animasikan dari kondisi awal
  terkunci = true;                // pemain tidak boleh mengetuk selama animasi
  aturTombolHanoi(false);

  try {
    const hasil = await (await fetch("/api/rekursif/hanoi?n=" + jumlahPiringan)).json();
    pesanHanoi.textContent = "Perhatikan caranya, ini hasil fungsi rekursif! 👀";

    for (const langkah of hasil.langkah) {
      pindahPiringan(langkah.dari, langkah.ke);
      tiangDipilih = null;
      gambarHanoi();
      await tunggu(650);
    }
    pesanHanoi.textContent = `Selesai dalam ${hasil.total} langkah. Sekarang coba sendiri, yuk! 🎓`;
  } catch (e) {
    tampilToast("Ups, solusinya belum bisa dimuat. Coba lagi ya! 🙏", "salah");
  }

  aturTombolHanoi(true);
}

function aturTombolHanoi(aktif) {
  btnHanoiReset.disabled = !aktif;
  btnHanoiSolusi.disabled = !aktif;
  pilihPiringan.disabled = !aktif;
}

// Pasang aksi: ketuk tiang, tombol, dan ganti jumlah piringan
NAMA_TIANG.forEach((nama) => elTiang[nama].addEventListener("click", () => ketukTiang(nama)));
btnHanoiReset.addEventListener("click", mulaiHanoi);
btnHanoiSolusi.addEventListener("click", lihatSolusiHanoi);
pilihPiringan.addEventListener("change", mulaiHanoi);


// ---------------------------------------------------------------------
// BAGIAN 2: JEJAK PEMANGGILAN FUNGSI (faktorial & fibonacci)
// ---------------------------------------------------------------------
const pilihJenis = document.getElementById("pilih-jenis");
const inputN = document.getElementById("input-n-rekursi");
const btnJejak = document.getElementById("btn-jejak");
const wadahJejak = document.getElementById("jejak");
const hasilRekursi = document.getElementById("hasil-rekursi");

// Batas n berbeda: fibonacci bercabang banyak sehingga dibatasi lebih kecil
function aturBatasN() {
  const batas = pilihJenis.value === "fibonacci" ? 6 : 8;
  inputN.max = batas;
  if (parseInt(inputN.value, 10) > batas) inputN.value = batas;
}
pilihJenis.addEventListener("change", aturBatasN);

async function lihatJejak() {
  btnJejak.disabled = true;
  wadahJejak.innerHTML = "";
  hasilRekursi.textContent = "";

  try {
    const n = parseInt(inputN.value, 10);
    if (isNaN(n)) {
      tampilToast("Isi angkanya dulu ya! 😊", "info");
      btnJejak.disabled = false;
      return;
    }
    const jenis = pilihJenis.value;
    const hasil = await (await fetch(`/api/rekursif/hitung?jenis=${jenis}&n=${n}`)).json();
    inputN.value = hasil.n;   // tampilkan n yang benar-benar dipakai (kalau tadi dibatasi server)

    // Tampilkan tiap kejadian satu per satu. Makin dalam rekursinya, makin menjorok ke kanan.
    const jeda = jenis === "fibonacci" ? 180 : 350;
    let jumlahPanggilan = 0;
    for (const kejadian of hasil.jejak) {
      const item = document.createElement("div");
      item.className = "jejak-item " + (kejadian.aksi === "panggil" ? "panggil" : "kembali");
      item.style.setProperty("--dalam", kejadian.kedalaman);
      if (kejadian.aksi === "panggil") {
        item.textContent = "📞 Memanggil " + kejadian.teks;
        jumlahPanggilan++;
      } else {
        item.textContent = "✅ " + kejadian.teks;
      }
      wadahJejak.appendChild(item);
      wadahJejak.scrollTop = wadahJejak.scrollHeight;   // gulir otomatis ke bawah
      await tunggu(jeda);
    }

    hasilRekursi.textContent =
      `Hasil ${jenis}(${hasil.n}) = ${hasil.hasil}. Fungsi dipanggil ${jumlahPanggilan} kali! 🎉`;
    hujanKonfeti();
  } catch (e) {
    tampilToast("Ups, ada masalah koneksi. Coba lagi ya! 🙏", "salah");
  }

  btnJejak.disabled = false;
}
btnJejak.addEventListener("click", lihatJejak);


// ---------------------------------------------------------------------
// MULAI: siapkan papan Hanoi saat halaman dibuka
// ---------------------------------------------------------------------
aturBatasN();
mulaiHanoi();
