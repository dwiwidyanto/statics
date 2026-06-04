import type { Support, Load, RigidBody, Reaction } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { solveEquilibrium } from '../solvers/equilibrium';

export interface ValidationFeedback {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  whyItMatters: string;
}

export interface CheckResult {
  reactionsCount: number;
  determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable';
  stability: 'stable' | 'unstable';
  feedbacks: ValidationFeedback[];
}

export function checkFbdModel(
  body: RigidBody,
  supports: Support[],
  loads: Load[],
  lang: 'en' | 'id' = 'en'
): CheckResult {
  const feedbacks: ValidationFeedback[] = [];
  
  // Helper to push localized feedback
  const pushFeedback = (
    type: 'info' | 'warning' | 'error' | 'success',
    titleEn: string,
    titleId: string,
    messageEn: string,
    messageId: string,
    whyEn: string,
    whyId: string
  ) => {
    feedbacks.push({
      type,
      title: lang === 'id' ? titleId : titleEn,
      message: lang === 'id' ? messageId : messageEn,
      whyItMatters: lang === 'id' ? whyId : whyEn,
    });
  };

  // 1. Extract all reactions
  const reactions: Reaction[] = [];
  for (const s of supports) {
    reactions.push(...getReactionsForSupport(s));
  }
  const reactionsCount = reactions.length;

  // 2. Run solver to check mathematical determinacy and stability
  const solverResult = solveEquilibrium(body, supports, loads);
  const { determinacy, stability } = solverResult;

  // 3. Check for Duplicate Support Locations
  for (let i = 0; i < supports.length; i++) {
    for (let j = i + 1; j < supports.length; j++) {
      const s1 = supports[i];
      const s2 = supports[j];
      const dist = Math.sqrt((s1.position.x - s2.position.x) ** 2 + (s1.position.y - s2.position.y) ** 2);
      if (dist < 0.05) {
        pushFeedback(
          'error',
          'Duplicated Support Location',
          'Lokasi Tumpuan Ganda',
          `Supports ${s1.label} and ${s2.label} are placed at the same location.`,
          `Tumpuan ${s1.label} dan ${s2.label} diletakkan pada lokasi yang sama.`,
          'Physical supports cannot occupy the same physical space. If you want to model a multi-action support, use a single support type like a fixed support or a pin support instead of stacking them.',
          'Tumpuan fisik tidak dapat menempati ruang fisik yang sama. Jika Anda ingin memodelkan tumpuan dengan banyak reaksi, gunakan satu jenis tumpuan seperti tumpuan jepit atau sendi, bukan menumpuknya.'
        );
      }
    }
  }

  // 4. Check for Horizontal Restraint
  const hasHorizontalRestraint = reactions.some(
    r => Math.abs(r.direction.x) > 1e-4 || r.type === 'moment'
  );
  if (!hasHorizontalRestraint && supports.length > 0) {
    pushFeedback(
      'error',
      'No Horizontal Restraint',
      'Tidak Ada Tahanan Horizontal',
      'None of the placed supports can resist forces in the horizontal (X) direction.',
      'Tidak ada tumpuan yang dapat menahan gaya dalam arah horizontal (X).',
      "If any horizontal load is applied (even a tiny wind force or offset load), the body will accelerate horizontally indefinitely (Newton's 2nd Law). You must include at least one support that restricts horizontal motion, like a pin or fixed support, or an inclined roller.",
      "Jika ada beban horizontal yang diterapkan (bahkan gaya angin kecil atau beban miring), batang akan bergerak ke arah horizontal tanpa henti (Hukum Ke-2 Newton). Anda harus memasukkan setidaknya satu tumpuan yang menahan gerakan horizontal, seperti tumpuan sendi atau jepit, atau rol miring."
    );
  }

  // 5. Check for Vertical Restraint
  const hasVerticalRestraint = reactions.some(
    r => Math.abs(r.direction.y) > 1e-4 || r.type === 'moment'
  );
  if (!hasVerticalRestraint && supports.length > 0) {
    pushFeedback(
      'error',
      'No Vertical Restraint',
      'Tidak Ada Tahanan Vertikal',
      'None of the placed supports can resist forces in the vertical (Y) direction.',
      'Tidak ada tumpuan yang dapat menahan gaya dalam arah vertikal (Y).',
      'Gravity acts vertically. Without a vertical constraint, the body will fall. Ensure there is at least one pin, roller, or fixed support resisting vertical motion.',
      'Gaya berat/gravitasi bekerja secara vertikal. Tanpa tahanan vertikal, batang akan jatuh. Pastikan ada setidaknya satu tumpuan sendi, rol, atau jepit yang menahan gerakan vertikal.'
    );
  }

  // 6. Check for Parallel Reactions
  if (reactionsCount >= 2) {
    // Only check forces, moments don't have direction vectors
    const forces = reactions.filter(r => r.type !== 'moment');
    if (forces.length === reactionsCount) { // all are forces
      const firstDir = forces[0].direction;
      const allParallel = forces.every(f => {
        // Dot product absolute value is close to 1
        const dot = Math.abs(f.direction.x * firstDir.x + f.direction.y * firstDir.y);
        return Math.abs(dot - 1) < 1e-4;
      });

      if (allParallel && reactionsCount >= 3) {
        pushFeedback(
          'error',
          'Parallel Reaction Forces',
          'Gaya Reaksi Sejajar',
          `All ${reactionsCount} reaction forces are parallel to each other.`,
          `Semua ${reactionsCount} gaya reaksi sejajar satu sama lain.`,
          'Even though you have 3 or more reactions, parallel reaction forces cannot resist any translation perpendicular to their direction. For example, three vertical rollers cannot prevent the beam from sliding horizontally. This represents geometric instability.',
          'Meskipun Anda memiliki 3 reaksi atau lebih, gaya reaksi yang sejajar tidak dapat menahan translasi yang tegak lurus dengan arah reaksi tersebut. Sebagai contoh, tiga rol vertikal tidak dapat menahan balok agar tidak bergeser secara horizontal. Ini merupakan labil geometris.'
        );
      }
    }
  }

  // 7. Check for Concurrent Lines of Action (Rotational Instability)
  const forces = reactions.filter(r => r.type !== 'moment');
  const moments = reactions.filter(r => r.type === 'moment');
  if (forces.length >= 3 && moments.length === 0) {
    // Find intersection of line of action of force 0 and 1
    const p0 = forces[0].position;
    const d0 = forces[0].direction;
    const p1 = forces[1].position;
    const d1 = forces[1].direction;

    // Check if they are parallel
    const cross = d0.x * d1.y - d0.y * d1.x;
    if (Math.abs(cross) > 1e-4) {
      // Find intersection point Q of line 0 and line 1
      const t0 = ((p1.x - p0.x) * d1.y - (p1.y - p0.y) * d1.x) / cross;
      const Q = {
        x: p0.x + t0 * d0.x,
        y: p0.y + t0 * d0.y,
      };

      // Check if all other forces' lines of action pass through Q
      let allConcurrent = true;
      for (let i = 2; i < forces.length; i++) {
        const pi = forces[i].position;
        const di = forces[i].direction;
        const dist = Math.abs((Q.x - pi.x) * di.y - (Q.y - pi.y) * di.x);
        if (dist > 1e-3) {
          allConcurrent = false;
          break;
        }
      }

      if (allConcurrent) {
        pushFeedback(
          'error',
          'Concurrent Reaction Forces',
          'Gaya Reaksi Konkuren',
          'All support reaction forces intersect at a single point.',
          'Semua garis kerja gaya reaksi tumpuan berpotongan di satu titik.',
          'If all reaction forces point towards or pass through the exact same point, none of them can generate a moment about that point. This means there is zero resistance to rotation about this intersection point, making the body rotationally unstable.',
          'Jika semua gaya reaksi mengarah ke atau melewati satu titik yang sama, tidak ada reaksi yang dapat menghasilkan momen penahan terhadap titik tersebut. Ini berarti tidak ada tahanan terhadap rotasi di sekitar titik potong ini, sehingga benda menjadi labil secara rotasi.'
        );
      }
    }
  }

  // 8. General determinacy feedback
  if (reactionsCount === 0) {
    pushFeedback(
      'error',
      'No Supports Placed',
      'Belum Ada Tumpuan',
      'The rigid body has no supports. It is completely free to move in space.',
      'Benda tegar tidak memiliki tumpuan sama sekali. Batang bebas bergerak di dalam ruang.',
      'Without supports, there are no reaction forces to counteract external loads. The body will accelerate in the direction of the net external force.',
      'Tanpa adanya tumpuan, tidak ada gaya reaksi untuk menyeimbangkan beban luar. Batang akan bergerak sesuai arah resultan beban luar.'
    );
  } else if (reactionsCount < 3) {
    pushFeedback(
      'error',
      'Under-restrained (Unstable)',
      'Kurang Batasan (Labil)',
      `You have placed ${reactionsCount} reaction constraints. A 2D rigid body requires at least 3 reactions.`,
      `Anda menempatkan ${reactionsCount} batasan reaksi. Benda tegar 2D memerlukan minimal 3 reaksi.`,
      'A rigid body in a 2D plane has 3 degrees of freedom: horizontal translation (X), vertical translation (Y), and rotation (M). To prevent all motion, you must satisfy 3 independent boundary conditions, meaning at least 3 reactions are needed.',
      'Benda tegar pada bidang 2D memiliki 3 derajat kebebasan: translasi horizontal (X), translasi vertikal (Y), dan rotasi (M). Untuk menahan seluruh gerakan, Anda harus memenuhi 3 syarat batas independen, yang berarti minimal diperlukan 3 reaksi.'
    );
  } else if (reactionsCount === 3) {
    if (stability === 'stable') {
      pushFeedback(
        'success',
        'Statically Determinate & Stable',
        'Statis Tertentu & Stabil',
        'The system has exactly 3 independent reaction constraints. It is stable and can be solved uniquely.',
        'Sistem memiliki tepat 3 batasan reaksi independen. Struktur stabil dan dapat diselesaikan secara unik.',
        'This is the ideal case for simple structures. You have just enough supports to prevent all motions without creating internal stresses due to thermal expansion or support settlement.',
        'Ini merupakan kasus ideal untuk struktur sederhana. Anda memiliki jumlah tumpuan yang cukup untuk menahan gerakan tanpa menciptakan tegangan dalam tambahan akibat pemuaian suhu atau penurunan tumpuan.'
      );
    }
  } else {
    if (stability === 'stable') {
      pushFeedback(
        'warning',
        'Statically Indeterminate',
        'Statis Tak Tentu',
        `The system has ${reactionsCount} reactions (more than the 3 equations of equilibrium).`,
        `Sistem memiliki ${reactionsCount} reaksi (lebih banyak dari 3 persamaan kesetimbangan).`,
        'Your structure is redundant. While it is stable and safe, you cannot solve for the reaction forces using statics alone (Sum Fx=0, Sum Fy=0, Sum M=0). You would need material properties and deformation equations (Mechanics of Materials) to solve this.',
        'Struktur Anda memiliki tumpuan redundan (berlebih). Meskipun struktur stabil dan aman, Anda tidak dapat menghitung gaya reaksi hanya dengan persamaan statika (ΣFx=0, ΣFy=0, ΣM=0). Anda memerlukan properti bahan dan persamaan deformasi (Mekanika Bahan) untuk menyelesaikannya.'
      );
    }
  }

  // 9. Check for loads and body weight
  const hasLoads = loads.length > 0;
  if (!hasLoads) {
    pushFeedback(
      'info',
      'No External Loads',
      'Tidak Ada Beban Luar',
      'The body is currently unloaded (except for any support actions).',
      'Batang saat ini tidak memiliki beban luar (kecuali gaya reaksi tumpuan).',
      'Under no external forces, all support reactions will solve to zero. Try adding a point force, distributed load, or applied moment to see how reactions change.',
      'Tanpa beban luar, semua reaksi tumpuan akan bernilai nol. Cobalah menambahkan gaya terpusat, beban merata, atau momen luar untuk melihat perubahan reaksi tumpuan.'
    );
  }

  // Check if body weight load exists
  const hasWeightLoad = loads.some(l => l.type === 'body_weight');
  if (body.weight > 0 && !hasWeightLoad) {
    pushFeedback(
      'warning',
      'Body Weight Omitted',
      'Berat Sendiri Batang Diabaikan',
      `The body weight (${body.weight} N) is specified in the body properties but not added to the FBD diagram.`,
      `Berat batang (${body.weight} N) ditentukan di properti batang tetapi belum dimasukkan ke diagram FBD.`,
      'In real-world engineering, the weight of the beam or block acts at its center of gravity. Leaving it out makes the calculations incomplete, unless you are explicitly assuming a "massless" body.',
      'Dalam rekayasa nyata, berat balok atau plat bekerja di pusat gravitasinya. Mengabaikannya membuat perhitungan menjadi tidak lengkap, kecuali Anda secara eksplisit mengasumsikan batang "tanpa massa".'
    );
  }

  return {
    reactionsCount,
    determinacy,
    stability,
    feedbacks,
  };
}
