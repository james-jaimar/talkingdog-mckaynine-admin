import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PuppyInfoPack } from "./PuppyInfoPack";
import { useInfoPacks, usePuppyCourses } from "./useInfoPackData";

export function PuppyClassLanding() {
  const { data: packs = [], isLoading } = useInfoPacks();
  const [branchId, setBranchId] = useState<string | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId && packs.length > 0) setBranchId(packs[0].branch_id);
  }, [packs, branchId]);

  const activePack = useMemo(
    () => packs.find((p) => p.branch_id === branchId),
    [packs, branchId],
  );
  const { data: courses = [] } = usePuppyCourses(branchId);

  const goToForm = () =>
    navigate(
      branchId
        ? `/register/puppy-class/enrol?branch=${branchId}`
        : "/register/puppy-class/enrol",
    );

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
          onStart={goToForm}
        />
      </div>
    </div>
  );
}

