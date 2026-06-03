import type { Support, Reaction, Vector2D } from '../models/types';
import { polarToCartesian } from '../geometry/vector2d';

export function getReactionsForSupport(support: Support): Reaction[] {
  const { id, type, position, angle, label } = support;
  const reactions: Reaction[] = [];

  if (type === 'pin') {
    // Pin support has horizontal and vertical reactions
    reactions.push({
      id: `${id}_rx`,
      supportId: id,
      type: 'force_x',
      position,
      symbol: `R_${label}x`,
      magnitude: 0,
      direction: { x: 1, y: 0 },
    });
    reactions.push({
      id: `${id}_ry`,
      supportId: id,
      type: 'force_y',
      position,
      symbol: `R_${label}y`,
      magnitude: 0,
      direction: { x: 0, y: 1 },
    });
  } else if (type === 'roller') {
    // Roller support has 1 reaction perpendicular to the roller surface
    // Roller angle is relative to horizontal ground (0 deg).
    // An angle of 0 means the roller rolls on horizontal surface, reaction is vertical (90 deg).
    // An angle of 90 means the roller rolls on vertical surface, reaction is horizontal (180 or 0 deg).
    // Reaction angle = support.angle + 90
    const reactionAngle = (angle + 90) % 360;
    const dir: Vector2D = polarToCartesian(1, reactionAngle);
    
    // Choose clean symbol based on typical angles
    let symbol = `R_${label}`;
    if (Math.abs(dir.x) < 1e-5 && Math.abs(dir.y - 1) < 1e-5) {
      symbol = `R_${label}y`;
    } else if (Math.abs(dir.y) < 1e-5 && Math.abs(dir.x - 1) < 1e-5) {
      symbol = `R_${label}x`;
    } else if (Math.abs(dir.x) < 1e-5 && Math.abs(dir.y + 1) < 1e-5) {
      symbol = `R_${label}y`;
    } else if (Math.abs(dir.y) < 1e-5 && Math.abs(dir.x + 1) < 1e-5) {
      symbol = `R_${label}x`;
    }

    reactions.push({
      id: `${id}_rn`,
      supportId: id,
      type: reactionAngle % 180 === 0 ? 'force_x' : (reactionAngle % 180 === 90 ? 'force_y' : 'force_y'), // Treat as force_y if diagonal or default
      position,
      symbol,
      magnitude: 0,
      direction: dir,
    });
  } else if (type === 'fixed') {
    // Fixed support has horizontal force, vertical force, and a reaction moment
    reactions.push({
      id: `${id}_rx`,
      supportId: id,
      type: 'force_x',
      position,
      symbol: `R_${label}x`,
      magnitude: 0,
      direction: { x: 1, y: 0 },
    });
    reactions.push({
      id: `${id}_ry`,
      supportId: id,
      type: 'force_y',
      position,
      symbol: `R_${label}y`,
      magnitude: 0,
      direction: { x: 0, y: 1 },
    });
    reactions.push({
      id: `${id}_m`,
      supportId: id,
      type: 'moment',
      position,
      symbol: `M_${label}`,
      magnitude: 0,
      direction: { x: 0, y: 0 }, // moments don't have linear direction vectors in 2D
    });
  }

  return reactions;
}
