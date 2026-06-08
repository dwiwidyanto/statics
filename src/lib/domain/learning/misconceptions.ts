import type { MisconceptionCode } from '../progress/types';

export interface MisconceptionDefinition {
  code: MisconceptionCode;
  title: {
    en: string;
    id: string;
  };
  description: {
    en: string;
    id: string;
  };
  remediation: {
    en: string;
    id: string;
  };
  relatedSkills: string[];
}

export const misconceptionCatalog: Record<MisconceptionCode, MisconceptionDefinition> = {
  sign_reversed: {
    code: 'sign_reversed',
    title: { en: 'Sign Convention Reversal', id: 'Tanda Terbalik (+/-)' },
    description: {
      en: 'Algebraic signs were reversed on support reactions or member forces.',
      id: 'Tanda aljabar terbalik pada reaksi tumpuan atau gaya batang.'
    },
    remediation: {
      en: 'Recheck the positive axis direction and remember that positive truss force means tension.',
      id: 'Periksa lagi arah sumbu positif dan ingat bahwa gaya batang positif berarti tarik.'
    },
    relatedSkills: ['reactions', 'memberForces']
  },
  zero_force_missed: {
    code: 'zero_force_missed',
    title: { en: 'Missed Zero-Force Member', id: 'Batang Gaya Nol Terlewat' },
    description: {
      en: 'A member that should carry zero force was not identified.',
      id: 'Batang yang seharusnya bergaya nol tidak teridentifikasi.'
    },
    remediation: {
      en: 'Review unloaded two-member joints and unloaded three-member joints with two collinear members.',
      id: 'Tinjau joint dua batang tanpa beban dan joint tiga batang tanpa beban dengan dua batang kolinear.'
    },
    relatedSkills: ['zeroForceMembers', 'memberForces']
  },
  zero_force_false_positive: {
    code: 'zero_force_false_positive',
    title: { en: 'False Positive Zero-Force Member', id: 'Kesalahan Batang Nol' },
    description: {
      en: 'A force-carrying member was incorrectly marked as zero-force.',
      id: 'Batang yang memikul gaya keliru ditandai sebagai batang gaya nol.'
    },
    remediation: {
      en: 'Check whether the joint has an external load, support reaction, or non-collinear force path.',
      id: 'Periksa apakah joint memiliki beban luar, reaksi tumpuan, atau jalur gaya yang tidak kolinear.'
    },
    relatedSkills: ['zeroForceMembers']
  },
  wrong_joint_order: {
    code: 'wrong_joint_order',
    title: { en: 'Incorrect Joint Sequence', id: 'Urutan Joint Salah' },
    description: {
      en: 'The selected joint had too many unknown member forces to solve next.',
      id: 'Joint yang dipilih memiliki terlalu banyak gaya batang tak diketahui untuk diselesaikan.'
    },
    remediation: {
      en: 'Choose a joint with no more than two unknown member forces before writing equilibrium equations.',
      id: 'Pilih joint dengan maksimal dua gaya batang tak diketahui sebelum menulis persamaan keseimbangan.'
    },
    relatedSkills: ['jointSelection']
  },
  reaction_count_error: {
    code: 'reaction_count_error',
    title: { en: 'Support Reaction Counting Error', id: 'Kesalahan Jumlah Reaksi' },
    description: {
      en: 'The support reaction count was misidentified.',
      id: 'Jumlah reaksi tumpuan diidentifikasi dengan keliru.'
    },
    remediation: {
      en: 'Count two reaction components for a pin and one for a roller.',
      id: 'Hitung dua komponen reaksi untuk sendi dan satu komponen untuk rol.'
    },
    relatedSkills: ['determinacy', 'reactions']
  },
  tension_compression_confusion: {
    code: 'tension_compression_confusion',
    title: { en: 'Tension/Compression Confusion', id: 'Kebingungan Tarik/Tekan' },
    description: {
      en: 'The member force direction was interpreted with the wrong tension/compression sense.',
      id: 'Arah gaya batang ditafsirkan dengan pengertian tarik/tekan yang terbalik.'
    },
    remediation: {
      en: 'Use the sign of the solved force to decide tension or compression after equilibrium is satisfied.',
      id: 'Gunakan tanda hasil gaya untuk menentukan tarik atau tekan setelah keseimbangan terpenuhi.'
    },
    relatedSkills: ['memberForces']
  }
};

export function getMisconceptionDefinition(code: string): MisconceptionDefinition | null {
  return code in misconceptionCatalog ? misconceptionCatalog[code as MisconceptionCode] : null;
}
