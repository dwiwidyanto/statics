import type { ProblemModel } from '../../lib/domain/models/types';

export const beamProblems: ProblemModel[] = [
  {
    id: 'beam-simply-supported-midpoint',
    title: 'Guided Problem 1: Simply Supported Beam with Midpoint Load',
    titleId: 'Soal Terpandu 1: Balok Tumpuan Sederhana dengan Beban Terpusat Tengah',
    description: 'A 6-meter long horizontal beam is supported by a pin support at the left end A (x=0) and a roller support at the right end B (x=6). A vertical downward force of 800 N is applied at the midpoint (x=3).',
    descriptionId: 'Sebuah balok horizontal sepanjang 6 meter ditumpu oleh tumpuan sendi di ujung kiri A (x=0) dan tumpuan rol di ujung kanan B (x=6). Gaya vertikal ke bawah sebesar 800 N diterapkan di tengah-tengah balok (x=3).',
    body: {
      id: 'body-simply-supported-midpoint',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      {
        id: 'load-p1',
        type: 'point_force',
        label: 'P1',
        magnitude: 800,
        angle: 270, // downwards
        position: { x: 3.0, y: 0.3 }
      }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Take moments about A to find R_By: Sum M_A = R_By * 6 - 800 * 3 = 0 => R_By = 400 N.',
      'Sum forces in Y to find R_Ay: Sum F_y = R_Ay + R_By - 800 = 0 => R_Ay = 400 N.',
      'Sum forces in X to find R_Ax: Sum F_x = R_Ax = 0.'
    ],
    hintsId: [
      'Jumlahkan momen di sekitar A untuk menghitung R_By: ΣM_A = R_By * 6 - 800 * 3 = 0 => R_By = 400 N.',
      'Jumlahkan gaya vertikal untuk menghitung R_Ay: ΣF_y = R_Ay + R_By - 800 = 0 => R_Ay = 400 N.',
      'Jumlahkan gaya horizontal untuk menghitung R_Ax: ΣF_x = R_Ax = 0.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 10,
    learningObjectives: ['Apply moment equilibrium to find reactions', 'Verify results with force equilibrium']
  },
  {
    id: 'beam-simply-supported-two-points',
    title: 'Guided Problem 2: Simply Supported Beam with Two Point Loads',
    titleId: 'Soal Terpandu 2: Balok Tumpuan Sederhana dengan Dua Beban Terpusat',
    description: 'A 9-meter long beam has a pin support at A (x=0) and a roller support at B (x=9). Two downward vertical loads are applied: 300 N at x=3 and 600 N at x=6.',
    descriptionId: 'Sebuah balok sepanjang 9 meter memiliki tumpuan sendi di A (x=0) dan tumpuan rol di B (x=9). Dua beban vertikal ke bawah diterapkan: 300 N pada x=3 dan 600 N pada x=6.',
    body: {
      id: 'body-two-points',
      type: 'beam',
      width: 9.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 9.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 300, angle: 270, position: { x: 3.0, y: 0.3 } },
      { id: 'load-p2', type: 'point_force', label: 'P2', magnitude: 600, angle: 270, position: { x: 6.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Take moments about A: Sum M_A = R_By * 9 - 300 * 3 - 600 * 6 = 0 => R_By = (900 + 3600) / 9 = 500 N.',
      'Sum forces in Y: Sum F_y = R_Ay + R_By - 300 - 600 = 0 => R_Ay = 400 N.',
      'Check horizontal equilibrium: R_Ax = 0.'
    ],
    hintsId: [
      'Jumlahkan momen di sekitar A: ΣM_A = R_By * 9 - 300 * 3 - 600 * 6 = 0 => R_By = (900 + 3600) / 9 = 500 N.',
      'Jumlahkan gaya vertikal: ΣF_y = R_Ay + R_By - 300 - 600 = 0 => R_Ay = 400 N.',
      'Periksa kesetimbangan horizontal: R_Ax = 0.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 12,
    learningObjectives: ['Handle multiple point loads', 'Superposition of load effects']
  },
  {
    id: 'beam-cantilever-point-load',
    title: 'Guided Problem 3: Cantilever Beam with End Load',
    titleId: 'Soal Terpandu 3: Balok Kantilever dengan Beban Ujung',
    description: 'A 4-meter long cantilever beam is fixed at the left end A (x=0) and is free at the right end. A vertical downward load of 500 N is applied at the free end (x=4).',
    descriptionId: 'Sebuah balok kantilever sepanjang 4 meter dijepit di ujung kiri A (x=0) dan bebas di ujung kanan. Beban vertikal ke bawah sebesar 500 N diterapkan di ujung bebas (x=4).',
    body: {
      id: 'body-cantilever-point-load',
      type: 'beam',
      width: 4.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'fixed', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 500, angle: 270, position: { x: 4.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'A fixed support provides vertical, horizontal force reactions and a moment reaction.',
      'Vertical equilibrium: R_Ay - 500 = 0 => R_Ay = 500 N.',
      'Moment equilibrium about A: M_A - 500 * 4 = 0 => M_A = 2000 N·m (Counter-clockwise).'
    ],
    hintsId: [
      'Tumpuan jepit memberikan reaksi gaya vertikal, horizontal, dan momen reaksi.',
      'Kesetimbangan vertikal: R_Ay - 500 = 0 => R_Ay = 500 N.',
      'Kesetimbangan momen terhadap A: M_A - 500 * 4 = 0 => M_A = 2000 N·m (Berlawanan arah jarum jam).'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 8,
    learningObjectives: ['Understand fixed support reactions', 'Solve cantilever equilibrium']
  },
  {
    id: 'beam-cantilever-moment',
    title: 'Guided Problem 4: Cantilever Beam with End Moment',
    titleId: 'Soal Terpandu 4: Balok Kantilever dengan Momen Ujung',
    description: 'A 3-meter long cantilever beam is fixed at A (x=0). A clockwise concentrated moment of 1200 N·m is applied at the free end (x=3).',
    descriptionId: 'Sebuah balok kantilever sepanjang 3 meter dijepit di A (x=0). Momen terpusat searah jarum jam sebesar 1200 N·m diterapkan di ujung bebas (x=3).',
    body: {
      id: 'body-cantilever-moment',
      type: 'beam',
      width: 3.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'fixed', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' }
    ],
    loads: [
      { id: 'load-m1', type: 'applied_moment', label: 'M1', magnitude: -1200, position: { x: 3.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Since there are no vertical point forces, R_Ay = 0.',
      'The applied moment is CW (-1200 N·m). To maintain equilibrium, the reaction moment M_A must be CCW (+1200 N·m).',
      'Horizontal reaction is zero: R_Ax = 0.'
    ],
    hintsId: [
      'Karena tidak ada gaya vertikal luar, R_Ay = 0.',
      'Momen yang diterapkan adalah CW (-1200 N·m). Untuk menjaga kesetimbangan, momen reaksi M_A harus bernilai CCW (+1200 N·m).',
      'Reaksi gaya horizontal adalah nol: R_Ax = 0.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 8,
    learningObjectives: ['Understand applied moment loads', 'Moment equilibrium with no transverse forces']
  },
  {
    id: 'beam-simply-supported-full-udl',
    title: 'Guided Problem 5: Simply Supported Beam with Full-Span UDL',
    titleId: 'Soal Terpandu 5: Balok Tumpuan Sederhana dengan Beban Merata Penuh',
    description: 'An 8-meter long beam is supported by a pin at A (x=0) and a roller at B (x=8). A uniformly distributed load of 150 N/m acts downwards along the entire span of the beam.',
    descriptionId: 'Sebuah balok sepanjang 8 meter ditumpu oleh sendi di A (x=0) dan rol di B (x=8). Beban merata sebesar 150 N/m bekerja ke bawah di seluruh bentang balok.',
    body: {
      id: 'body-full-udl',
      type: 'beam',
      width: 8.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 8.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      {
        id: 'load-w1',
        type: 'distributed_load',
        label: 'w1',
        magnitudeStart: 150,
        magnitudeEnd: 150,
        startPosition: { x: 0.0, y: 0.3 },
        endPosition: { x: 8.0, y: 0.3 },
        angle: 270
      }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Find the resultant force: W = w * L = 150 N/m * 8 m = 1200 N downwards, acting at x = 4m.',
      'Symmetry implies the support reactions share the load equally: R_Ay = R_By = 1200 / 2 = 600 N.',
      'Confirm with moment sum about A: R_By * 8 - 1200 * 4 = 0 => R_By = 600 N.'
    ],
    hintsId: [
      'Hitung gaya ekivalen: W = w * L = 150 N/m * 8 m = 1200 N ke bawah, bekerja pada x = 4m.',
      'Simetri menunjukkan bahwa reaksi tumpuan membagi beban secara merata: R_Ay = R_By = 1200 / 2 = 600 N.',
      'Verifikasi dengan jumlah momen di sekitar A: R_By * 8 - 1200 * 4 = 0 => R_By = 600 N.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 10,
    learningObjectives: ['Convert UDL to equivalent point load', 'Use symmetry to verify reactions']
  },
  {
    id: 'beam-simply-supported-partial-udl',
    title: 'Guided Problem 6: Simply Supported Beam with Partial UDL',
    titleId: 'Soal Terpandu 6: Balok Tumpuan Sederhana dengan Beban Merata Sebagian',
    description: 'A 6-meter long beam is pinned at A (x=0) and supported by a roller at B (x=6). A downward UDL of 400 N/m acts over the right-hand portion of the beam, starting at x=2 and ending at x=6.',
    descriptionId: 'Sebuah balok sepanjang 6 meter ditumpu sendi di A (x=0) dan rol di B (x=6). Beban merata ke bawah sebesar 400 N/m bekerja pada bagian kanan balok, dimulai dari x=2 hingga x=6.',
    body: {
      id: 'body-partial-udl',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      {
        id: 'load-w1',
        type: 'distributed_load',
        label: 'w1',
        magnitudeStart: 400,
        magnitudeEnd: 400,
        startPosition: { x: 2.0, y: 0.3 },
        endPosition: { x: 6.0, y: 0.3 },
        angle: 270
      }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Equivalent point force: W = 400 N/m * 4 m = 1600 N.',
      'Centroid of the UDL: x = 2m + (4m / 2) = 4m.',
      'Sum moments about A: R_By * 6 - 1600 * 4 = 0 => R_By = 6400 / 6 = 1066.7 N.',
      'Sum forces in Y: R_Ay + R_By - 1600 = 0 => R_Ay = 1600 - 1066.7 = 533.3 N.'
    ],
    hintsId: [
      'Gaya terpusat ekivalen: W = 400 N/m * 4 m = 1600 N.',
      'Pusat gaya merata: x = 2m + (4m / 2) = 4m.',
      'Jumlah momen di sekitar A: ΣM_A = R_By * 6 - 1600 * 4 = 0 => R_By = 6400 / 6 = 1066.7 N.',
      'Jumlah gaya vertikal: ΣF_y = R_Ay + R_By - 1600 = 0 => R_Ay = 1600 - 1066.7 = 533.3 N.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 12,
    learningObjectives: ['Handle partial-span UDL', 'Locate UDL centroid for moment calculations']
  },
  {
    id: 'beam-overhang-single-point',
    title: 'Guided Problem 7: Overhanging Beam with End Point Load',
    titleId: 'Soal Terpandu 7: Balok Overhang dengan Beban Terpusat Ujung',
    description: 'An 8-meter long beam is pinned at A (x=0) and supported by a roller at B (x=6). A vertical downward point force of 400 N is applied at the free overhang end (x=8).',
    descriptionId: 'Sebuah balok sepanjang 8 meter ditumpu sendi di A (x=0) dan rol di B (x=6). Gaya terpusat vertikal ke bawah sebesar 400 N diterapkan di ujung bebas yang menggantung (x=8).',
    body: {
      id: 'body-overhang-point',
      type: 'beam',
      width: 8.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 400, angle: 270, position: { x: 8.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Take moments about A: R_By * 6 - 400 * 8 = 0 => R_By = 3200 / 6 = 533.3 N.',
      'Sum forces in Y: R_Ay + R_By - 400 = 0 => R_Ay = 400 - 533.3 = -133.3 N.',
      'Note that R_Ay is negative: the support A must hold the beam down to prevent it from pivoting upwards!'
    ],
    hintsId: [
      'Jumlahkan momen di sekitar A: R_By * 6 - 400 * 8 = 0 => R_By = 3200 / 6 = 533.3 N.',
      'Jumlahkan gaya vertikal: R_Ay + R_By - 400 = 0 => R_Ay = 400 - 533.3 = -133.3 N.',
      'Perhatikan bahwa R_Ay bernilai negatif: tumpuan A harus menahan balok ke bawah untuk mencegahnya terangkat!'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 12,
    learningObjectives: ['Analyze overhanging beams', 'Interpret negative reaction values']
  },
  {
    id: 'beam-overhang-udl-point',
    title: 'Guided Problem 8: Overhanging Beam with UDL and Point Load',
    titleId: 'Soal Terpandu 8: Balok Overhang dengan Beban Merata dan Terpusat',
    description: 'A 10-meter long beam is supported by a pin at A (x=2) and a roller at B (x=8). A downward UDL of 200 N/m acts between the supports (x=2 to x=8), and a vertical downward load of 600 N acts at the right end (x=10).',
    descriptionId: 'Sebuah balok sepanjang 10 meter ditumpu oleh sendi di A (x=2) dan rol di B (x=8). Beban merata ke bawah sebesar 200 N/m bekerja di antara tumpuan (x=2 hingga x=8), dan beban terpusat vertikal ke bawah sebesar 600 N bekerja di ujung kanan (x=10).',
    body: {
      id: 'body-overhang-udl-point',
      type: 'beam',
      width: 10.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 2.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 8.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      {
        id: 'load-w1',
        type: 'distributed_load',
        label: 'w1',
        magnitudeStart: 200,
        magnitudeEnd: 200,
        startPosition: { x: 2.0, y: 0.3 },
        endPosition: { x: 8.0, y: 0.3 },
        angle: 270
      },
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 600, angle: 270, position: { x: 10.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Equivalent force of UDL: W = 200 * 6 = 1200 N, acting at x = 5m (moment arm to A is 5m - 2m = 3m).',
      'Sum moments about A (x=2): R_By * 6 - 1200 * 3 - 600 * 8 = 0 => R_By = (3600 + 4800) / 6 = 1400 N.',
      'Sum forces in Y: R_Ay + R_By - 1200 - 600 = 0 => R_Ay = 1800 - 1400 = 400 N.'
    ],
    hintsId: [
      'Gaya ekivalen beban merata: W = 200 * 6 = 1200 N, bekerja pada x = 5m (jarak ke A adalah 5m - 2m = 3m).',
      'Jumlah momen di sekitar A (x=2): R_By * 6 - 1200 * 3 - 600 * 8 = 0 => R_By = (3600 + 4800) / 6 = 1400 N.',
      'Jumlah gaya vertikal: R_Ay + R_By - 1200 - 600 = 0 => R_Ay = 1800 - 1400 = 400 N.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 15,
    learningObjectives: ['Combine UDL and point loads', 'Internal supports with overhang']
  },
  {
    id: 'beam-simply-supported-diagonal-force',
    title: 'Guided Problem 9: Simply Supported Beam with Diagonal Load',
    titleId: 'Soal Terpandu 9: Balok Tumpuan Sederhana dengan Beban Miring',
    description: 'A 6-meter long beam has a pin support at A (x=0) and a roller at B (x=6). An inclined point force of 500 N is applied at x=4 at an angle of 240° (pushing downwards and left).',
    descriptionId: 'Sebuah balok sepanjang 6 meter memiliki tumpuan sendi di A (x=0) dan rol di B (x=6). Gaya terpusat miring sebesar 500 N diterapkan pada x=4 dengan sudut 240° (mendorong ke bawah dan kiri).',
    body: {
      id: 'body-diagonal',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 500, angle: 240, position: { x: 4.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Resolve the 500 N force: P_x = 500 * cos(240°) = -250 N (left), P_y = 500 * sin(240°) = -433.0 N (downwards).',
      'Sum forces in X: R_Ax + P_x = 0 => R_Ax - 250 = 0 => R_Ax = 250 N (right).',
      'Take moments about A: R_By * 6 - 433.0 * 4 = 0 => R_By = 1732.1 / 6 = 288.7 N.',
      'Sum forces in Y: R_Ay + R_By - 433.0 = 0 => R_Ay = 433.0 - 288.7 = 144.3 N.'
    ],
    hintsId: [
      'Uraikan gaya 500 N: P_x = 500 * cos(240°) = -250 N (ke kiri), P_y = 500 * sin(240°) = -433.0 N (ke bawah).',
      'Jumlah gaya horizontal: R_Ax + P_x = 0 => R_Ax - 250 = 0 => R_Ax = 250 N (ke kanan).',
      'Jumlahkan momen di sekitar A: R_By * 6 - 433.0 * 4 = 0 => R_By = 1732.1 / 6 = 288.7 N.',
      'Jumlah gaya vertikal: R_Ay + R_By - 433.0 = 0 => R_Ay = 433.0 - 288.7 = 144.3 N.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 15,
    learningObjectives: ['Resolve inclined forces into components', 'Handle non-vertical loads']
  },
  {
    id: 'beam-simply-supported-udl-point',
    title: 'Guided Problem 10: Simply Supported Beam with Combined Loads',
    titleId: 'Soal Terpandu 10: Balok Tumpuan Sederhana dengan Kombinasi Beban',
    description: 'An 8-meter long beam is pinned at A (x=0) and supported by a roller at B (x=8). It carries a UDL of 100 N/m from x=0 to x=4, and a vertical downward load of 300 N at x=6.',
    descriptionId: 'Sebuah balok sepanjang 8 meter ditumpu sendi di A (x=0) dan rol di B (x=8). Balok memikul beban merata 100 N/m dari x=0 hingga x=4, dan beban terpusat vertikal ke bawah sebesar 300 N pada x=6.',
    body: {
      id: 'body-udl-point',
      type: 'beam',
      width: 8.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 8.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      {
        id: 'load-w1',
        type: 'distributed_load',
        label: 'w1',
        magnitudeStart: 100,
        magnitudeEnd: 100,
        startPosition: { x: 0.0, y: 0.3 },
        endPosition: { x: 4.0, y: 0.3 },
        angle: 270
      },
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 300, angle: 270, position: { x: 6.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Equivalent force of the UDL: W = 100 * 4 = 400 N acting at x=2.',
      'Sum moments about A: R_By * 8 - 400 * 2 - 300 * 6 = 0 => R_By = (800 + 1800) / 8 = 325 N.',
      'Sum forces in Y: R_Ay + R_By - 400 - 300 = 0 => R_Ay = 700 - 325 = 375 N.'
    ],
    hintsId: [
      'Gaya terpusat ekivalen dari UDL: W = 100 * 4 = 400 N bekerja pada x=2.',
      'Jumlah momen di sekitar A: R_By * 8 - 400 * 2 - 300 * 6 = 0 => R_By = (800 + 1800) / 8 = 325 N.',
      'Jumlah gaya vertikal: R_Ay + R_By - 400 - 300 = 0 => R_Ay = 700 - 325 = 375 N.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 15,
    learningObjectives: ['Combine distributed and point loads', 'Apply superposition principle']
  },
  {
    id: 'beam-cantilever-combo',
    title: 'Guided Problem 11: Cantilever Beam with Combined Loads',
    titleId: 'Soal Terpandu 11: Balok Kantilever dengan Beban Kombinasi',
    description: 'A 5-meter long cantilever beam is fixed at A (x=0). It carries a UDL of 200 N/m starting from the wall (x=0) and ending at x=3, plus a concentrated load of 400 N at the free end (x=5).',
    descriptionId: 'Sebuah balok kantilever sepanjang 5 meter dijepit di A (x=0). Balok memikul beban merata 200 N/m mulai dari dinding jepit (x=0) hingga x=3, ditambah beban terpusat 400 N di ujung bebas (x=5).',
    body: {
      id: 'body-cant-combo',
      type: 'beam',
      width: 5.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'fixed', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' }
    ],
    loads: [
      {
        id: 'load-w1',
        type: 'distributed_load',
        label: 'w1',
        magnitudeStart: 200,
        magnitudeEnd: 200,
        startPosition: { x: 0.0, y: 0.3 },
        endPosition: { x: 3.0, y: 0.3 },
        angle: 270
      },
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 400, angle: 270, position: { x: 5.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Equivalent force of UDL: W = 200 * 3 = 600 N acting at x=1.5m.',
      'Sum forces in Y: R_Ay - 600 - 400 = 0 => R_Ay = 1000 N.',
      'Sum moments about A: M_A - 600 * 1.5 - 400 * 5 = 0 => M_A = 900 + 2000 = 2900 N·m (CCW).'
    ],
    hintsId: [
      'Gaya ekivalen dari UDL: W = 200 * 3 = 600 N bekerja pada x=1.5m.',
      'Jumlah gaya vertikal: R_Ay - 600 - 400 = 0 => R_Ay = 1000 N.',
      'Jumlah momen terhadap A: M_A - 600 * 1.5 - 400 * 5 = 0 => M_A = 900 + 2000 = 2900 N·m (CCW).'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'hard',
    version: 1,
    estimatedTimeMinutes: 15,
    learningObjectives: ['Cantilever with combined loading', 'Compute reaction moments']
  },
  {
    id: 'beam-simply-supported-symmetrical-point-loads',
    title: 'Guided Problem 12: Simply Supported Beam Symmetrical Loads',
    titleId: 'Soal Terpandu 12: Balok Tumpuan Sederhana Beban Simetris',
    description: 'A 6-meter long beam is pinned at A (x=0) and supported by a roller at B (x=6). Symmetrical downward loads of 400 N are applied at x=2 and x=4.',
    descriptionId: 'Sebuah balok sepanjang 6 meter ditumpu sendi di A (x=0) dan rol di B (x=6). Beban vertikal ke bawah yang simetris sebesar 400 N diterapkan pada x=2 dan x=4.',
    body: {
      id: 'body-sym-loads',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 400, angle: 270, position: { x: 2.0, y: 0.3 } },
      { id: 'load-p2', type: 'point_force', label: 'P2', magnitude: 400, angle: 270, position: { x: 4.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Due to symmetry, the reactions at both supports must be equal: R_Ay = R_By.',
      'Total load = 800 N. So R_Ay = R_By = 400 N.',
      'Check with moment equations to confirm.'
    ],
    hintsId: [
      'Karena beban simetris, reaksi di kedua tumpuan harus sama: R_Ay = R_By.',
      'Total beban = 800 N. Sehingga R_Ay = R_By = 400 N.',
      'Periksa dengan persamaan momen untuk memverifikasi.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'hard',
    version: 1,
    estimatedTimeMinutes: 10,
    learningObjectives: ['Exploit symmetry in beam analysis', 'Verify with moment equations']
  },
  {
    id: 'beam-double-overhang-point-loads',
    title: 'Guided Problem 13: Double Overhanging Beam with Point Loads',
    titleId: 'Soal Terpandu 13: Balok Overhang Ganda dengan Beban Ujung',
    description: 'A 10-meter long beam is supported by a pin at A (x=2) and a roller at B (x=8). Symmetrical loads of 300 N push downwards at both overhang free ends (x=0 and x=10).',
    descriptionId: 'Sebuah balok sepanjang 10 meter ditumpu oleh sendi di A (x=2) dan rol di B (x=8). Beban simetris sebesar 300 N bekerja ke bawah di kedua ujung menggantung yang bebas (x=0 dan x=10).',
    body: {
      id: 'body-double-overhang',
      type: 'beam',
      width: 10.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 2.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 8.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 300, angle: 270, position: { x: 0.0, y: 0.3 } },
      { id: 'load-p2', type: 'point_force', label: 'P2', magnitude: 300, angle: 270, position: { x: 10.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'The configuration is perfectly symmetrical about the center of the beam (x=5).',
      'This means both support reactions are equal: R_Ay = R_By = 300 N.',
      'Sum forces in Y: R_Ay + R_By = 600 N. This perfectly satisfies equilibrium!'
    ],
    hintsId: [
      'Konfigurasi ini benar-benar simetris terhadap pusat balok (x=5).',
      'Artinya kedua reaksi tumpuan adalah sama: R_Ay = R_By = 300 N.',
      'Jumlah gaya vertikal: R_Ay + R_By = 600 N. Ini sepenuhnya memenuhi kesetimbangan!'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'hard',
    version: 1,
    estimatedTimeMinutes: 12,
    learningObjectives: ['Analyze double-overhanging beams', 'Symmetrical loading patterns']
  },
  {
    id: 'beam-simply-supported-applied-moment',
    title: 'Guided Problem 14: Simply Supported Beam with Midpoint Moment',
    titleId: 'Soal Terpandu 14: Balok Tumpuan Sederhana dengan Momen Tengah',
    description: 'A 6-meter long beam is pinned at A (x=0) and supported by a roller at B (x=6). A counter-clockwise couple/moment of 900 N·m is applied at the midpoint (x=3).',
    descriptionId: 'Sebuah balok sepanjang 6 meter ditumpu sendi di A (x=0) dan rol di B (x=6). Momen terpusat berlawanan arah jarum jam sebesar 900 N·m diterapkan di tengah-tengah balok (x=3).',
    body: {
      id: 'body-beam-moment',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-m1', type: 'applied_moment', label: 'M1', magnitude: 900, position: { x: 3.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Take moments about A: R_By * 6 + 900 = 0 => R_By * 6 = -900 => R_By = -150 N (downwards).',
      'Sum forces in Y: R_Ay + R_By = 0 => R_Ay - 150 = 0 => R_Ay = 150 N (upwards).',
      'A pure moment load causes equal and opposite vertical reactions (a force couple).'
    ],
    hintsId: [
      'Jumlahkan momen di sekitar A: R_By * 6 + 900 = 0 => R_By * 6 = -900 => R_By = -150 N (ke bawah).',
      'Jumlah gaya vertikal: R_Ay + R_By = 0 => R_Ay - 150 = 0 => R_Ay = 150 N (ke atas).',
      'Beban momen murni menghasilkan reaksi vertikal yang sama besar namun berlawanan arah (kopel gaya).'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'hard',
    version: 1,
    estimatedTimeMinutes: 12,
    learningObjectives: ['Analyze pure moment loading', 'Understand force couples from applied moments']
  },
  {
    id: 'beam-cantilever-free-end-upward',
    title: 'Guided Problem 15: Cantilever Beam with Upward End Load',
    titleId: 'Soal Terpandu 15: Balok Kantilever dengan Beban Ujung ke Atas',
    description: 'A 4-meter long cantilever beam is fixed at A (x=0). An upward vertical force of 300 N is applied at the free end (x=4).',
    descriptionId: 'Sebuah balok kantilever sepanjang 4 meter dijepit di A (x=0). Gaya vertikal ke atas sebesar 300 N diterapkan di ujung bebas (x=4).',
    body: {
      id: 'body-cant-upward',
      type: 'beam',
      width: 4.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      { id: 'supp-a', type: 'fixed', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' }
    ],
    loads: [
      { id: 'load-p1', type: 'point_force', label: 'P1', magnitude: 300, angle: 90, position: { x: 4.0, y: 0.3 } }
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'The fixed support must balance the upward load: R_Ay = -300 N (downwards).',
      'Taking moments about A: M_A + 300 * 4 = 0 => M_A = -1200 N·m (Clockwise).',
      'This creates a positive shear and linear moment from 0 at end to -1200 N·m at wall.'
    ],
    hintsId: [
      'Tumpuan jepit harus menyeimbangkan beban ke atas: R_Ay = -300 N (ke bawah).',
      'Jumlahkan momen di sekitar A: M_A + 300 * 4 = 0 => M_A = -1200 N·m (Searah jarum jam).',
      'Ini menghasilkan gaya lintang positif dan momen linier dari 0 di ujung hingga -1200 N·m di dinding.'
    ],
    topic: 'beam-internal-forces',
    difficulty: 'hard',
    version: 1,
    estimatedTimeMinutes: 10,
    learningObjectives: ['Analyze upward loads on cantilevers', 'Interpret negative reactions and moments']
  }
];
