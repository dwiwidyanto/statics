export interface TopicSection {
  id: string;
  title: string;
  titleId?: string;
  summary: string;
  summaryId?: string;
  contentMarkdown: string;
  contentMarkdownId?: string;
}

export const staticsTopics: TopicSection[] = [
  {
    id: 'intro-to-statics',
    title: '1. Introduction to Statics',
    titleId: '1. Pengantar Statika',
    summary: 'What is statics and why does it matter in engineering?',
    summaryId: 'Apa itu statika dan mengapa itu penting dalam teknik?',
    contentMarkdown: `
### What is Statics?
**Statics** is the branch of mechanics that addresses bodies at rest or moving at a constant velocity. In either state, the acceleration of the body is exactly zero:
$$\\vec{a} = 0, \\quad \\vec{\\alpha} = 0$$

According to Newton's Second Law ($F = ma$), this means the sum of all external forces and moments acting on the system is zero.

### Why is Statics Important?
Statics is the foundation for analyzing structures such as:
- Bridges
- Buildings
- Trusses
- Machine elements

Before you can calculate if a steel beam will bend or break (Mechanics of Materials) or design its dimensions, you must calculate the **forces acting on it**.

### The Rigid Body Assumption
In introductory statics, we assume bodies are **perfectly rigid**. This means they do not deform (stretch, bend, or twist) under applied loads. In reality, all materials deform slightly, but for determining support reactions, the rigid-body assumption is a highly accurate simplification.
`,
    contentMarkdownId: `
### Apa itu Statika?
**Statika** adalah cabang mekanika yang membahas benda-benda yang diam atau bergerak dengan kecepatan konstan. Dalam keadaan ini, percepatan benda adalah nol:
$$\\vec{a} = 0, \\quad \\vec{\\alpha} = 0$$

Menurut Hukum Kedua Newton ($F = ma$), ini berarti jumlah semua gaya dan momen luar yang bekerja pada sistem adalah nol.

### Mengapa Statika Penting?
Statika adalah dasar untuk menganalisis struktur seperti:
- Jembatan
- Gedung
- Rangka Batang (Truss)
- Elemen Mesin

Sebelum Anda dapat menghitung apakah balok baja akan melentur atau patah (Mekanika Bahan) atau merancang dimensinya, Anda harus terlebih dahulu menghitung **gaya-gaya yang bekerja padanya**.

### Asumsi Benda Tegar
Dalam statika dasar, kita mengasumsikan benda **benar-benar tegar**. Ini berarti benda tidak mengalami deformasi (regang, lentur, atau puntir) di bawah beban yang diterapkan. Pada kenyataannya, semua bahan berdeformasi sedikit, tetapi untuk menentukan reaksi tumpuan, asumsi benda tegar adalah penyederhanaan yang sangat akurat.
`
  },
  {
    id: 'fbd-basics',
    title: '2. Free-Body Diagrams (FBD)',
    titleId: '2. Diagram Benda Bebas (FBD)',
    summary: 'The most important tool in engineering mechanics.',
    summaryId: 'Alat paling penting dalam mekanika teknik.',
    contentMarkdown: `
### What is a Free-Body Diagram?
A **Free-Body Diagram (FBD)** is a graphical sketch used by engineers to visualize the forces and moments acting on a body. It is "free" because the body is isolated from its surroundings, with all contact points replaced by equivalent forces and moments.

### Essential Steps to Draw an FBD:
1. **Isolate the Body**: Draw the outline of the body alone, removed from the ground, walls, or other connected components.
2. **Add Active Forces**: Place all known external loads acting on the body (e.g., gravity/weight, applied point forces, distributed loads, applied moments).
3. **Add Reactive Forces (Reactions)**: At every location where the body was touching a support, draw the unknown reaction forces and moments that prevent the body from moving.
4. **Define a Coordinate System**: Explicitly draw an $x$-$y$ axis to define positive directions (usually $+x$ right, $+y$ up, $+M$ counter-clockwise).
5. **Label Everything**: Use letters (e.g., $F_1$, $w$, $M$) and angles to label all loads, and support symbols (e.g., $R_{Ax}$, $R_{Ay}$) for reactions.

> [!IMPORTANT]
> **Common Student Mistake:** Forgetting to draw reaction forces, or drawing them in directions that the support cannot actually resist (e.g., drawing a moment reaction on a pin joint).
`,
    contentMarkdownId: `
### Apa itu Diagram Benda Bebas?
**Diagram Benda Bebas (FBD)** adalah sketsa grafis yang digunakan oleh insinyur untuk memvisualisasikan gaya dan momen yang bekerja pada suatu benda. FBD disebut "bebas" karena benda diisolasi dari lingkungannya, dengan semua titik kontak digantikan oleh gaya dan momen ekivalen.

### Langkah-langkah Penting untuk Menggambar FBD:
1. **Isolasi Benda**: Gambar garis luar benda saja, dilepaskan dari tanah, dinding, atau komponen lain yang terhubung.
2. **Tambahkan Gaya Aktif**: Tempatkan semua beban luar yang diketahui bekerja pada benda (misalnya gaya berat, gaya terpusat yang diterapkan, beban merata, momen yang diterapkan).
3. **Tambahkan Gaya Reaktif (Reaksi)**: Di setiap lokasi di mana benda menyentuh tumpuan, gambarlah gaya dan momen reaksi yang tidak diketahui yang mencegah benda bergerak.
4. **Tentukan Sistem Koordinat**: Gambarlah sumbu $x$-$y$ secara jelas untuk menentukan arah positif (biasanya $+x$ ke kanan, $+y$ ke atas, $+M$ berlawanan arah jarum jam).
5. **Beri Label Semuanya**: Gunakan huruf (misalnya $F_1$, $w$, $M$) dan sudut untuk melabeli semua beban, serta simbol tumpuan (misalnya $R_{Ax}$, $R_{Ay}$) untuk reaksi.

> [!IMPORTANT]
> **Kesalahan Umum Mahasiswa:** Lupa menggambar gaya reaksi, atau menggambarnya ke arah yang tidak dapat ditahan oleh tumpuan tersebut (misalnya menggambar reaksi momen pada tumpuan sendi).
`
  },
  {
    id: 'supports-and-reactions',
    title: '3. Supports and Reactions',
    titleId: '3. Tumpuan dan Reaksi',
    summary: 'How supports restrict movement and create reaction forces.',
    summaryId: 'Bagaimana tumpuan membatasi gerakan dan menciptakan gaya reaksi.',
    contentMarkdown: `
### Support Reactions Concept
A support restricts the motion of a body. According to Newton's Third Law (action-reaction), if a support prevents a body from translating or rotating in a certain direction, it must exert a force or moment on the body in that direction.

| Support Type | Diagram Symbol | Allowed Motion | Restrained Motion (Reactions) | Number of Unknowns |
| :--- | :---: | :--- | :--- | :---: |
| **Roller** | Triangle with wheels / circle | Translation along surface, rotation | Translation normal to surface (Force perpendicular to roller surface) | **1** ($R_y$ or $R_x$) |
| **Pin / Hinge** | Triangle pinned to ground | Rotation only | Horizontal and Vertical translation (Force in X and Y) | **2** ($R_x$, $R_y$) |
| **Fixed Support** | Beam embedded in wall | None | Translation in X and Y, and rotation (Forces in X and Y, and Moment $M$) | **3** ($R_x$, $R_y$, $M$) |

### Details:
- **Roller Support:** Allows the structure to expand/contract horizontally (e.g., due to temperature shifts) without creating stress. It only supports vertical loads (if resting on a horizontal floor).
- **Pin Support:** Connects a member allowing it to hinge freely. It prevents it from lifting or sliding but cannot prevent it from pivoting.
- **Fixed Support:** Represents a member welded or deeply bolted into a wall. It resists translation and prevents rotation completely.
`,
    contentMarkdownId: `
### Konsep Reaksi Tumpuan
Tumpuan membatasi gerakan suatu benda. Menurut Hukum Ketiga Newton (aksi-reaksi), jika tumpuan mencegah benda bertranslasi atau berotasi ke arah tertentu, tumpuan tersebut harus memberikan gaya atau momen pada benda ke arah tersebut.

| Jenis Tumpuan | Simbol Diagram | Gerakan Diizinkan | Gerakan Ditahan (Reaksi) | Jumlah Unknown |
| :--- | :---: | :--- | :--- | :---: |
| **Rol (Roller)** | Segitiga dengan roda | Translasi sepanjang permukaan, rotasi | Translasi tegak lurus permukaan (Gaya tegak lurus permukaan rol) | **1** ($R_y$ atau $R_x$) |
| **Sendi / Engsel** | Segitiga menempel tanah | Rotasi saja | Translasi horizontal dan vertikal (Gaya di X dan Y) | **2** ($R_x$, $R_y$) |
| **Jepit (Fixed)** | Balok tertanam di dinding | Tidak ada | Translasi di X dan Y, serta rotasi (Gaya di X dan Y, dan Momen $M$) | **3** ($R_x$, $R_y$, $M$) |

### Rincian:
- **Tumpuan Rol:** Memungkinkan struktur memuai/menyusut secara horizontal (misalnya karena perubahan suhu) tanpa menimbulkan tegangan internal. Tumpuan ini hanya menahan beban vertikal (jika terletak di lantai horizontal).
- **Tumpuan Sendi:** Menghubungkan batang untuk berputar bebas. Tumpuan ini mencegah batang terangkat atau bergeser tetapi tidak dapat mencegahnya berputar.
- **Tumpuan Jepit:** Mewakili batang yang dilas atau ditanam dalam ke dinding. Tumpuan ini menahan translasi dan mencegah rotasi sepenuhnya.
`
  },
  {
    id: 'equilibrium-equations',
    title: '4. Equilibrium Equations',
    titleId: '4. Persamaan Kesetimbangan',
    summary: 'The three equations that govern 2D rigid-body statics.',
    summaryId: 'Tiga persamaan yang mengatur statika benda tegar 2D.',
    contentMarkdown: `
### The Equations of Equilibrium
For a 2D planar system, there are three independent equations of equilibrium. These assert that the body does not translate horizontally, does not translate vertically, and does not rotate:

$$\\sum F_x = 0$$
$$\\sum F_y = 0$$
$$\\sum M_P = 0$$

Where $M_P$ represents the sum of moments about any arbitrary pivot point $P$ in space.

### Resolving Forces into Components
To use the force equations, you must resolve angled forces into horizontal and vertical components:
- $F_x = F \\cdot \\cos(\\theta)$
- $F_y = F \\cdot \\sin(\\theta)$

### Moment of a Force
The moment measures the tendency of a force to rotate a body about a pivot point $P$.
- Magnitude: $M_P = F \\cdot d$, where $d$ is the perpendicular distance (moment arm) from $P$ to the line of action of the force.
- Sign Convention: Counter-Clockwise (CCW) is positive ($+$), Clockwise (CW) is negative ($-$).
- In coordinate math:
  $$M_P = (x_F - x_P) F_y - (y_F - y_P) F_x$$

> [!TIP]
> **Solving Strategy:** When writing the moment equation $\\sum M_P = 0$, choose a pivot point $P$ where the lines of action of as many unknown reaction forces as possible intersect. This eliminates those unknowns from the equation, letting you solve for the remaining reactions directly!
`,
    contentMarkdownId: `
### Persamaan Kesetimbangan
Untuk sistem planar 2D, terdapat tiga persamaan kesetimbangan independen. Persamaan ini menegaskan bahwa benda tidak bertranslasi secara horizontal, tidak bertranslasi secara vertikal, dan tidak berotasi:

$$\\sum F_x = 0$$
$$\\sum F_y = 0$$
$$\\sum M_P = 0$$

Di mana $M_P$ mewakili jumlah momen terhadap titik pusat sembarang $P$ di dalam ruang.

### Menguraikan Gaya Menjadi Komponen
Untuk menggunakan persamaan gaya, Anda harus menguraikan gaya miring menjadi komponen horizontal dan vertikal:
- $F_x = F \\cdot \\cos(\\theta)$
- $F_y = F \\cdot \\sin(\\theta)$

### Momen Gaya
Momen mengukur kecenderungan suatu gaya untuk memutar benda di sekitar titik pusat $P$.
- Besar Momen: $M_P = F \\cdot d$, di mana $d$ adalah jarak tegak lurus (lengan momen) dari $P$ ke garis kerja gaya.
- Konvensi Tanda: Berlawanan Arah Jarum Jam (CCW) adalah positif ($+$), Searah Jarum Jam (CW) adalah negatif ($-$).
- Dalam matematika koordinat:
  $$M_P = (x_F - x_P) F_y - (y_F - y_P) F_x$$

> [!TIP]
> **Strategi Penyelesaian:** Saat menulis persamaan momen $\\sum M_P = 0$, pilihlah titik pusat $P$ di mana garis kerja gaya reaksi yang tidak diketahui sebanyak mungkin saling berpotongan. Ini akan mengeliminasi variabel-variabel tersebut dari persamaan, sehingga Anda dapat langsung menghitung reaksi lainnya!
`
  },
  {
    id: 'determinacy-stability',
    title: '5. Determinacy & Static Stability',
    titleId: '5. Determinasi & Stabilitas Statis',
    summary: 'Classifying systems based on reactions and constraints.',
    summaryId: 'Mengklasifikasikan sistem berdasarkan reaksi dan batasan.',
    contentMarkdown: `
### Classification of Planar Structures
Let $r$ be the number of unknown support reactions.
Let $n$ be the number of equations of equilibrium available (for a single rigid body, $n = 3$).

#### 1. Unstable ($r < 3$)
If there are fewer than 3 reactions, the structure is **under-restrained** and will move when load is applied.
- Example: A beam supported by only two rollers. It can roll horizontally.

#### 2. Statically Determinate ($r = 3$ and stable)
If there are exactly 3 reactions, and they are arranged properly to prevent all movements:
- The reactions can be uniquely solved using only the 3 equilibrium equations.
- Example: A pin support at one end, and a roller support at the other.

#### 3. Statically Indeterminate ($r > 3$ and stable)
If there are more than 3 reactions, the structure has **redundant supports**.
- It is stable, but we cannot solve for all reactions using statics alone.
- Example: A beam fixed at one end and pinned at the other ($3 + 2 = 5$ reactions).

### Geometric Instability (The Trap!)
A structure can have $r \\ge 3$ reactions but still be unstable due to poor arrangement:
- **Parallel Reactions:** If all reaction forces are parallel, the structure cannot resist motion in the perpendicular direction.
- **Concurrent Reactions:** If all reaction force lines of action intersect at a single point $Q$, the structure cannot resist rotation about $Q$.

> [!WARNING]
> **Why it matters:** Geometric instability leads to sudden structural collapse. An engineer must ensure supports are oriented to block translation in all axes and prevent rotation.
`,
    contentMarkdownId: `
### Klasifikasi Struktur Planar
Misalkan $r$ adalah jumlah reaksi tumpuan yang tidak diketahui.
Misalkan $n$ adalah jumlah persamaan kesetimbangan yang tersedia (untuk satu benda tegar, $n = 3$).

#### 1. Labil / Unstable ($r < 3$)
Jika jumlah reaksi kurang dari 3, struktur tersebut **kurang tertahan** dan akan bergerak saat beban diterapkan.
- Contoh: Balok yang ditumpu hanya oleh dua rol. Balok tersebut dapat meluncur secara horizontal.

#### 2. Statis Tertentu / Statically Determinate ($r = 3$ dan stabil)
Jika terdapat tepat 3 reaksi, dan disusun dengan benar untuk mencegah semua gerakan:
- Reaksi tumpuan dapat diselesaikan secara unik hanya menggunakan 3 persamaan kesetimbangan.
- Contoh: Tumpuan sendi di satu ujung, dan tumpuan rol di ujung lainnya.

#### 3. Statis Tak Tentu / Statically Indeterminate ($r > 3$ dan stabil)
Jika terdapat lebih dari 3 reaksi tumpuan, struktur tersebut memiliki **tumpuan berlebih (redundan)**.
- Struktur ini stabil, tetapi kita tidak dapat menyelesaikan semua reaksi hanya dengan persamaan statika.
- Contoh: Balok dijepit di satu ujung dan ditumpu sendi di ujung lainnya ($3 + 2 = 5$ reaksi).

### Ketidakstabilan Geometris (Jebakan!)
Suatu struktur dapat memiliki $r \\ge 3$ reaksi tumpuan tetapi tetap tidak stabil karena susunan yang buruk:
- **Reaksi Sejajar:** Jika semua gaya reaksi sejajar, struktur tidak dapat menahan gerakan ke arah yang tegak lurus.
- **Reaksi Konkuren:** Jika semua garis kerja gaya reaksi berpotongan di satu titik $Q$, struktur tidak dapat menahan rotasi di sekitar $Q$.

> [!WARNING]
> **Mengapa ini penting:** Ketidakstabilan geometris menyebabkan kegagalan struktur secara mendadak. Seorang insinyur harus memastikan tumpuan diorientasikan untuk menghalangi translasi di semua sumbu dan mencegah rotasi.
`
  },
  {
    id: 'trusses',
    title: '6. Trusses and Method of Joints',
    titleId: '6. Rangka Batang & Metode Titik Hubung',
    summary: 'Analyze planar pin-jointed trusses and solve member forces.',
    summaryId: 'Menganalisis rangka batang planar dan menghitung gaya batang.',
    contentMarkdown: `
### What is a Truss?
A **truss** is a structure composed of slender members joined together at their end points. Planar trusses lie in a single plane and are commonly used to support roofs and bridges.

### Key Assumptions of Ideal Trusses:
1. **Pin-Jointed Connections**: Members are joined together by smooth, frictionless pins.
2. **Loads at Joints Only**: All external loads and support reactions are applied directly to the joints. Member self-weight is neglected or split between the joints.
3. **Two-Force Members**: Since loads are only applied at joints and connections are pinned, each member acts as a **two-force member**. This means it carries only axial force (either tension or compression), with no bending moments or shear forces.

### Tension vs. Compression Sign Convention:
- **Tension (T) [Positive, +]**: The member is being pulled, which means it pulls *away* from the connected joints.
- **Compression (C) [Negative, -]**: The member is being pushed/squeezed, which means it pushes *towards* the connected joints.

### Truss Determinacy Formula ($m + r = 2j$):
For a planar truss with $m$ members, $r$ support reaction components, and $j$ joints:
- **Unstable**: $m + r < 2j$
- **Statically Determinate**: $m + r = 2j$ (and stable)
- **Statically Indeterminate**: $m + r > 2j$

### Method of Joints Workflow:
1. **Calculate Support Reactions**: Solve reactions for the entire truss treating it as a single rigid body using $\\sum F_x = 0$, $\\sum F_y = 0$, $\\sum M_P = 0$.
2. **Find a Joint with $\\le 2$ Unknowns**: Choose a joint that connects at most two members with unknown forces.
3. **Apply Joint Equilibrium**: Write $\\sum F_x = 0$ and $\\sum F_y = 0$ for the joint. Solve for the unknowns.
4. **Propagate**: Move to adjacent joints, treating the solved member forces as known values. Repeat until all member forces are solved.

### Zero-Force Member Rules:
By inspecting a truss, you can immediately identify members that carry no load under specific conditions:
- **Rule 1 (2-member joint)**: If only two non-collinear members meet at an unloaded, unsupported joint, both are zero-force members.
- **Rule 2 (3-member joint)**: If three members meet at an unloaded, unsupported joint and two of them are collinear, the third non-collinear member is a zero-force member.
`,
    contentMarkdownId: `
### Apa itu Rangka Batang?
**Rangka batang (truss)** adalah struktur yang terdiri dari batang-batang ramping yang dihubungkan di ujung-ujungnya. Rangka batang planar terletak pada satu bidang rata dan umumnya digunakan untuk menopang atap dan jembatan.

### Asumsi Utama Rangka Batang Ideal:
1. **Sambungan Sendi/Engsel**: Batang dihubungkan menggunakan pin yang licin tanpa gesekan.
2. **Beban Hanya di Titik Hubung**: Semua beban luar dan reaksi tumpuan bekerja langsung pada titik hubung (joint). Berat sendiri batang diabaikan atau dibagi rata ke titik hubung.
3. **Batang Dua Gaya (Two-Force Members)**: Karena beban hanya di titik hubung dan sambungan berupa sendi, setiap batang bertindak sebagai **batang dua gaya**. Artinya, batang hanya menyalurkan gaya aksial (tarik atau tekan), tanpa adanya momen lentur atau gaya geser lintang.

### Konvensi Tanda Tarik vs. Tekan:
- **Tarik (Tension) [Positif, +]**: Batang mengalami tarikan, sehingga menarik *menjauhi* titik hubung yang terhubung.
- **Tekan (Compression) [Negatif, -]**: Batang mengalami tekanan, sehingga mendorong *menuju* titik hubung yang terhubung.

### Rumus Determinasi Rangka Batang ($m + r = 2j$):
Untuk rangka batang planar dengan $m$ batang, $r$ komponen reaksi tumpuan, dan $j$ titik hubung:
- **Labil (Unstable)**: $m + r < 2j$
- **Statis Tertentu (Determinate)**: $m + r = 2j$ (dan stabil)
- **Statis Tak Tentu (Indeterminate)**: $m + r > 2j$

### Langkah Metode Titik Hubung:
1. **Hitung Reaksi Tumpuan**: Selesaikan reaksi untuk seluruh rangka batang sebagai satu kesatuan benda tegar menggunakan $\\sum F_x = 0$, $\\sum F_y = 0$, $\\sum M_P = 0$.
2. **Pilih Titik Hubung dengan $\\le 2$ Unknown**: Pilih titik hubung yang memiliki maksimal dua gaya batang yang belum diketahui nilainya.
3. **Terapkan Kesetimbangan Titik**: Tulis $\\sum F_x = 0$ dan $\\sum F_y = 0$ untuk titik tersebut. Selesaikan nilai gaya batangnya.
4. **Rambatkan**: Pindah ke titik hubung sebelahnya, perlakukan gaya batang yang sudah dihitung sebagai nilai yang diketahui. Ulangi sampai semua gaya batang terhitung.

### Aturan Batang Gaya Nol (Zero-Force Members):
Melalui inspeksi visual, Anda dapat langsung mengenali batang yang tidak memikul beban:
- **Aturan 1 (Joint 2 batang)**: Jika hanya dua batang yang tidak sejajar bertemu di titik hubung yang tidak dibebani dan tidak ditumpu, kedua batang tersebut adalah batang gaya nol.
- **Aturan 2 (Joint 3 batang)**: Jika tiga batang bertemu di titik hubung yang tidak dibebani dan tidak ditumpu serta dua diantaranya sejajar (collinear), maka batang ketiga yang tidak sejajar merupakan batang gaya nol.
`
  }
];
