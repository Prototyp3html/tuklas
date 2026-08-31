import type { CampaignProgress, FunnelStage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The cost funnel, shown narrowing.
 *
 * Every stage of the pipeline discards, and that discarding is the whole
 * reason the thing is cheap to run and the survivors are worth calling. So the
 * bars get *shorter* as the run proceeds, and each one says what it dropped
 * and why. A progress bar filling up would tell the opposite story.
 */
export function FunnelProgress({ progress }: { progress: CampaignProgress }) {
  const widest = Math.max(...progress.stages.map((s) => s.input), 1);

  return (
    <ol className="flex flex-col gap-4">
      {progress.stages.map((stage) => (
        <StageRow key={stage.agent} stage={stage} widest={widest} />
      ))}
    </ol>
  );
}

function StageRow({ stage, widest }: { stage: FunnelStage; widest: number }) {
  const surviving = stage.kept ?? stage.input - stage.dropped;
  const scale = Math.max(surviving / widest, 0.015);
  const pending = stage.status === "queued";
  const running = stage.status === "running";

  return (
    <li className={cn(pending && "opacity-45")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium">
          {stage.label}
          {running && <span className="text-muted-foreground"> — working</span>}
        </span>
        <span className="tabular text-sm">
          {pending ? (
            <span className="text-muted-foreground">queued</span>
          ) : (
            <>
              {surviving.toLocaleString()}{" "}
              <span className="text-muted-foreground text-xs">
                {stage.kept === null ? "so far" : "kept"}
              </span>
            </>
          )}
        </span>
      </div>

      {/* scaleX, not width: transforms don't cost layout on every frame. */}
      <div className="bg-band mt-1.5 h-2 overflow-hidden rounded-xs">
        <div
          style={{ transform: `scaleX(${scale})` }}
          className={cn(
            "h-full origin-left rounded-xs transition-transform duration-[400ms] ease-out",
            running ? "bg-verify/70" : "bg-verify",
            pending && "bg-muted-foreground/40",
          )}
        />
      </div>

      {stage.dropped > 0 && stage.dropReason && (
        <p className="text-muted-foreground mt-1.5 text-xs">
          <span className="tabular">{stage.dropped.toLocaleString()}</span>{" "}
          dropped — {stage.dropReason}
        </p>
      )}
    </li>
  );
}
