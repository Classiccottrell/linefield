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

// Rotate a point: yaw about the Y axis, then tilt about the X axis.
export function rotatePoint(x, y, z, { tilt = 0, yaw = 0 } = {}) {
  const cyaw = Math.cos(yaw);
  const syaw = Math.sin(yaw);
  const rx = x * cyaw - z * syaw;
  let rz = x * syaw + z * cyaw;

  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const ry = y * ct - rz * st;
  rz = y * st + rz * ct;

  return { x: rx, y: ry, z: rz };
}

export function createCamera({ tilt = 0, yaw = 0, fov = 600, cx = 0, cy = 0 } = {}) {
  const opt = { tilt, yaw, fov, cx, cy };

  function project(x, y, z) {
    const r = rotatePoint(x, y, z, opt);
    const denom = opt.fov + r.z;
    // At or behind the camera plane there is no meaningful projection.
    // scale 0 is the caller's signal to skip this point.
    if (denom <= 1) return { x: 0, y: 0, scale: 0 };
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
