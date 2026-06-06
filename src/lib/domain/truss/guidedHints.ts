export interface HintDetail {
  id: string;
  en: string;
}

export interface ProgressiveHint {
  level1: HintDetail;
  level2: HintDetail;
  level3: HintDetail;
}

export const guidedHints: Record<string, ProgressiveHint> = {
  reaction_count_error: {
    level1: {
      id: 'Pikirkan tentang derajat kebebasan yang dibatasi oleh masing-masing jenis tumpuan.',
      en: 'Think about the degrees of freedom restricted by each type of support.'
    },
    level2: {
      id: 'Tumpuan sendi membatasi gerakan translasi horizontal dan vertikal (2 reaksi: Rx & Ry). Tumpuan rol membatasi gerakan tegak lurus permukaan (1 reaksi: Ry).',
      en: 'A pin support restricts horizontal and vertical translation (2 reactions: Rx & Ry). A roller support restricts movement perpendicular to the surface (1 reaction: Ry).'
    },
    level3: {
      id: 'Untuk tumpuan Sendi (Pin) di A, ada reaksi R_Ax dan R_Ay. Untuk tumpuan Rol (Roller) di B, ada reaksi R_By. Total reaksi r = 3.',
      en: 'For a Pin support at A, there are R_Ax and R_Ay reactions. For a Roller support at B, there is an R_By reaction. Total reactions r = 3.'
    }
  },
  sign_reversed: {
    level1: {
      id: 'Periksa arah gaya yang Anda asumsikan dalam persamaan kesetimbangan.',
      en: 'Double check the force directions assumed in your equilibrium equations.'
    },
    level2: {
      id: 'Ingat aturan tanda kartesian standar: gaya ke kanan/atas bernilai positif (+), sedangkan gaya ke kiri/bawah bernilai negatif (-).',
      en: 'Remember standard Cartesian signs: forces pointing right/up are positive (+), while forces pointing left/down are negative (-).'
    },
    level3: {
      id: 'Jika menghitung gaya batang: tarik selalu positif (+, menjauhi titik hubung) dan tekan selalu negatif (-, mendekati titik hubung). Jika reaksi tumpuan bernilai negatif, itu berarti arah sebenarnya berlawanan dengan arah asumsi awal Anda.',
      en: 'For member forces: tension is positive (+, pointing away from the joint) and compression is negative (-, pointing towards the joint). If a reaction is negative, its physical direction is opposite to the assumed arrow.'
    }
  },
  tension_compression_confusion: {
    level1: {
      id: 'Bagaimana batang menarik atau menekan titik hubung?',
      en: 'How does the member pull or push on the joint?'
    },
    level2: {
      id: 'Batang Tarik (Tension) menarik titik hubung (menjauhi titik). Batang Tekan (Compression) mendorong titik hubung (mendekati titik).',
      en: 'A member in Tension pulls away from the joints at its ends. A member in Compression pushes towards the joints at its ends.'
    },
    level3: {
      id: 'Bila nilai gaya batang positif (+), itu adalah Tarik (Tension). Bila nilainya negatif (-), itu adalah Tekan (Compression). Jangan tertukar tandanya!',
      en: 'If a calculated member force is positive (+), it represents Tension. If it is negative (-), it represents Compression. Keep the signs straight!'
    }
  },
  zero_force_missed: {
    level1: {
      id: 'Cari titik hubung bebas tanpa beban luar yang menghubungkan sedikit batang.',
      en: 'Look for unloaded, unsupported joints connecting few members.'
    },
    level2: {
      id: 'Terapkan Aturan 1 (2 batang non-kolinear di titik hubung bebas tanpa beban -> keduanya batang gaya nol) atau Aturan 2 (3 batang di titik hubung bebas tanpa beban di mana 2 di antaranya kolinear -> batang ketiga berdaya nol).',
      en: 'Apply Rule 1 (2 non-collinear members at an unloaded/unsupported joint -> both are ZFMs) or Rule 2 (3 members meet at an unloaded/unsupported joint where 2 are collinear -> the third is a ZFM).'
    },
    level3: {
      id: 'Periksa titik hubung yang tidak ditumpu dan tidak dibebani gaya luar. Batang yang tegak lurus terhadap batang kolinear menerus tanpa ada gaya luar di titik hubung tersebut adalah batang gaya nol.',
      en: 'Check unsupported joints without external loads. A member perpendicular to two collinear continuous members with no external load applied at that joint is a zero-force member.'
    }
  },
  zero_force_false_positive: {
    level1: {
      id: 'Apakah ada gaya luar atau tumpuan yang bekerja di titik hubung tersebut?',
      en: 'Is there an external load or support acting at the joint?'
    },
    level2: {
      id: 'Batang gaya nol hanya dapat diidentifikasi jika titik hubungnya tidak memiliki beban luar dan tidak ditumpu oleh reaksi.',
      en: 'Zero-force members can only be identified if their joints are completely unloaded and unsupported.'
    },
    level3: {
      id: 'Titik hubung dengan beban luar (misal beban 600 N) atau tumpuan (Sendi/Rol) tidak dapat langsung diasumsikan memiliki batang gaya nol karena ada gaya eksternal penyeimbang.',
      en: 'Joints with external loads (e.g. 600 N load) or support reactions (Pin/Roller) cannot be assumed to have zero-force members immediately because external forces are present.'
    }
  },
  wrong_joint_order: {
    level1: {
      id: 'Ingat batasan jumlah persamaan kesetimbangan di satu titik hubung.',
      en: 'Remember the limit on the number of equilibrium equations at a single joint.'
    },
    level2: {
      id: 'Pada metode titik hubung, kita hanya memiliki 2 persamaan (ΣFx = 0 dan ΣFy = 0) untuk sistem gaya 2D koplanar.',
      en: 'In the method of joints, we only have 2 equations (ΣFx = 0 and ΣFy = 0) for a coplanar 2D system.'
    },
    level3: {
      id: 'Anda harus memilih titik hubung yang memiliki MAKSIMAL 2 gaya batang yang belum diketahui nilainya. Jika Anda memilih titik hubung dengan 3+ gaya batang tidak diketahui, Anda tidak akan bisa menyelesaikannya secara langsung.',
      en: 'You must select a joint with at most 2 unknown member forces. If you choose a joint with 3 or more unknowns, you cannot solve for them directly.'
    }
  }
};

/**
 * Helper to get the hint text based on current locale.
 */
export function getHintText(progressiveHint: ProgressiveHint, level: number, currentLocale: string): string {
  const levelKey = `level${level}` as 'level1' | 'level2' | 'level3';
  const hint = progressiveHint[levelKey] || progressiveHint.level1;
  return currentLocale === 'id' ? hint.id : hint.en;
}
