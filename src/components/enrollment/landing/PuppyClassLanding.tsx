import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { EnrollmentForm } from "../EnrollmentForm";
import { PuppyInfoPack } from "./PuppyInfoPack";
import { LegalAccordions } from "./LegalAccordions";
import { useInfoPacks, usePuppyCourses } from "./useInfoPackData";

export function PuppyClassLanding() {
  const { data: packs = [], isLoading } = useInfoPacks();
  const [branchId, setBranchId] = useState<string | undefined>();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!branchId && packs.length > 0) setBranchId(packs[0].branch_id);
  }, [packs, branchId]);

  const activePack = useMemo(
    () => packs.find((p) => p.branch_id === branchId),
    [packs, branchId],
  );
  const { data: courses = [] } = usePuppyCourses(branchId);

  const allowedBranches = useMemo(
    () => packs.map((p) => ({ id: p.branch_id, name: p.branch.name })),
    [packs],
  );

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-customer-bg">
        <Loader2 className="h-6 w-6 animate-spin text-customer-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pack-bg">
      <div className="mx-auto max-w-[1560px] space-y-5 px-4 py-5 sm:px-6 sm:py-8 xl:px-8">
        <PuppyInfoPack
          packs={packs}
          activePack={activePack}
          courses={courses}
          onSelectBranch={setBranchId}
          onStart={scrollToForm}
        />
        <LegalAccordions />
      </div>

      <div ref={formRef}>
        <EnrollmentForm
          mode="public"
          branchOptions={allowedBranches}
          initialBranchId={branchId}
        />
      </div>
    </div>
  );
}
