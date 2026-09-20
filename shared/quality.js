// shared/quality.js
//
// Ported from cc-webgl/src/core/QualityManager.ts's tier/hysteresis state
// machine, adapted from THREE.js render settings (maxDPR/postProcessing/
// shadows) to a density/particle-count multiplier for canvas-2D pieces.
// Same FULL/REDUCED/FALLBACK tier vocabulary as cc-webgl.

const QUALITY_PROFILES = {
  FULL: { tier: 'FULL', particleScale: 1, throttleHidden: false },
  REDUCED: { tier: 'REDUCED', particleScale: 0.5, throttleHidden: true },
  FALLBACK: { tier: 'FALLBACK', particleScale: 0, throttleHidden: true },
};

// Consecutive samples required before a tier downgrade/upgrade, so a single
// fast/slow frame doesn't flip tiers.
const QUALITY_HYSTERESIS_SAMPLES = 5;
const QUALITY_SLOW_FRAME_MS = 32; // ~30fps
const QUALITY_FAST_FRAME_MS = 14; // ~70fps, headroom before upgrading

/** capabilityProbe: () => boolean, false => low-end/no-canvas2d signal.
 * reducedMotion: boolean, prefers-reduced-motion; clamps to REDUCED and
 * suspends automatic upgrade back to FULL. */
export function createQualityManager({ capabilityProbe, reducedMotion = false } = {}) {
  const hasCapability = capabilityProbe ? capabilityProbe() : true;
  let tier = hasCapability ? 'FULL' : 'FALLBACK';
  let reduced = reducedMotion;
  let consecutiveSlow = 0;
  let consecutiveFast = 0;
  let overridden = false;

  if (reduced && tier === 'FULL') tier = 'REDUCED';

  function setTier(next) {
    tier = next;
  }

  return {
    get tier() {
      return tier;
    },
    get profile() {
      return QUALITY_PROFILES[tier];
    },
    setReducedMotion(matches) {
      reduced = matches;
      if (reduced && tier === 'FULL') {
        consecutiveSlow = 0;
        consecutiveFast = 0;
        setTier('REDUCED');
      }
    },
    // Manually pin the tier (e.g. a demo/debug UI). Latches: reportFrameTime()
    // no-ops until releaseOverride() is called.
    forceTier(next) {
      overridden = true;
      consecutiveSlow = 0;
      consecutiveFast = 0;
      setTier(next);
    },
    releaseOverride() {
      overridden = false;
    },
    // Feed a frame time in ms; returns the (possibly unchanged) tier after
    // hysteresis.
    reportFrameTime(ms) {
      if (overridden) return tier;
      if (tier === 'FALLBACK') return tier; // not exited by frame timing
      if (reduced && tier === 'REDUCED') return tier; // reduced-motion pins at REDUCED

      if (ms >= QUALITY_SLOW_FRAME_MS) {
        consecutiveSlow += 1;
        consecutiveFast = 0;
      } else if (ms <= QUALITY_FAST_FRAME_MS) {
        consecutiveFast += 1;
        consecutiveSlow = 0;
      } else {
        consecutiveSlow = 0;
        consecutiveFast = 0;
      }

      if (consecutiveSlow >= QUALITY_HYSTERESIS_SAMPLES && tier === 'FULL') {
        setTier('REDUCED');
        consecutiveSlow = 0;
      } else if (
        consecutiveFast >= QUALITY_HYSTERESIS_SAMPLES &&
        tier === 'REDUCED' &&
        !reduced
      ) {
        setTier('FULL');
        consecutiveFast = 0;
      }
      return tier;
    },
  };
}

/** True if the environment signals prefers-reduced-motion:reduce. Returns
 * false (not "unknown") when matchMedia is unavailable. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
