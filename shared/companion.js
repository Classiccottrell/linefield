// shared/companion.js
// A piece's side of the page current (shared/current.js): what a piece needs
// when a Forma object shares its page. Everything here works in the piece's
// own canvas pixels; the current itself speaks viewport pixels.
//
// Alone on a page (every gallery page, thumbnail, and plain baked export)
// `step()` returns null, nothing is published, and the piece must draw
// exactly what it draws without this module.

import { pageCurrent } from './current.js';

export function createCompanion({ canvas }) {
  const current = pageCurrent();
  const me = current.join('linefield');
  // Canvas px = (client px - origin) * scale.
  const map = { left: 0, top: 0, sx: 1, sy: 1 };
  // The object in the field, eased so it arrives and leaves without a snap.
  const body = { x: 0, y: 0, r: 0, disperse: 0, form: 'solid', presence: 0 };
  const scratch = [0, 0];
  let lastT = 0;
  let published = false;

  function measure() {
    const r = canvas.getBoundingClientRect();
    map.left = r.left; map.top = r.top;
    map.sx = r.width ? canvas.width / r.width : 1;
    map.sy = r.height ? canvas.height / r.height : 1;
  }

  return {
    /** Call first thing every frame. Returns the object sharing the page, in
     * canvas px ({ x, y, r, disperse, form, presence 0..1 }), or null when
     * the piece is alone. */
    step() {
      const now = performance.now();
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 0;
      lastT = now;
      const there = me.accompanied ? current.body : null;
      if (!there && body.presence <= 0) return null;
      measure();
      const k = Math.min(1, dt * 5);
      if (there) {
        const x = (there.x - map.left) * map.sx, y = (there.y - map.top) * map.sy, r = there.r * map.sx;
        if (body.presence <= 0) { body.x = x; body.y = y; body.r = r; body.disperse = there.disperse; }
        else {
          body.x += (x - body.x) * k; body.y += (y - body.y) * k; body.r += (r - body.r) * k;
          body.disperse += (there.disperse - body.disperse) * Math.min(1, dt * 8);
        }
        body.form = there.form;
      }
      body.presence += ((there ? 1 : 0) - body.presence) * Math.min(1, dt * 2.5);
      if (!there && body.presence < 0.002) { body.presence = 0; return null; }
      return body;
    },

    /** Publishes this piece's flow while it has company: `fn(x, y, out)` in
     * canvas px, writing a direction of length 0..1 into `out`. */
    field(fn) {
      if (!me.accompanied) {
        if (published) { me.publish('field', null); me.publish('palette', null); published = false; }
        return;
      }
      if (published) return;
      published = true;
      me.publish('field', {
        sample(x, y, t, out) {
          fn((x - map.left) * map.sx, (y - map.top) * map.sy, out);
          return out;
        },
      });
    },

    /** Publishes the piece's two colour stops ([r, g, b] 0..255). */
    palette(a, b, dark, name = null) {
      if (!me.accompanied) return;
      const p = current.palette;
      if (p && p.owner === me && p.a[0] === a[0] && p.a[1] === a[1] && p.a[2] === a[2]
        && p.b[0] === b[0] && p.b[1] === b[1] && p.b[2] === b[2] && p.dark === dark) return;
      me.publish('palette', { a: [...a], b: [...b], dark, name, owner: me });
    },

    /** What the cursor does at a canvas point, as a direction of length 0..1
     * (zero when alone). Returns a shared scratch array: read it at once. */
    cursor(x, y) {
      scratch[0] = 0; scratch[1] = 0;
      if (!me.accompanied) return scratch;
      return current.cursorAt(x / map.sx + map.left, y / map.sy + map.top, scratch);
    },

    destroy() { me.leave(); },
  };
}
