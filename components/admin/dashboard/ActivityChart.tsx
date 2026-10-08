import type { ActivityDay } from "@/lib/admin/queries";

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

function parseDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

/** "Nice" axis top: the next 1, 2, 5 × 10ⁿ at or above `max`. */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((s) => s * pow >= max)!;
  return step * pow;
}

/** Applications per day, as a single-series bar chart with a hover tooltip per bar. */
export default function ActivityChart({ days }: { days: ActivityDay[] }) {
  const top = niceMax(Math.max(0, ...days.map((d) => d.count)));
  const ticks = [top, top / 2, 0];
  const lastIndex = days.length - 1;

  return (
    <figure className="flex flex-1 flex-col">
      <div className="relative flex flex-1 gap-3" style={{ minHeight: 200 }}>
        {/* y-axis */}
        <div aria-hidden="true" className="flex w-6 flex-col justify-between pb-6 text-right text-[11px] text-gray-2 tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {t}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* gridlines */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((t) => (
              <span key={t} className={t === 0 ? "border-t border-ink/20" : "border-t border-dashed border-line"} />
            ))}
          </div>

          {/* bars */}
          <ol className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-[3px] sm:gap-1.5">
            {days.map((d, i) => {
              const date = parseDay(d.date);
              const isToday = i === lastIndex;
              const label = `${weekdayLabel.format(date)} ${dayLabel.format(date)}: ${d.count} application${d.count === 1 ? "" : "s"}`;
              return (
                <li
                  key={d.date}
                  tabIndex={0}
                  aria-label={label}
                  className="group relative flex h-full flex-1 items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="absolute inset-0 rounded-md transition-colors group-hover:bg-gray-3/70" aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className={
                      "relative w-full max-w-7 rounded-t-[4px] transition-[height,background-color] duration-500 " +
                      (d.count === 0
                        ? "bg-ink/10"
                        : isToday
                          ? "bg-primary"
                          : "bg-primary/55 group-hover:bg-primary")
                    }
                    style={{ height: d.count === 0 ? 2 : `${(d.count / top) * 100}%` }}
                  />
                  {/* tooltip */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 translate-y-1 rounded-xl border border-line bg-white px-3 py-2 text-left whitespace-nowrap opacity-0 shadow-[0_12px_32px_-12px_rgb(14_14_14/0.35)] transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  >
                    <span className="block text-[11px] text-gray-2">
                      {weekdayLabel.format(date)}, {dayLabel.format(date)}
                    </span>
                    <span className="block font-heading text-sm font-semibold text-ink tabular-nums">
                      {d.count} application{d.count === 1 ? "" : "s"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          {/* x-axis: first, middle and last day */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-5 items-end justify-between text-[11px] text-gray-2">
            {[0, Math.floor(lastIndex / 2), lastIndex].map((i) => (
              <span key={i}>{i === lastIndex ? "Today" : dayLabel.format(parseDay(days[i].date))}</span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Applications received per day over the last {days.length} days.
      </figcaption>
    </figure>
  );
}
