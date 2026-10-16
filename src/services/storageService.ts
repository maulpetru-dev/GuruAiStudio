import { LearningProject, LearningPackage, LearningParameters } from '../types/learning';

const STORAGE_KEY = 'guruai_studio_projects_v1';
const ACTIVE_PROJECT_KEY = 'guruai_studio_active_project_id';

// Initial sample project for demonstration (MAN 2 Nganjuk context)
const SAMPLE_PROJECT: LearningProject = {
  id: 'sample-man2-ski-abbasiyah',
  title: 'Modul Ajar SKI: Peradaban Emas Dinasti Abbasiyah (Fase E)',
  createdAt: Date.now() - 86400000 * 2,
  updatedAt: Date.now() - 3600000 * 4,
  version: 1,
  parameters: {
    projectName: 'Peradaban Emas Dinasti Abbasiyah',
    schoolName: 'MAN 2 Nganjuk',
    teacherName: 'Drs. H. Ahmad Fauzi, M.Pd.I.',
    nip: '197508122003121002',
    headmasterName: 'Dr. H. Muh. Kasirin, M.Ag.',
    headmasterNip: '196904151996031001',
    subject: 'Sejarah Kebudayaan Islam (SKI)',
    level: 'Madrasah Aliyah (MA)',
    gradePhase: 'Fase E (Kelas 10)',
    semester: 'Genap',
    topic: 'Faktor Kemajuan Ilmu Pengetahuan Masa Bani Abbasiyah & Nilai Moderasi',
    timeAllocation: '2 x 45 Menit (1 Pertemuan)',
    curriculum: 'Kurikulum Merdeka Kemenag (Integrasi Moderasi)',
    learningObjectives: 'Peserta didik mampu menganalisis faktor internal dan eksternal kemajuan peradaban Islam masa Dinasti Abbasiyah, menghubungkannya dengan semangat literasi modern di madrasah, serta meneladani sikap keterbukaan intelektual para ilmuwan muslim.',
    studentCharacteristics: 'Siswa kelas 10 memiliki ketertarikan tinggi pada diskusi kelompok dan studi kasus visual, kemampuan membaca kritis sedang, membutuhkan jembatan analogi kehidupan masa kini.',
    learningModel: 'Problem Based Learning (PBL)',
    facilities: 'Papan tulis kelas, buku paket SKI Kemenag, proyektor bersama (tanpa kewajiban membawa ponsel siswa)',
    assessmentTypes: 'Asesmen formatif proses kerja kelompok (LKPD), pengamatan karakter toleransi/keilmuan, dan tes sumatif 5 butir soal esai analisis.',
    referenceNotes: 'Buku Siswa SKI Kelas X Kemenag RI, Ensiklopedia Peradaban Islam Baghdad, Baitul Hikmah Archives.',
    specialInstructions: 'Integrasikan Profil Pelajar Rahmatan Lil Alamin (Tasamuh/toleransi berpendapat dan Tathawwur wa Ibtikar/dinamis & inovatif) serta hindari hafalan tanggal semata.'
  },
  package: {
    overview: `A. IDENTITAS MODUL
- Nama Penyusun: Drs. H. Ahmad Fauzi, M.Pd.I.
- Satuan Pendidikan: MAN 2 Nganjuk
- Mata Pelajaran: Sejarah Kebudayaan Islam (SKI)
- Fase / Kelas: Fase E / Kelas X
- Alokasi Waktu: 2 JP (2 x 45 Menit)
- Tahun Ajaran: 2024/2025

B. PROFIL PELAJAR
1. Profil Pelajar Pancasila: Bernalar Kritis, Gotong Royong, Kreatif.
2. Profil Pelajar Rahmatan Lil Alamin (PPRA):
   - Tathawwur wa Ibtikar (Dinamis dan Inovatif dalam mencari ilmu).
   - Tasamuh (Toleransi terhadap perbedaan pandangan intelektual).

C. SARANA DAN PRASARANA
- Papan tulis, spidol warna, lembar cetak LKPD, kertas plano, buku teks SKI Kelas X Kemenag.
- Catatan operasional: Tidak membutuhkan gawai siswa (ramah lingkungan kelas luring penuh).

D. TARGET PESERTA DIDIK & MODEL PEMBELAJARAN
- Sasaran: Siswa reguler kelas X (heterogen).
- Model: Problem Based Learning (PBL) dengan metode Diskusi Kelompok Investigasi dan Presentasi Galeri Belajar (Gallery Walk).`,

    learningObjectivesDetail: `1. CAPAIAN PEMBELAJARAN (CP) ELEMEN PERADABAN ISLAM:
Peserta didik mampu menganalisis dinamika sejarah Islam masa daulah Abbasiyah, mengidentifikasi faktor pendorong kegemilangan peradaban, serta merefleksikan nilai-nilai kejayaan intelektual dalam konteks kebangsaan dan kemanusiaan.

2. ALUR TUJUAN PEMBELAJARAN (ATP) PERTEMUAN INI:
- 10.4.1 Mengidentifikasi minimal 3 faktor kunci lahirnya Gerakan Penerjemahan massal di Baghdad (Baitul Hikmah).
- 10.4.2 Menganalisis keterbukaan para khalifah Abbasiyah terhadap ilmuwan non-muslim dan lintas bangsa sebagai wujud moderasi beragama.
- 10.4.3 Mengontekstualisasikan semangat literasi Abbasiyah dengan gerakan madrasah riset di MAN 2 Nganjuk.

3. KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP):
- Kategori Baru Berkembang: Mampu menyebutkan nama khalifah terkenal (Harun Ar-Rasyid/Al-Ma'mun) namun belum menjelaskan faktor kemajuan.
- Kategori Layak: Mampu menjelaskan minimal 2 faktor pendukung kejayaan Baitul Hikmah.
- Kategori Cakap: Mampu menganalisis sintesis ilmu lintas peradaban (Yunani, Persia, India ke dalam Islam).
- Kategori Mahir: Mampu merumuskan solusi aksi nyata peningkatan budaya membaca dan riset di kelas berdasarkan keteladanan Abbasiyah.`,

    meaningfulUnderstanding: `A. PEMAHAMAN BERMAKNA:
Kemajuan sebuah bangsa atau peradaban tidak diukur semata dari luasnya wilayah kekuasaan atau kekuatan militer, melainkan dari seberapa besar kecintaan bangsa tersebut terhadap ilmu pengetahuan, budaya membaca, dan keterbukaan belajar dari peradaban lain tanpa kehilangan jatidiri keimanan. Baghdad menjadi mercusuar dunia karena memuliakan pena ilmuwan melampaui pedang penakluk.

B. PERTANYAAN PEMANTIK:
1. "Mengapa pada abad ke-8 masehi, ketika bangsa Eropa masih berada dalam masa kegelapan (Dark Ages), kota Baghdad justru dipenuhi ribuan penerjemah dan perpustakaan megah?"
2. "Bila khalifah Al-Ma'mun rela membayar emas seberat buku yang diterjemahkan seorang ilmuwan, apa pesan terpenting bagi generasi pelajar madrasah hari ini?"
3. "Apakah mencari ilmu hanya boleh dari sesama muslim, ataukah umat Islam diajarkan mengambil hikmah kebenaran dari peradaban manapun?"`,

    coreMaterial: `POKOK-POKOK MATERI AJAR: KEGEMILANGAN DINASTI ABBASIYAH

1. Kilas Sejarah Berdirinya Dinasti Abbasiyah (132 H / 750 M)
Kekuasaan berpindah dari Bani Umayyah di Damaskus menuju Bani Abbasiyah dengan pusat pemerintahan di Baghdad. Kota Bundar Baghdad yang dirancang Khalifah Abu Ja'far Al-Manshur berada di titik temu jalur perdagangan sutra internasional.

2. Tiga Pilar Utama Masa Keemasan (The Golden Age)
a. Stabilitas Politik dan Kesejahteraan Rakyat: Terciptanya rasa aman pada masa Khalifah Harun Ar-Rasyid (786-809 M).
b. Lembaga Riset & Perpustakaan Baitul Hikmah: Didirikan oleh Al-Ma'mun (813-833 M) bukan sekadar tempat menyimpan buku, melainkan pusat riset, laboratorium astronomi, dan observatorium ilmiah internasional.
c. Gerakan Penerjemahan Akbar: Ribuan naskah kedokteran, filsafat, astronomi, dan matematika dari Yunani, India, dan Persia dialihbahasakan ke bahasa Arab.

3. Tokoh Ilmuwan Muslim Multidisiplin:
- Al-Khawarizmi: Penemu Aljabar dan konsep Angka Nol (Algoritma).
- Ibnu Sina (Avicenna): Bapak kedokteran modern penulis Al-Qanun fi at-Tibb.
- Al-Kindi & Al-Farabi: Filsuf muslim peletak dasar integrasi akal dan wahyu.

4. Nilai Karakter Moderasi Beragama (Rahmatan Lil Alamin):
Para khalifah mempekerjakan penerjemah Kristen Syiria (seperti Hunain bin Ishaq) dan cendekiawan lintas etnis dengan penghormatan tinggi. Kebenaran ilmiah dihargai sebagai titipan Ilahi yang wajib dipelajari siapapun.`,

    learningActivities: `A. KEGIATAN PENDAHULUAN (15 MENIT)
1. Guru mengucap salam islami, berdoa bersama dipimpin ketua kelas, dan mengecek kehadiran serta kebersihan ruang kelas.
2. Apersepsi: Guru memperlihatkan replika/gambar naskah kuno bertulisan arab dan bertanya: "Berapa banyak dari kalian yang tahu bahwa smartphone yang kita gunakan berakar dari algoritma Al-Khawarizmi pada era Abbasiyah?"
3. Guru menyampaikan Tujuan Pembelajaran hari ini dan skenario aktivitas kelompok.

B. KEGIATAN INTI (60 MENIT) - SINTAKS PROBLEM BASED LEARNING
- Tahap 1: Orientasi Siswa pada Masalah (10 Menit)
  Guru menempelkan artikel kasus di papan tulis: "Kesenjangan Minat Baca Pelajar Saat Ini Dibandingkan Antusiasme Pemuda Baghdad Abad ke-9". Siswa mengamati fenomena ini.
- Tahap 2: Mengorganisasikan Siswa untuk Belajar (10 Menit)
  Siswa dibagi menjadi 4 kelompok heterogen (Kelompok Baitul Hikmah, Kelompok Aljabar, Kelompok Kedokteran, Kelompok Astronomi). Guru membagikan lembar cetak LKPD.
- Tahap 3: Membimbing Penyelidikan Mandiri & Kelompok (15 Menit)
  Kelompok mengeksplorasi buku ajar: menganalisis 3 faktor utama kemajuan Abbasiyah dan merumuskan argumen mengapa tradisi literasi itu bisa redup jika tidak dijaga.
- Tahap 4: Mengembangkan dan Menyajikan Hasil Karya (15 Menit)
  Tiap kelompok menuliskan 3 kesimpulan kunci pada kertas LKPD dan menempelkannya di dinding kelas (Metode Gallery Walk). Dua perwakilan kelompok berjaga, dua lainnya berkeliling memberi tanggapan.
- Tahap 5: Menganalisis & Mengevaluasi Proses Pemecahan Masalah (10 Menit)
  Guru memandu pleno kelas, meluruskan miskonsepsi, dan memberikan penguatan nilai moderasi dan kegigihan ilmuwan.

C. KEGIATAN PENUTUP (15 MENIT)
1. Siswa bersama guru merangkum benang merah pembelajaran.
2. Refleksi singkat: Siswa menuliskan satu komitmen belajar di selembar kertas memo.
3. Guru menyampaikan rencana materi pertemuan berikutnya (Kemunduran Abbasiyah dan Perang Salib).
4. Doa penutup majelis (Kafaratul Majelis) dan salam.`,

    studentWorksheet: `LEMBAR KERJA PESERTA DIDIK (LKPD) TERPADU
Mata Pelajaran: Sejarah Kebudayaan Islam | Kelas X MAN 2 Nganjuk
Topik Investigasi: "Menyingkap Rahasia Golden Age Baghdad & Refleksi Literasi Madrasah"

Nama Kelompok: ___________________________
Anggota Kelompok:
1. ___________________________ (Ketua)
2. ___________________________ (Notulis)
3. ___________________________
4. ___________________________

STIMULUS KASUS:
Khalifah Al-Ma'mun pernah bermimpi bertemu Aristoteles. Setelah dialog filosofis dalam mimpinya, beliau memutuskan mengutus kafilah dagang ke Romawi khusus untuk mencari naskah-naskah kuno, kemudian menerjemahkannya di Baitul Hikmah. Penerjemah dibayar emas murni setara berat timbangan buku yang diterjemahkan.

PETUNJUK INVESTIGASI:
1. Bacalah materi Bab Abbasiyah pada buku teks halaman 45-52 secara seksama.
2. Diskusikan secara santun dalam kelompok untuk menjawab 3 pertanyaan analisis berikut:

PERTANYAAN ANALISIS:
Tugas 1: Sebutkan 3 faktor utama yang menyebabkan gerakan literasi di Baghdad begitu masif dan didukung penuh oleh pemerintah daulah!
Jawaban Kelompok:
_______________________________________________________________________________
_______________________________________________________________________________

Tugas 2: Baitul Hikmah melibatkan cendekiawan dari berbagai latar belakang suku dan agama (Arab, Persia, Kristen Nestorian, Yahudi). Nilai karakter apakah yang tercermin dari kebijakan khalifah ini? Mengapa sikap ini relevan bagi pelajar Indonesia hari ini?
Jawaban Kelompok:
_______________________________________________________________________________
_______________________________________________________________________________

Tugas 3: Buatlah 1 program aksi nyata sederhana bertajuk "Baitul Hikmah Mini" yang bisa kalian terapkan di pojok baca kelas X madrasah kalian!
Jawaban Kelompok:
_______________________________________________________________________________
_______________________________________________________________________________`,

    assessmentPlan: `RENCANA ASESMEN PEMBELAJARAN (ASSESSMENT FOR, AS, AND OF LEARNING)

Tabel Matriks Rancangan Asesmen:

| Jenis Asesmen | Teknik Penilaian | Bentuk Instrumen | Waktu Pelaksanaan |
|---|---|---|---|
| 1. Diagnostik Awal | Tes lisan apersepsi | Tanya jawab pemantik kesiapan kognitif & non-kognitif | Awal pertemuan (5 menit) |
| 2. Formatif (Proses) | Observasi unjuk kerja | Lembar observasi diskusi & ceklis LKPD kelompok | Saat sintaks Problem Based Learning |
| 3. Sumatif (Lingkup Materi) | Tes tertulis esai | 5 butir soal penalaran C2 - C4 berjenjang | Akhir bab pembelajaran |

PENJELASAN OPERASIONAL:

1. ASESMEN DIAGNOSTIK AWAL (NON-KOGNITIF & KOGNITIF):
- Teknik: Tanya jawab lisan di 5 menit pertama apersepsi.
- Indikator: Mengetahui pemahaman awal siswa tentang kota Baghdad dan tokoh Al-Khawarizmi serta kesiapan mental belajar.

2. ASESMEN FORMATIF (SELAMA PROSES PEMBELAJARAN):
- Teknik: Observasi penilaian unjuk kerja diskusi kelompok dan telaah LKPD.
- Instrumen: Lembar ceklis partisipasi aktif, kemampuan bernalar kritis, dan sikap tasamuh (menghargai pendapat teman dalam kelompok).

3. ASESMEN SUMATIF (AKHIR CAPAIAN LINGKUP MATERI):
- Teknik: Tes tertulis 5 butir soal esai analitis bernalar tingkat tinggi (C3 - C4).
- Bentuk: Ujian harian tertulis dengan pembobotan skor berbasis kriteria rubrik.`,

    questionsAndAnswers: `SOAL EVALUASI, KUNCI JAWABAN & PEMBAHASAN MENDALAM

SOAL 1 (Tingkat Kognitif: C2 - Pemahaman)
Sebutkan nama lembaga riset dan penerjemahan terkenal yang didirikan pada masa Dinasti Abbasiyah di Baghdad dan jelaskan fungsi utamanya!
KUNCI JAWABAN:
Baitul Hikmah (House of Wisdom).
PEMBAHASAN:
Didirikan perintisannya oleh Harun Ar-Rasyid dan dikembangkan secara optimal oleh Al-Ma'mun. Lembaga ini berfungsi ganda: sebagai perpustakaan besar, akademi penerjemahan naskah asing ke bahasa Arab, dan balai riset/observatorium ilmiah.

SOAL 2 (Tingkat Kognitif: C4 - Analisis Kontekstual)
Mengapa keterlibatan penerjemah lintas agama dan etnis (seperti Hunain bin Ishaq yang beragama Kristen) dalam proyek Baitul Hikmah dapat dipandang sebagai teladan moderasi beragama tingkat tinggi?
KUNCI JAWABAN:
Karena para khalifah Abbasiyah memandang ilmu pengetahuan sebagai warisan universal umat manusia yang melampaui sekat sektarian.
PEMBAHASAN:
Khalifah tidak membeda-bedakan keyakinan para pakar bahasa dan sains. Yang dinilai adalah kompetensi, integritas, dan kontribusi ilmiah mereka. Hal ini mencerminkan prinsip Rahmatan Lil Alamin bahwa hikmah dan ilmu milik orang beriman di manapun menemukannya.

SOAL 3 (Tingkat Kognitif: C4 - Evaluasi/Aplikasi)
Bagaimanakah penemuan angka nol dan aljabar oleh Al-Khawarizmi pada era Abbasiyah mengubah peradaban sains dunia hingga era teknologi komputer saat ini?
KUNCI JAWABAN:
Angka nol memungkinkan penulisan sistem desimal dan bilangan biner (0 dan 1) yang menjadi fondasi bahasa mesin komputasi dan kecerdasan buatan modern.
PEMBAHASAN:
Tanpa konsep nol dan aljabar sistematik, operasi matematika tingkat tinggi, kalkulus, dan sains fisika kuantum tidak akan dapat berkembang seperti sekarang.

SOAL 4 (Tingkat Kognitif: C3 - Sintesis)
Jelaskan hubungan antara kemakmuran ekonomi jalur perdagangan Baghdad dengan pesatnya perkembangan ilmu pengetahuan di masa keemasan Abbasiyah!
KUNCI JAWABAN:
Kemakmuran ekonomi menyediakan dana kas negara (baitul mal) yang melimpah untuk mendanai riset, menggaji ilmuwan secara terhormat, dan mendirikan fasilitas pendidikan bebas biaya bagi pelajar.
PEMBAHASAN:
Sains membutuhkan ekosistem pendanaan yang stabil. Khalifah dapat mendanai ekspedisi perburuan manuskrip karena pendapatan pajak niaga Baghdad sangat tinggi.

SOAL 5 (Tingkat Kognitif: C4 - Refleksi Pelajar)
Jika kamu menjadi ketua kelas di MAN 2 Nganjuk, langkah realistis apa yang akan kamu adopsi dari etos belajar ilmuwan Abbasiyah untuk memajukan literasi teman sekelasmu tanpa bergantung pada internet?
KUNCI JAWABAN:
Membuat sistem barter buku mingguan, membentuk kelompok studi telaah bab buku paket secara bergiliran, dan menulis resume intisari buku pada mading kelas.
PEMBAHASAN:
Ilmuwan Abbasiyah mengandalkan naskah fisik dan diskusi tatap muka (halaqah). Ketiadaan internet justru dapat dimanfaatkan untuk melatih konsentrasi membaca mendalam (deep reading).`,

    scoringRubric: `RUBRIK PENILAIAN AUTENTIK PEMBELAJARAN

Tabel 1: Rubrik Kinerja Diskusi & Presentasi LKPD

| Aspek Penilaian | Skor 1 (Perlu Bimbingan) | Skor 2 (Cukup) | Skor 3 (Baik) | Skor 4 (Sangat Baik) |
|---|---|---|---|---|
| 1. Partisipasi Kelompok | Pasif, tidak berpendapat | Ikut serta hanya jika ditunjuk teman | Aktif berpendapat dan membantu rekan | Proaktif memimpin, memfasilitasi rekan |
| 2. Kedalaman Analisis Fakta | Jawaban hanya menyalin tanpa urut | Menyebutkan fakta tapi belum analitis | Analisis logis sesuai teks materi ajar | Analisis mendalam, mengaitkan realita kini |
| 3. Sikap Tasamuh (Toleransi) | Memotong pembicaraan atau mendominasi | Menerima pendapat dengan enggan | Mendengar aktif dan merespons santun | Menghargai perbedaan, membangun mufakat |
| 4. Komunikasi Lisan Presentasi | Suara tidak terdengar dan tidak percaya diri | Menjelaskan terbata-bata membaca lembar | Runtut, artikulatif, kontak mata baik | Sangat percaya diri, runtut, intonasi pas |

Pedoman Penilaian:
Nilai Akhir = (Total Skor Perolehan / Skor Maksimal 16) x 100
Interval Predikat:
- 88 - 100: Sangat Baik (A)
- 76 - 87 : Baik (B)
- 65 - 75 : Cukup (C)
- < 65    : Perlu Bimbingan Remedial (D)`,

    presentationOutline: `RANCANGAN BAHAN PRESENTASI (OUTLINE SLIDE GURU)

SLIDE 1: JUDUL & PEMBUKA
- Teks Utama: "Kejayaan Intelektual Dinasti Abbasiyah: Mercusuar Peradaban Dunia"
- Subteks: Kelas X Sejarah Kebudayaan Islam - MAN 2 Nganjuk
- Visual Guru: Peta jalur sutra kuno dan ilustrasi gerbang Kota Bundar Baghdad.

SLIDE 2: PERTANYAAN PEMANTIK
- Poin Teks: "Tahukah kalian? Di saat Eropa belum mengenal universitas, Baghdad sudah memiliki 100 toko buku dan akademi sains terbesar di dunia!"
- Tindakan Guru: Berikan jeda 1 menit, minta 2 siswa menebak alasannya.

SLIDE 3: BAGAIMANA BANI ABBASIYAH MENCAPAI MASA EMAS?
- Tiga Kunci Sukses:
  1. Stabilitas keamanan & kemakmuran Baghdad.
  2. Apresiasi tertinggi khalifah terhadap ilmuwan (gaji emas).
  3. Keterbukaan mempelajari sains bangsa lain (universalitas ilmu).

SLIDE 4: BAITUL HIKMAH (RUMAH KEBIJAKSANAAN)
- Poin: Bukan sekadar perpustakaan, melainkan pusat translasi dunia.
- Tokoh Kunci: Khalifah Harun Ar-Rasyid & Al-Ma'mun.
- Nilai Karakter: Menghargai ilmuwan tanpa memandang latar belakang suku atau agama.

SLIDE 5: ILMUWAN DAN WARISAN SAINS
- Al-Khawarizmi: Penemu Aljabar dan Algoritma.
- Ibnu Sina: Peletak standar kedokteran klinis.
- Al-Battani: Pengukur durasi 1 tahun bumi paling presisi di zamannya.

SLIDE 6: INSTRUKSI MISI LKPD KELOMPOK
- Pembagian 4 Kelompok Investigasi.
- Waktu Eksplorasi: 20 Menit.
- Target Output: Lembar Diskusi dan Pameran Galeri Belajar (Gallery Walk).

SLIDE 7: KESIMPULAN KELAS
- Ilmu pengetahuan adalah bahasa universal kemanusiaan.
- Moderasi beragama (Tasamuh) membuka pintu inovasi tanpa batas.
- Literasi dimulai dari niat tulus membaca dan mencari kebenaran.

SLIDE 8: REFLEKSI AKHIR & PENUTUP
- Pertanyaan Refleksi: "Apa satu tindakan literasi yang akan kamu mulai hari ini?"
- Quote Penutup: 'Tinta seorang ulama/ilmuwan lebih suci daripada darah para martir.'`,

    reflectionAndFollowUp: `INSTRUMEN REFLEKSI & PROGRAM TINDAK LANJUT

A. INSTRUMEN REFLEKSI GURU:
1. Apakah seluruh sintaks Problem Based Learning terlaksana sesuai alokasi waktu 90 menit?
2. Bagaimana antusiasme siswa saat kegiatan Gallery Walk LKPD? Apakah metode tanpa ponsel tetap menarik bagi mereka?
3. Bagian manakah dari materi Abbasiyah yang paling membutuhkan penegasan ulang pada pertemuan selanjutnya?

B. INSTRUMEN REFLEKSI PESERTA DIDIK:
(Dibagikan dalam kertas kecil di 5 menit terakhir)
1. "Hal baru apa yang paling membuatmu kagum tentang peradaban Islam di Baghdad hari ini?"
2. "Sikap positif apakah yang ingin kamu tiru dari ilmuwan muslim zaman Abbasiyah dalam belajarmu?"
3. "Apakah instruksi dalam LKPD tadi mudah kamu pahami bersama kelompokmu?"

C. PROGRAM REMEDIAL (BAGI SISWA BELUM TUNTAS KKTP):
- Sasaran: Siswa yang belum mampu menjelaskan faktor kemajuan Dinasti Abbasiyah.
- Bentuk Bimbingan: Tutor sebaya dengan teman sekelompok yang telah tuntas, didampingi resume 1 lembar intisari tokoh Al-Khawarizmi dan Baitul Hikmah.
- Evaluasi Ulang: Menjawab 2 soal analisis ringkas secara lisan dengan bimbingan langsung guru.

D. PROGRAM PENGAYAAN (BAGI SISWA TUNTAS MAHIR):
- Sasaran: Siswa dengan capaian di atas KKTP (Skor > 85).
- Bentuk Tantangan: Membuat artikel opini 300 kata tentang "Bagaimana MAN 2 Nganjuk dapat Menghidupkan Spirit Baitul Hikmah di Era Kecerdasan Buatan (AI)".`
  }
};

class StorageService {
  private projects: LearningProject[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.projects = JSON.parse(data);
        const sampleIdx = this.projects.findIndex((p) => p.id === SAMPLE_PROJECT.id);
        if (
          sampleIdx !== -1 &&
          (!this.projects[sampleIdx].package.scoringRubric?.includes('|---|') ||
            !this.projects[sampleIdx].package.assessmentPlan?.includes('|---|'))
        ) {
          this.projects[sampleIdx] = { ...SAMPLE_PROJECT };
          this.saveToStorage();
        }
      } else {
        // Seed with sample project
        this.projects = [{ ...SAMPLE_PROJECT }];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to parse projects from localStorage:', e);
      this.projects = [{ ...SAMPLE_PROJECT }];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
  }

  public getAllProjects(): LearningProject[] {
    return [...this.projects].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getProjectById(id: string): LearningProject | undefined {
    return this.projects.find((p) => p.id === id);
  }

  public getActiveProjectId(): string | null {
    const id = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (id && this.projects.some((p) => p.id === id)) {
      return id;
    }
    return this.projects.length > 0 ? this.projects[0].id : null;
  }

  public setActiveProjectId(id: string) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }

  public saveProject(project: LearningProject): LearningProject {
    const index = this.projects.findIndex((p) => p.id === project.id);
    const updated = {
      ...project,
      updatedAt: Date.now(),
      version: (project.version || 1) + 1,
    };

    if (index >= 0) {
      this.projects[index] = updated;
    } else {
      this.projects.unshift(updated);
    }

    this.saveToStorage();
    this.setActiveProjectId(updated.id);
    return updated;
  }

  public createNewProject(parameters: LearningParameters, pkg: LearningPackage): LearningProject {
    const newProject: LearningProject = {
      id: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: parameters.projectName || `${parameters.subject}: ${parameters.topic}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      parameters,
      package: pkg,
    };

    this.projects.unshift(newProject);
    this.saveToStorage();
    this.setActiveProjectId(newProject.id);
    return newProject;
  }

  public updateProjectSection(
    projectId: string,
    sectionKey: keyof LearningPackage,
    content: string
  ): LearningProject | null {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    project.package[sectionKey] = content;
    project.updatedAt = Date.now();
    project.version = (project.version || 1) + 1;

    this.saveToStorage();
    return project;
  }

  public updateProjectTitle(projectId: string, newTitle: string): boolean {
    const project = this.getProjectById(projectId);
    if (!project) return false;
    project.title = newTitle;
    project.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  public deleteProject(projectId: string): boolean {
    const index = this.projects.findIndex((p) => p.id === projectId);
    if (index === -1) return false;

    this.projects.splice(index, 1);
    this.saveToStorage();

    if (this.getActiveProjectId() === projectId) {
      if (this.projects.length > 0) {
        this.setActiveProjectId(this.projects[0].id);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
    }
    return true;
  }

  public exportBackupJson(): string {
    return JSON.stringify(
      {
        app: 'GuruAI Studio',
        version: '0.1',
        exportedAt: new Date().toISOString(),
        projects: this.projects,
      },
      null,
      2
    );
  }

  public importBackupJson(jsonString: string): { success: boolean; count: number; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.projects)) {
        return { success: false, count: 0, message: 'Format berkas cadangan JSON tidak valid.' };
      }

      let imported = 0;
      for (const p of parsed.projects) {
        if (p.id && p.parameters && p.package) {
          const existingIdx = this.projects.findIndex((item) => item.id === p.id);
          if (existingIdx >= 0) {
            this.projects[existingIdx] = p;
          } else {
            this.projects.push(p);
          }
          imported++;
        }
      }

      this.saveToStorage();
      return { success: true, count: imported, message: `Berhasil mengimpor ${imported} proyek perangkat pembelajaran.` };
    } catch (e: any) {
      return { success: false, count: 0, message: 'Gagal membaca berkas: ' + (e?.message || 'Format tidak dikenal') };
    }
  }
}

export const storageService = new StorageService();
