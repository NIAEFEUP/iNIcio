import type { CSSProperties } from "react";

const COLORS = [
  "#22c55e",
  "#38bdf8",
  "#facc15",
  "#f97316",
  "#a855f7",
  "#f43f5e",
];
const PARTICLE_COUNT = 48;

/** A short, non-interactive celebration shown after a candidate is accepted. */
export function AcceptanceConfetti() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const style: CSSProperties = {
          left: `${3 + ((index * 37) % 94)}%`,
          width: `${7 + ((index * 5) % 7)}px`,
          height: `${10 + ((index * 3) % 10)}px`,
          backgroundColor: COLORS[index % COLORS.length],
          animationDelay: `${(index % 8) * 45}ms`,
          animationDuration: `${1300 + ((index * 71) % 700)}ms`,
          borderRadius: index % 3 === 0 ? "999px" : "1px",
        };

        return (
          <span
            key={index}
            className="acceptance-confetti absolute -top-6 block"
            style={style}
          />
        );
      })}
    </div>
  );
}
