import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { EnrollmentForm } from "@/components/enrollment/EnrollmentForm";
import { LegalAccordions } from "@/components/enrollment/landing/LegalAccordions";
import { useInfoPacks } from "@/components/enrollment/landing/useInfoPackData";

export default function PublicPuppyClassEnrol() {
  const [searchParams] = useSearchParams();
  const { data: packs = [], isLoading } = useInfoPacks();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const allowedBranches = useMemo(
    () => packs.map((p) => ({ id: p.branch_id, name: p.branch.name })),
    [packs],
  );

  const branchParam = searchParams.get("branch") ?? undefined;
  const initialBranchId = useMemo(() => {
    if (branchParam && packs.some((p) => p.branch_id === branchParam)) return branchParam;
    return packs[0]?.branch_id;
  }, [branchParam, packs]);

  return (
    <>
      <Helmet>
        <title>Puppy Class Enrolment | McKaynine Training Centre</title>
        <meta
          name="description"
          content="Complete your puppy class enrolment online — handler details, puppy details, vet clearance and course selection."
        />
        <link rel="canonical" href="https://talkingdog.co.za/register/puppy-class/enrol" />
        <meta property="og:title" content="Puppy Class Enrolment | McKaynine Training Centre" />
        <meta
          property="og:description"
          content="Complete your puppy class enrolment online with McKaynine Training Centre."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <main className="min-h-screen bg-pack-bg">
        <div className="mx-auto max-w-[1560px] px-4 pt-5 sm:px-6 sm:pt-8 xl:px-8">
          <Link
            to="/register/puppy-class"
            className="inline-flex items-center gap-2 text-sm font-medium text-customer-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course info
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-customer-accent" />
          </div>
        ) : (
          <EnrollmentForm
            mode="public"
            branchOptions={allowedBranches}
            initialBranchId={initialBranchId}
          />
        )}

        <div className="mx-auto max-w-[1560px] px-4 pb-10 sm:px-6 xl:px-8">
          <LegalAccordions />
        </div>
      </main>
    </>
  );
}
