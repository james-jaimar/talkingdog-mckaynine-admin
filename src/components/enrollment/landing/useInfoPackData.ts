import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PUBLIC_BRANCH_NAMES = ["Randburg", "Delta"];

export interface InfoPack {
  id: string;
  branch_id: string;
  hero_heading: string;
  hero_subheading: string;
  hero_image_url: string | null;
  trust_lines: string[];
  help_with: string[];
  start_age_note: string | null;
  vaccination_note: string | null;
  venue_name: string | null;
  venue_time: string | null;
  schedule_note: string | null;
  fee_includes: string | null;
  discount_note: string | null;
  what_to_bring: string[];
  joining_steps: string[];
  banking_details: string | null;
  cutoff_note: string | null;
  directions: string[];
  map_link: string | null;
  calls_note: string | null;
  weather_note: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_website: string | null;
  logo_url: string | null;
  map_image_url: string | null;
  missed_class_note: string | null;
  before_enrol_notes: string[];
  start_notes: string[];
  branch: { id: string; name: string };
}

const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** "Sep 5, 12, 19 · Oct 3, 17" from ISO date strings. */
export function formatLessonDates(dates: string[]): string {
  const groups: { month: string; days: number[] }[] = [];
  for (const raw of [...dates].sort()) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const month = d.toLocaleDateString("en-ZA", { month: "short" });
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.days.push(d.getDate());
    else groups.push({ month, days: [d.getDate()] });
  }
  return groups.map((g) => `${g.month} ${g.days.join(", ")}`).join(" · ");
}


/** Branches that accept public puppy registrations, with their info pack content. */
export function useInfoPacks() {
  return useQuery({
    queryKey: ["public-info-packs"],
    queryFn: async (): Promise<InfoPack[]> => {
      const { data, error } = await supabase
        .from("branch_info_packs")
        .select("*, branch:branches!branch_info_packs_branch_id_fkey(id, name)")
        .eq("is_published", true);
      if (error) throw error;

      return (data || [])
        .filter((row: any) => row.branch)
        .map((row: any) => ({
          ...row,
          trust_lines: asArray(row.trust_lines),
          help_with: asArray(row.help_with),
          what_to_bring: asArray(row.what_to_bring),
          joining_steps: asArray(row.joining_steps),
          directions: asArray(row.directions),
          before_enrol_notes: asArray(row.before_enrol_notes),
          start_notes: asArray(row.start_notes),

        }))
        .sort((a, b) => a.branch.name.localeCompare(b.branch.name));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface PuppyCourse {
  id: string;
  className: string;
  courseFee: number;
  enrollmentFee: number;
  startTime: string;
  dates: string[];
}

/** Upcoming puppy courses for a branch, driving the "Where & When" section. */
export function usePuppyCourses(branchId?: string) {
  return useQuery({
    queryKey: ["public-puppy-courses", branchId],
    enabled: !!branchId,
    queryFn: async (): Promise<PuppyCourse[]> => {
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select("id, name, course_fee, enrollment_fee")
        .eq("branch_id", branchId!)
        .eq("class_type", "Puppy")
        .eq("status", "open");
      if (classesError) throw classesError;
      if (!classes?.length) return [];

      const classIds = classes.map((c) => c.id);
      const { data: schedules, error: schedulesError } = await supabase
        .from("class_schedules")
        .select("id, class_id, start_time, selected_dates")
        .in("class_id", classIds)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(6);
      if (schedulesError) throw schedulesError;

      return (schedules || []).map((schedule) => {
        const cls = classes.find((c) => c.id === schedule.class_id);
        return {
          id: schedule.id,
          className: cls?.name ?? "Puppy Class",
          courseFee: Number(cls?.course_fee ?? 0),
          enrollmentFee: Number(cls?.enrollment_fee ?? 0),
          startTime: schedule.start_time,
          dates: schedule.selected_dates ?? [],
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
