import type { TrussModel } from '../../lib/domain/truss/types';
import { solveTruss } from '../../lib/domain/truss/solver';

export const trussProblems: TrussModel[] = [
  {
    id: 'truss-simple-triangle',
    title: 'Guided Problem 1: Simple Triangular Truss',
    titleId: 'Soal Terpandu 1: Rangka Batang Segitiga Sederhana',
    description: 'A basic triangular truss with a span of 4 meters and height of 2 meters. A vertical load of 600 N pushes downwards at the apex C.',
    descriptionId: 'Rangka batang segitiga sederhana dengan bentang 4 meter dan tinggi 2 meter. Beban vertikal 600 N bekerja ke bawah pada titik puncak C.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0.0, y: 0.0 } },
      { id: 'j-b', label: 'B', position: { x: 4.0, y: 0.0 } },
      { id: 'j-c', label: 'C', position: { x: 2.0, y: 2.0 } }
    ],
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
      { id: 'm-ca', label: 'CA', jointA: 'j-c', jointB: 'j-a' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 4.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-c', magnitude: 600, angle: 270, label: 'P1' }
    ],
    topic: 'trusses',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 10,
    learningObjectives: ['Determine truss support reactions', 'Apply method of joints to solve member axial forces']
  },
  {
    id: 'truss-king-post',
    title: 'Guided Problem 2: King-Post Truss with Zero-Force Member',
    titleId: 'Soal Terpandu 2: Rangka Batang King-Post dengan Batang Gaya Nol',
    description: 'A 4-joint king-post style truss span of 4 meters. A load of 800 N is applied downwards at the top apex D. The vertical center post CD connects to the bottom chord at C.',
    descriptionId: 'Rangka batang king-post 4-titik hubung dengan bentang 4 meter. Beban 800 N bekerja ke bawah pada puncak D. Batang vertikal tengah CD terhubung ke batang bawah di C.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0.0, y: 0.0 } },
      { id: 'j-b', label: 'B', position: { x: 4.0, y: 0.0 } },
      { id: 'j-c', label: 'C', position: { x: 2.0, y: 0.0 } },
      { id: 'j-d', label: 'D', position: { x: 2.0, y: 2.0 } }
    ],
    members: [
      { id: 'm-ac', label: 'AC', jointA: 'j-a', jointB: 'j-c' },
      { id: 'm-cb', label: 'CB', jointA: 'j-c', jointB: 'j-b' },
      { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
      { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
      { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 4.0, y: 0.0 }, angle: 0, label: 'B' }
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-d', magnitude: 800, angle: 270, label: 'P1' }
    ],
    topic: 'trusses',
    difficulty: 'easy',
    version: 1,
    estimatedTimeMinutes: 12,
    learningObjectives: ['Identify collinear members at unsupported joint', 'Calculate zero-force members by inspection']
  },
  {
    id: 'truss-small-pratt',
    title: 'Guided Problem 3: Small Pratt Truss',
    titleId: 'Soal Terpandu 3: Rangka Batang Pratt Kecil',
    description: 'A 6-joint, 9-member Pratt truss with a span of 6 meters and height of 2 meters. A load of 600 N is applied downwards at the center joint B.',
    descriptionId: 'Rangka batang Pratt 6-titik hubung dengan 9 batang dan bentang 6 meter serta tinggi 2 meter. Beban 600 N diterapkan ke bawah pada titik hubung tengah B.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0.0, y: 0.0 } },
      { id: 'j-b', label: 'B', position: { x: 3.0, y: 0.0 } },
      { id: 'j-c', label: 'C', position: { x: 6.0, y: 0.0 } },
      { id: 'j-d', label: 'D', position: { x: 0.0, y: 2.0 } },
      { id: 'j-e', label: 'E', position: { x: 3.0, y: 2.0 } },
      { id: 'j-f', label: 'F', position: { x: 6.0, y: 2.0 } }
    ],
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
      { id: 'm-de', label: 'DE', jointA: 'j-d', jointB: 'j-e' },
      { id: 'm-ef', label: 'EF', jointA: 'j-e', jointB: 'j-f' },
      { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
      { id: 'm-be', label: 'BE', jointA: 'j-b', jointB: 'j-e' },
      { id: 'm-cf', label: 'CF', jointA: 'j-c', jointB: 'j-f' },
      { id: 'm-ae', label: 'AE', jointA: 'j-a', jointB: 'j-e' },
      { id: 'm-ce', label: 'CE', jointA: 'j-c', jointB: 'j-e' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-c', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'C' }
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-b', magnitude: 600, angle: 270, label: 'P1' }
    ],
    topic: 'trusses',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 15,
    learningObjectives: ['Analyze multi-panel trusses', 'Resolve diagonal member forces using geometry']
  },
  {
    id: 'truss-unloaded-joint',
    title: 'Guided Problem 4: Truss with Overhang Zero-Force Members',
    titleId: 'Soal Terpandu 4: Rangka Batang dengan Batang Gaya Nol Menggantung',
    description: 'A triangular truss with an overhang extension to the right-hand side. Joint E at the top-right overhang is unsupported and unloaded, containing two meeting members.',
    descriptionId: 'Rangka batang segitiga dengan perpanjangan menggantung di sisi kanan. Titik hubung E di ujung kanan atas menggantung tidak memiliki tumpuan maupun beban luar.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0.0, y: 0.0 } },
      { id: 'j-b', label: 'B', position: { x: 3.0, y: 0.0 } },
      { id: 'j-c', label: 'C', position: { x: 6.0, y: 0.0 } },
      { id: 'j-d', label: 'D', position: { x: 3.0, y: 3.0 } },
      { id: 'j-e', label: 'E', position: { x: 6.0, y: 3.0 } }
    ],
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
      { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
      { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' },
      { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
      { id: 'm-de', label: 'DE', jointA: 'j-d', jointB: 'j-e' },
      { id: 'm-ce', label: 'CE', jointA: 'j-c', jointB: 'j-e' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-c', type: 'roller', position: { x: 6.0, y: 0.0 }, angle: 0, label: 'C' }
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-d', magnitude: 600, angle: 270, label: 'P1' }
    ],
    topic: 'trusses',
    difficulty: 'medium',
    version: 1,
    estimatedTimeMinutes: 15,
    learningObjectives: ['Apply zero-force member Rule 1 to non-collinear joint connections', 'Determine forces of complex overhang geometries']
  },
  {
    id: 'truss-symmetric-warren',
    title: 'Guided Problem 5: Symmetric Warren Truss',
    titleId: 'Soal Terpandu 5: Rangka Batang Warren Simetris',
    description: 'A 7-joint Warren truss with a total span of 12 meters, consisting of 11 members. A single downward force of 600 N is applied at the center top joint F.',
    descriptionId: 'Rangka batang Warren 7-titik hubung dengan bentang 12 meter dan 11 batang. Beban 600 N bekerja ke bawah pada titik hubung atas bagian tengah F.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0.0, y: 0.0 } },
      { id: 'j-b', label: 'B', position: { x: 4.0, y: 0.0 } },
      { id: 'j-c', label: 'C', position: { x: 8.0, y: 0.0 } },
      { id: 'j-d', label: 'D', position: { x: 12.0, y: 0.0 } },
      { id: 'j-e', label: 'E', position: { x: 2.0, y: 3.0 } },
      { id: 'j-f', label: 'F', position: { x: 6.0, y: 3.0 } },
      { id: 'j-g', label: 'G', position: { x: 10.0, y: 3.0 } }
    ],
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
      { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' },
      { id: 'm-ef', label: 'EF', jointA: 'j-e', jointB: 'j-f' },
      { id: 'm-fg', label: 'FG', jointA: 'j-f', jointB: 'j-g' },
      { id: 'm-ae', label: 'AE', jointA: 'j-a', jointB: 'j-e' },
      { id: 'm-be', label: 'BE', jointA: 'j-b', jointB: 'j-e' },
      { id: 'm-bf', label: 'BF', jointA: 'j-b', jointB: 'j-f' },
      { id: 'm-cf', label: 'CF', jointA: 'j-c', jointB: 'j-f' },
      { id: 'm-cg', label: 'CG', jointA: 'j-c', jointB: 'j-g' },
      { id: 'm-dg', label: 'DG', jointA: 'j-d', jointB: 'j-g' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0.0, y: 0.0 }, angle: 0, label: 'A' },
      { id: 'supp-d', type: 'roller', position: { x: 12.0, y: 0.0 }, angle: 0, label: 'D' }
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-f', magnitude: 600, angle: 270, label: 'P1' }
    ],
    topic: 'trusses',
    difficulty: 'hard',
    version: 1,
    estimatedTimeMinutes: 20,
    learningObjectives: ['Utilize symmetry to check support reactions and member forces', 'Perform step-by-step method of joints on advanced web layout']
  }
];

trussProblems.forEach((problem, index) => {
  problem.moduleOrder = index + 1;
  problem.prerequisiteProblemIds = index === 0 ? [] : [trussProblems[index - 1].id];
  problem.recommendedNextIds = trussProblems[index + 1] ? [trussProblems[index + 1].id] : [];
  problem.skillTags = [
    'truss-reactions',
    'method-of-joints',
    problem.referenceSolution?.zeroForceMembers?.length ? 'zeroForceMembers' : 'memberForces',
    problem.difficulty
  ];
});

// Eagerly calculate reference solutions for all determinate problems
for (const problem of trussProblems) {
  const result = solveTruss(problem);
  if (result.isSolved) {
    problem.referenceSolution = {
      reactions: result.reactions,
      memberForces: result.memberForces,
      zeroForceMembers: result.zeroForceMembers,
      determinacy: result.determinacy,
      stability: result.stability
    };
  }
}

for (const problem of trussProblems) {
  problem.skillTags = [
    'truss-reactions',
    'method-of-joints',
    problem.referenceSolution?.zeroForceMembers?.length ? 'zeroForceMembers' : 'memberForces',
    problem.difficulty
  ];
}
