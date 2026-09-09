// shared/project.js
// 3D -> 2D projection for pieces that want perspective geometry.
//
// Shaped as an extension point: behaviour is configured through an options
// bag on a camera object, so future capability (roll, camera position, an
// orthographic mode) arrives as a new option that existing callers ignore,
// rather than a changed signature at every call site.
//
// Deliberately absent, by choice rather than oversight: depth sorting and
// occlusion, matrix stacks, lighting, mesh loading, orthographic mode.

// Rotate a point: yaw about Y, pitch about X, then roll about Z.
export function rotatePoint(x, y, z, { tilt = 0, yaw = 0, roll = 0 } = {}) {
  const cyaw = Math.cos(yaw);
  const syaw = Math.sin(yaw);
  const rx = x * cyaw - z * syaw;
  let rz = x * syaw + z * cyaw;

  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const ry = y * ct - rz * st;
  rz = y * st + rz * ct;

  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  return { x: rx * cr - ry * sr, y: rx * sr + ry * cr, z: rz };
}

export function createCamera({ tilt = 0, yaw = 0, roll = 0, fov = 600, cx = 0, cy = 0 } = {}) {
  const opt = { tilt, yaw, roll, fov, cx, cy };

  function project(x, y, z) {
    const r = rotatePoint(x, y, z, opt);
    const denom = opt.fov + r.z;
    // Near plane sits at 20% of the fov ahead of the lens (not at the lens
    // itself), capping scale at 1/0.2 = 5x. Without this, points just past
    // the lens (denom -> 0) blow up toward arbitrary magnification, which
    // canvas draw calls and exported paths share the same coordinates for —
    // canvas just clips silently at the screen edge, export doesn't. A
    // blown-up point lands off the visible frame whenever the near-plane
    // crossing is off the camera's optical axis, which any meaningful tilt
    // guarantees; a tilt at or near zero (camera roughly in the plane of
    // the geometry) is the degenerate exception where a dropped point can
    // still be near-frame, and dropping it can visibly change the render.
    // 0.2 was picked empirically: the lowest cap (searched in 0.01*fov
    // steps) at which event-horizon's SVG export at Scale 2, an angle
    // exposing the near plane, has no coordinate over magnitude 5000. At
    // or beyond the near plane there is no meaningful projection; scale 0
    // is the caller's signal to skip this point.
    const nearPlane = opt.fov * 0.2;
    if (denom <= nearPlane) return { x: 0, y: 0, scale: 0 };
    const scale = opt.fov / denom;
    return { x: opt.cx + r.x * scale, y: opt.cy + r.y * scale, scale };
  }

  return {
    project,
    projectPath(points) {
      return points.map((p) => project(p[0], p[1], p[2]));
    },
    set(partial) {
      Object.assign(opt, partial);
    },
  };
}
