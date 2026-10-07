import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, ScoreBadge, LoadingBlock } from "@/components/common";
import { useMatches } from "@/hooks/use-jobs";

export const Route = createFileRoute("/app/matches")({
  head: () => ({ meta: [{ title: "Matches — MatchCV" }, { name: "description", content: "Vagas ordenadas por compatibilidade." }, { property: "og:title", content: "Matches — MatchCV" }, { property: "og:description", content: "Vagas ordenadas por compatibilidade." }] }),
  component: () => {
    const { matches, isLoading } = useMatches();
    return (
      <div>
        <PageHeader title="Matches" description="Vagas ordenadas pelo seu percentual de compatibilidade." />
        {isLoading ? <LoadingBlock /> : (
          <ul className="space-y-2">
            {matches.map(({ job, match }) => (
              <li key={job.id}><Link to="/app/vagas/$jobId" params={{ jobId: job.id }} className="flex justify-between gap-3 rounded-lg border bg-card p-4 hover:border-primary">
                <div><div className="font-medium">{job.title}</div><div className="text-xs text-muted-foreground">Skills: {match.matchedSkills.join(", ") || "nenhuma"}</div></div>
                <ScoreBadge score={match.overall} /></Link></li>
            ))}
          </ul>
        )}
      </div>
    );
  },
});
