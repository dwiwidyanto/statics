import { describe, it, expect } from 'vitest';
import { solveEquilibrium } from '../src/lib/domain/solvers/equilibrium';
import { checkFbdModel } from '../src/lib/domain/validation/checker';
import { beamProblems } from '../src/content/problems/beam-problems';
import { 
  evaluateInternalForces, 
  generateDiagramPoints, 
  extractCriticalXPoints 
} from '../src/lib/domain/diagrams/beam-diagrams';
import { polarToCartesian, calculateMoment } from '../src/lib/domain/geometry/vector2d';

describe('Guided Beam Problem Bank Solver & Validation', () => {
  it('validates that all 15 problems are statically determinate and stable', () => {
    for (const problem of beamProblems) {
      const check = checkFbdModel(problem.body, problem.supports, problem.loads, 'en');
      expect(check.determinacy).toBe('statically_determinate');
      expect(check.stability).toBe('stable');
    }
  });

  it('correctly solves reactions for all 15 problems', () => {
    for (const problem of beamProblems) {
      const result = solveEquilibrium(problem.body, problem.supports, problem.loads);
      expect(result.isSolved).toBe(true);

      // Verify global force and moment equilibrium using solved reactions
      let sumFx = 0;
      let sumFy = 0;
      let sumM = 0;

      const pivot = { x: 0, y: 0 }; // moment about x=0, y=0

      // Add applied loads contributions
      for (const load of problem.loads) {
        if (load.type === 'point_force') {
          const forceVec = polarToCartesian(load.magnitude, load.angle);
          sumFx += forceVec.x;
          sumFy += forceVec.y;
          sumM += calculateMoment(forceVec, load.position, pivot);
        } else if (load.type === 'body_weight') {
          const forceVec = { x: 0, y: -load.magnitude };
          sumFx += forceVec.x;
          sumFy += forceVec.y;
          sumM += calculateMoment(forceVec, load.position, pivot);
        } else if (load.type === 'applied_moment') {
          sumM += load.magnitude; // positive = CCW
        } else if (load.type === 'distributed_load') {
          // Equivalent point load resultant
          const length = load.endPosition.x - load.startPosition.x;
          const totalForce = ((load.magnitudeStart + load.magnitudeEnd) / 2) * length;
          const forceVec = polarToCartesian(totalForce, load.angle);
          
          let centroidRatio = 0.5;
          if (load.magnitudeStart + load.magnitudeEnd > 0) {
            centroidRatio = (load.magnitudeStart + 2 * load.magnitudeEnd) / (3 * (load.magnitudeStart + load.magnitudeEnd));
          }
          const xc = load.startPosition.x + length * centroidRatio;
          const appPos = { x: xc, y: load.startPosition.y };

          sumFx += forceVec.x;
          sumFy += forceVec.y;
          sumM += calculateMoment(forceVec, appPos, pivot);
        }
      }

      // Add reaction contributions
      for (const s of problem.supports) {
        const reactionsList = result.reactions;
        if (s.type === 'pin' || s.type === 'fixed') {
          const rx = reactionsList[`R_${s.label}x`] ?? 0;
          const ry = reactionsList[`R_${s.label}y`] ?? 0;
          sumFx += rx;
          sumFy += ry;
          sumM += calculateMoment({ x: rx, y: ry }, s.position, pivot);
        }
        if (s.type === 'roller') {
          const reactionAngle = (s.angle + 90) % 360;
          
          // Roller symbol could be R_By or R_B
          const rSymbol = reactionsList[`R_${s.label}y`] !== undefined ? `R_${s.label}y` : `R_${s.label}`;
          const rn = reactionsList[rSymbol] ?? 0;
          const forceVec = polarToCartesian(rn, reactionAngle);

          sumFx += forceVec.x;
          sumFy += forceVec.y;
          sumM += calculateMoment(forceVec, s.position, pivot);
        }
        if (s.type === 'fixed') {
          const rm = reactionsList[`M_${s.label}`] ?? 0;
          sumM += rm;
        }
      }

      // Sum of forces and moments must equal zero (within floating point tolerances)
      expect(sumFx).toBeCloseTo(0, 1);
      expect(sumFy).toBeCloseTo(0, 1);
      expect(sumM).toBeCloseTo(0, 1);
    }
  });
});

describe('Shear Force and Bending Moment Diagrams Logic', () => {
  it('correctly extracts critical X coordinates for simply supported beam', () => {
    const prob = beamProblems[0]; // SS beam midpoint load (x=0, x=3, x=6)
    const points = extractCriticalXPoints(prob.body, prob.supports, prob.loads);
    expect(points).toEqual([0, 3, 6]);
  });

  it('correctly extracts critical X coordinates for cantilever beam with partial load', () => {
    const prob = beamProblems[5]; // SS beam with UDL on x=2 to x=6
    const points = extractCriticalXPoints(prob.body, prob.supports, prob.loads);
    expect(points).toEqual([0, 2, 6]);
  });

  it('verifies boundary conditions and peak values for simply supported midpoint problem', () => {
    const prob = beamProblems[0]; // L = 6m, P = 800 N at x = 3m
    const result = solveEquilibrium(prob.body, prob.supports, prob.loads);
    
    // Evaluate shear and moment at ends and midpoint
    const startL = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 0.0, 'left');
    const startR = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 0.0, 'right');
    
    expect(startL.shear).toBeCloseTo(0);
    expect(startL.moment).toBeCloseTo(0);
    expect(startR.shear).toBeCloseTo(400); // R_Ay is 400
    expect(startR.moment).toBeCloseTo(0);

    const midL = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 3.0, 'left');
    const midR = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 3.0, 'right');
    
    expect(midL.shear).toBeCloseTo(400);
    expect(midL.moment).toBeCloseTo(1200); // M = R_Ay * 3 = 1200 N-m
    expect(midR.shear).toBeCloseTo(-400);  // shear drops by 800
    expect(midR.moment).toBeCloseTo(1200);

    const endL = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 6.0, 'left');
    const endR = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 6.0, 'right');

    expect(endL.shear).toBeCloseTo(-400);
    expect(endL.moment).toBeCloseTo(0);
    expect(endR.shear).toBeCloseTo(0);    // closed by R_By reaction
    expect(endR.moment).toBeCloseTo(0);
  });

  it('verifies boundary conditions and peak values for cantilever beam', () => {
    const prob = beamProblems[2]; // Fixed at x=0, L=4, P = 500 N downwards at x=4
    const result = solveEquilibrium(prob.body, prob.supports, prob.loads);

    // Wall at x=0
    const wallL = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 0.0, 'left');
    const wallR = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 0.0, 'right');

    expect(wallL.shear).toBeCloseTo(0);
    expect(wallL.moment).toBeCloseTo(0);
    expect(wallR.shear).toBeCloseTo(500); // reaction R_Ay = 500 N
    expect(wallR.moment).toBeCloseTo(-2000); // reaction moment M_A = 2000 CCW, which makes BMD start at -2000 (hogging)

    // Free end at x=4
    const endL = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 4.0, 'left');
    const endR = evaluateInternalForces(prob.body, prob.supports, prob.loads, result.reactions, 4.0, 'right');

    expect(endL.shear).toBeCloseTo(500);
    expect(endL.moment).toBeCloseTo(0);
    expect(endR.shear).toBeCloseTo(0);
    expect(endR.moment).toBeCloseTo(0);
  });

  it('generates diagram plotting coordinates successfully', () => {
    const prob = beamProblems[0];
    const result = solveEquilibrium(prob.body, prob.supports, prob.loads);
    const plotPoints = generateDiagramPoints(prob.body, prob.supports, prob.loads, result.reactions);
    
    // We expect points at 0, 3, 6 (with left/right limits, total 5 evaluations)
    // critX = [0, 3, 6]
    // i=0 (0 to 3): add 0+, 3-
    // i=1 (3 to 6): add 3+, 6-
    // last: add 6+
    // Total 5 points
    expect(plotPoints.length).toBe(5);
    expect(plotPoints[0].x).toBe(0.0);
    expect(plotPoints[1].x).toBe(3.0);
    expect(plotPoints[2].x).toBe(3.0);
    expect(plotPoints[3].x).toBe(6.0);
    expect(plotPoints[4].x).toBe(6.0);
  });
});
