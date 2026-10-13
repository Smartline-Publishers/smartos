import { StageStrip, type StripStage } from "@/components/charts/StageStrip";
import type { DashboardSummary } from "@/types/dashboard";

export interface BriefingHeroProps {
  summary: DashboardSummary;
  userName: string;
  dateLabel: string;
  greeting: string;
}

const STAGE_COLORS = ["#d9a93b", "#e8835a", "#5aa9e8", "#3f8f7a", "#9db4c6"];

/** Dark editorial briefing panel: greeting, headline insight, key figures, pipeline strip. */
export function BriefingHero({ summary, userName, dateLabel, greeting }: BriefingHeroProps) {
  const attention = summary.attention ?? [];
  const urgent = attention.filter((a) => a.severity === "high").length;
  const pipeline = summary.manuscriptPipeline ?? [];
  const awaiting = pipeline
    .filter((p) => p.stage === "Submitted" || p.stage === "In review")
    .reduce((n, p) => n + p.count, 0);
  const printing =
    summary.titlePipeline?.find((p) => p.stage === "Printing")?.count ?? 0;

  const headline =
    urgent > 0
      ? `${urgent} urgent ${urgent === 1 ? "item needs" : "items need"} your decision`
      : "Nothing urgent — the press schedule is on track";

  const stages: StripStage[] = pipeline.map((p, i) => ({
    label: p.stage,
    value: p.count,
    color: STAGE_COLORS[i % STAGE_COLORS.length],
  }));
  const stripLabel = `Manuscript pipeline: ${pipeline.map((p) => `${p.count} ${p.stage}`).join(", ") || "no data"}`;

  return (
    <section
      aria-label="Morning briefing"
      className="grid gap-6 rounded-2xl bg-press-900 p-6 text-cream md:p-8 lg:grid-cols-[1.2fr_1fr]"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-cream/70">{dateLabel} · Morning briefing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-[28px]">
          {greeting}, {userName}
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-cream/90">{headline}</p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt className="text-[13px] text-cream/70">Awaiting decision</dt>
            <dd className="text-3xl font-bold tabular-nums">{awaiting}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-cream/70">Print runs in progress</dt>
            <dd className="text-3xl font-bold tabular-nums">{printing}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-cream/70">Titles published</dt>
            <dd className="text-3xl font-bold tabular-nums">{summary.publishedBooks}</dd>
          </div>
        </dl>
      </div>
      <div className="min-w-0 rounded-xl bg-white/[0.06] p-5 ring-1 ring-white/10">
        <h3 className="text-[13px] font-semibold text-cream/80">Manuscript pipeline</h3>
        <p className="mt-0.5 text-xs text-cream/70">Every manuscript by review stage</p>
        <StageStrip stages={stages} label={stripLabel} tone="dark" className="mt-4" />
      </div>
    </section>
  );
}
