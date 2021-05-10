import canvasConfetti from "canvas-confetti";
import * as utils from "src/utils/common";

export function triggerFireworks(opts?: { durationMs?: number }) {
  const defaultDurationMs = 2000;
  const intervalMs = 150;
  const animationEnd = Date.now() + (opts?.durationMs ?? defaultDurationMs);

  const fireworksOptions: canvasConfetti.Options = {
    disableForReducedMotion: true,
    shapes: ["square"],
    zIndex: 2147483647, // highest possible z-index
    startVelocity: 35,
    spread: 360,
  };

  const interval = setInterval(() => {
    if (Date.now() > animationEnd) {
      clearInterval(interval);
    }
    canvasConfetti({
      ...fireworksOptions,
      origin: { x: utils.randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
    });
    canvasConfetti({
      ...fireworksOptions,
      origin: { x: utils.randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
    });
  }, intervalMs);
}
