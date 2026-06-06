import type { Point, Support, ProblemDifficulty } from '../models/types';

export interface TrussJoint {
  id: string;
  label: string; // e.g. "A", "B", "C"
  position: Point;
}

export interface TrussMember {
  id: string;
  label: string; // e.g. "AB", "BC", "M1"
  jointA: string; // Joint ID
  jointB: string; // Joint ID
}

export interface TrussJointLoad {
  id: string;
  jointId: string;
  magnitude: number; // Force magnitude in N
  angle: number;     // Direction angle in degrees CCW from +x (0 = right, 90 = up)
  label: string;     // e.g. "P1", "L1"
}

export interface TrussReferenceSolution {
  reactions?: Record<string, number>;
  memberForces?: Record<string, number>;
  zeroForceMembers?: string[];
  determinacy?: 'statically_determinate' | 'statically_indeterminate' | 'unstable';
  stability?: 'stable' | 'unstable';
}

export interface TrussModel {
  id: string;
  title: string;
  titleId?: string;
  description: string;
  descriptionId?: string;
  joints: TrussJoint[];
  members: TrussMember[];
  supports: Support[];
  loads: TrussJointLoad[];
  topic: 'trusses';
  difficulty: ProblemDifficulty;
  version: number;
  estimatedTimeMinutes?: number;
  learningObjectives: string[];
  referenceSolution?: TrussReferenceSolution;
}

export interface JointEquationStep {
  jointLabel: string;
  eqX: string;
  eqY: string;
  solved: Record<string, number>;
  explanation: string;
}

export interface TrussSolverResult {
  isSolved: boolean;
  determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable';
  stability: 'stable' | 'unstable';
  reactions: Record<string, number>;
  memberForces: Record<string, number>;
  zeroForceMembers: string[];
  jointEquations: JointEquationStep[];
  messages: string[];
}
