// Novel contoh (karya orisinal) yang tampil bila GOOGLE_API_KEY belum diatur,
// supaya aplikasi tetap bisa dicoba sebelum terhubung ke Google Drive.

const P = (s) => s.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim());

export const SAMPLE_NOVELS = [
  {
    id: 'contoh-pedang-kabut',
    title: 'Pedang Kabut Lembah Merapi',
    author: 'Contoh', category: 'Cerita Contoh',
    sample: true,
    chapters: [
      {
        id: 'contoh-pedang-kabut-1',
        name: 'Bagian 1 · Pendaki di Tengah Hujan',
        paragraphs: P(`
Hujan turun sejak senja, dan jalan setapak menuju Lembah Merapi berubah menjadi sungai kecil berwarna cokelat. Di bawah pohon randu tua, seorang pemuda berbaju abu-abu duduk memeluk lutut. Sebatang pedang tanpa sarung tersandar di bahunya, bilahnya kusam seperti besi yang lama tak dirawat.

Namanya Arya Seta. Tiga hari lalu ia masih seorang pembantu juru masak di perguruan Kabut Putih. Malam ini ia adalah satu-satunya murid yang lolos ketika api melalap aula utama perguruan itu.

"Kalau kau ingin hidup, jangan pernah menoleh ke belakang," kata gurunya sebelum mendorongnya keluar lewat pintu dapur. Arya menuruti pesan itu. Ia berlari sepanjang malam, menembus hutan jati, menyeberangi dua sungai, dan baru berhenti ketika kakinya tidak lagi mau digerakkan.

Pedang di bahunya bukan miliknya. Pedang itu ia temukan tergeletak di lantai dapur, seolah sengaja diletakkan di sana. Gagangnya dililit kain merah yang sudah pudar, dan pada pangkal bilahnya terukir tiga kata yang hampir tak terbaca: Kabut Menyimpan Jalan.

Dari arah jalan setapak terdengar bunyi lonceng kecil. Arya menahan napas. Seorang lelaki tua bertopi caping muncul dari balik tirai hujan, menuntun seekor keledai yang memikul dua keranjang bambu. Lelaki itu berhenti tepat di depan pohon randu dan menatap pedang di bahu Arya.

"Besi tua itu terlalu berat untuk anak dapur," katanya pelan. "Tapi rupanya ia memilihmu. Bangunlah. Di lembah ini, orang yang duduk terlalu lama di bawah hujan tidak akan pernah bangun lagi."

Arya ingin bertanya bagaimana lelaki itu tahu ia anak dapur, tetapi kerongkongannya kering. Ia hanya mengangguk, berdiri dengan susah payah, lalu mengikuti bunyi lonceng keledai menuju kabut yang semakin tebal.
        `),
      },
      {
        id: 'contoh-pedang-kabut-2',
        name: 'Bagian 2 · Pondok Pembuat Caping',
        paragraphs: P(`
Pondok lelaki tua itu berdiri di tepi jurang, separuh tersembunyi di balik rumpun bambu. Di dalamnya tergantung puluhan caping setengah jadi, dan bau anyaman bambu basah memenuhi udara. Lelaki itu memperkenalkan dirinya sebagai Ki Rumpaka, pembuat caping yang menjual dagangannya di pasar-pasar kaki gunung.

"Pembuat caping tidak tahu nama-nama pedang," kata Arya sambil menghangatkan tangan di dekat tungku.

Ki Rumpaka tertawa kecil. Ia mengambil sebatang bilah bambu, menimbangnya sebentar, lalu mengayunkannya ke arah lilin di atas meja. Nyala lilin itu terbelah dua tanpa padam, satu di kiri dan satu di kanan, sebelum menyatu kembali seperti tak pernah terjadi apa-apa.

"Pembuat caping," katanya, "harus tahu cara membelah tanpa merusak. Itu pelajaran pertama yang akan kau dapat di sini, kalau kau mau tinggal."

Malam itu Arya tidur di atas tikar pandan dengan pedang tua di sampingnya. Dalam mimpinya, kabut putih bergulung-gulung membentuk sosok gurunya, yang menunjuk ke arah puncak gunung tanpa berkata apa-apa.

Pagi harinya, Arya mendapati Ki Rumpaka sudah menunggunya di halaman dengan dua bilah bambu. Matahari belum terbit, dan embun masih menggantung di ujung daun. Pelajaran pertama dimulai.
        `),
      },
    ],
  },
  {
    id: 'contoh-kitab-angin',
    title: 'Kitab Angin Selatan',
    author: 'Contoh', category: 'Cerita Contoh',
    sample: true,
    chapters: [
      {
        id: 'contoh-kitab-angin-1',
        name: 'Bagian 1 · Kedai di Persimpangan',
        paragraphs: P(`
Kedai Bu Lastri tidak pernah sepi pada musim panen tembakau. Para pedagang dari pesisir singgah untuk minum wedang jahe, para kuli angkut tidur di bangku panjang, dan sesekali seorang pendekar berpakaian ringkas datang memesan nasi tanpa banyak bicara.

Siang itu, seorang gadis bercadar hijau masuk dan duduk di sudut paling gelap. Ia memesan teh tawar dan meletakkan sebuah bungkusan kain di atas meja. Bungkusan itu kecil, seukuran kitab saku, tetapi gadis itu tidak melepaskan tangannya dari sana sedetik pun.

Empat lelaki bertubuh besar menyusul tak lama kemudian. Mereka tidak memesan apa-apa. Mereka hanya berdiri di empat penjuru kedai, dan para pengunjung lain mulai bergeser diam-diam ke arah pintu.

"Kitab Angin Selatan bukan milikmu, Nona Sekar," kata salah seorang dari mereka. "Serahkan, dan kau boleh menghabiskan tehmu dengan tenang."

Sekar mengangkat cangkirnya, meniup uap teh perlahan, lalu meminumnya sampai habis. "Teh di kedai ini terlalu enak untuk diminum terburu-buru," katanya. "Sayang sekali kalian tidak memesan."

Detik berikutnya, cangkir kosong itu melesat dari tangannya. Bu Lastri, yang mengintip dari balik tirai dapur, kelak bersumpah bahwa ia hanya melihat bayangan hijau berputar sekali, dan keempat lelaki itu sudah terduduk di lantai dengan wajah pucat, masing-masing memegangi pergelangan tangannya.

Ketika para pengunjung berani menoleh lagi, sudut kedai itu sudah kosong. Di atas meja hanya tersisa sekeping uang perak, cukup untuk membayar teh, nasi, dan sebuah bangku yang patah.
        `),
      },
    ],
  },
  {
    id: 'contoh-pendekar-seruling',
    title: 'Pendekar Seruling Bambu Kuning',
    author: 'Contoh', category: 'Cerita Contoh',
    sample: true,
    chapters: [
      {
        id: 'contoh-seruling-1',
        name: 'Bagian 1 · Nada yang Tertinggal',
        paragraphs: P(`
Setiap bulan purnama, penduduk Desa Watu Gilang mendengar suara seruling dari arah bukit kapur. Nadanya selalu sama, berhenti di tempat yang sama, seolah peniupnya lupa bagian akhir lagu itu.

Rangga, anak penggembala kerbau, adalah satu-satunya yang berani mendaki bukit untuk mencari asal suara itu. Ia menemukan sebuah gua kecil, dan di dalamnya seorang perempuan tua duduk bersila dengan seruling bambu kuning di pangkuannya.

"Kau terlambat dua puluh tahun," kata perempuan itu tanpa membuka mata. "Tapi lebih baik terlambat daripada tidak datang sama sekali. Duduklah, dan dengarkan nada yang tertinggal."
        `),
      },
    ],
  },
];
