import { strategicAreas } from "@/content/company";

/**
 * The numbered "01 Educación y capacitación / 02 Infraestructura..." list —
 * was identical copy-pasted JSX in both nosotros/page.tsx and
 * proyectos/page.tsx. `className` only carries spacing since that's the one
 * thing the two call sites actually varied (mt-10 vs mt-6, matching the
 * different heading treatment each page uses above the list).
 */
export function StrategicAreasList({
  className = "mt-10",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${className} divide-y divide-white/10 border-y border-white/10`}
    >
      {strategicAreas.map((area, i) => (
        <div
          key={area.label}
          className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8"
        >
          <span className="shrink-0 font-mono text-sm text-[var(--cyan)]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="text-base font-semibold text-white">
              {area.label}
            </p>
            <p className="mt-1 text-sm text-white/70">{area.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
