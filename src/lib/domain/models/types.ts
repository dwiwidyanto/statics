export interface Point {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export type BodyType = 'beam' | 'block';

export interface RigidBody {
  id: string;
  type: BodyType;
  width: number;  // horizontal size (m)
  height: number; // vertical size (m)
  weight: number; // weight force (N) acting at centroid
}

export type SupportType = 'pin' | 'roller' | 'fixed';

export interface Support {
  id: string;
  type: SupportType;
  position: Point; // relative to body origin (bottom-left)
  angle: number;   // orientation angle in degrees (e.g. 0 = ground horizontal, roller rolls horizontally; 90 = vertical wall roller)
  label: string;   // e.g. "A", "B"
}

export type LoadType = 'point_force' | 'body_weight' | 'applied_moment' | 'distributed_load';

export interface BaseLoad {
  id: string;
  type: LoadType;
  label: string; // e.g. "F1", "M1", "w1"
}

export interface PointForceLoad extends BaseLoad {
  type: 'point_force';
  magnitude: number; // Force magnitude in N
  angle: number;     // Direction angle in degrees (0 = right, 90 = up, 180 = left, 270 = down)
  position: Point;   // Point of application
}

export interface BodyWeightLoad extends BaseLoad {
  type: 'body_weight';
  magnitude: number; // Weight in N
  position: Point;   // Centroid
}

export interface AppliedMomentLoad extends BaseLoad {
  type: 'applied_moment';
  magnitude: number; // Moment in N*m (positive = CCW, negative = CW)
  position: Point;   // Point of application
}

export interface DistributedLoad extends BaseLoad {
  type: 'distributed_load';
  magnitudeStart: number; // N/m at start
  magnitudeEnd: number;   // N/m at end
  startPosition: Point;   // start of distributed load
  endPosition: Point;     // end of distributed load
  angle: number;          // angle of the force vectors (e.g., 270 = pointing straight down)
}

export type Load = PointForceLoad | BodyWeightLoad | AppliedMomentLoad | DistributedLoad;

export type ReactionType = 'force_x' | 'force_y' | 'moment';

export interface Reaction {
  id: string;
  supportId: string;
  type: ReactionType;
  position: Point;
  symbol: string;    // e.g., "R_Ax", "R_Ay", "M_A"
  magnitude: number; // solved value
  direction: Vector2D; // standard direction vector (e.g., x-axis positive direction)
}

export interface EquationTerm {
  coefficient: number;
  variable: string; // e.g. "R_Ax" or "" for constant
  isUnknown: boolean;
  label: string; // descriptive formatting (e.g. "R_Ax", "100", "-50 * cos(30)")
}

export interface EquilibriumEquation {
  title: string; // e.g. "Sum Fx = 0"
  terms: EquationTerm[];
  rhs: number; // right hand side (sum of constants on RHS)
}

export interface SolverResult {
  isSolved: boolean;
  reactions: Record<string, number>; // Maps reaction symbol to value (N or N*m)
  equations: {
    fx: string;
    fy: string;
    moment: string;
  };
  momentPivot: Point; // pivot point used for moment equation
  determinacy: DeterminacyClassification;
  stability: StabilityClassification;
  messages: string[]; // Solver warnings / notes
}

export type StabilityClassification = 'stable' | 'unstable';
export type DeterminacyClassification = 'statically_determinate' | 'statically_indeterminate' | 'unstable';

export type ProblemTopic = 'fbd' | 'equilibrium' | 'determinacy' | 'beam-internal-forces';
export type ProblemDifficulty = 'easy' | 'medium' | 'hard';

export interface ReferenceSolution {
  reactions?: Record<string, number>;
  keySections?: Array<{ x: number; shear?: number; moment?: number }>;
  determinacy?: string;
  stability?: string;
}

export interface ProblemModel {
  id: string;
  title: string;
  titleId?: string;
  description: string;
  descriptionId?: string;
  body: RigidBody;
  supports: Support[];
  loads: Load[];
  expectedDeterminacy: DeterminacyClassification;
  expectedStability: StabilityClassification;
  hints: string[];
  hintsId?: string[];
  topic: ProblemTopic;
  difficulty: ProblemDifficulty;
  version: number;
  estimatedTimeMinutes?: number;
  learningObjectives: string[];
  referenceSolution?: ReferenceSolution;
}
