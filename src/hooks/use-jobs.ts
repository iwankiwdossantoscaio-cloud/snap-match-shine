import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllJobs } from "@/lib/job-sources";
import { calculateMatchScore } from "@/lib/matching-engine";
import { useStore } from "@/lib/store";

export function useJobs() {
  const { data } = useStore();
  return useQuery({
    queryKey: ["jobs", data.settings.showDemoJobs],
    queryFn: () => fetchAllJobs(data.settings.showDemoJobs),
  });
}

export function useMatches() {
  const { data } = useStore();
  const jobs = useJobs();
  const matches = useMemo(
    () =>
      (jobs.data ?? [])
        .map((job) => ({ job, match: calculateMatchScore(data, job) }))
        .sort((a, b) => b.match.overall - a.match.overall),
    [jobs.data, data],
  );
  return { ...jobs, matches };
}

export function hasProfile(d: ReturnType<typeof useStore>["data"]) {
  return !!(d.profile.fullName || d.skills.length || d.experiences.length);
}
