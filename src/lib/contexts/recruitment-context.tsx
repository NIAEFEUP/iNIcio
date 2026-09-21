"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setSelectedRecruitment } from "@/cookies/set";

interface RecruitmentContextValue {
  recruitmentId?: number | null;
  selectRecruitment: (id: number) => void;
}

const RecruitmentContext = React.createContext<RecruitmentContextValue>({
  recruitmentId: null,
  selectRecruitment: () => {},
});

export function useRecruitment() {
  return React.useContext(RecruitmentContext);
}

export function RecruitmentProvider({
  initialRecruitmentId,
  onSelectRecruitment,
  children,
}: {
  initialRecruitmentId?: number | null;
  onSelectRecruitment?: (id: number) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [recruitmentId, setRecruitmentId] = React.useState<
    number | null | undefined
  >(initialRecruitmentId);

  const [previousInitial, setPreviousInitial] = React.useState<
    number | null | undefined
  >(initialRecruitmentId);

  if (!Object.is(previousInitial, initialRecruitmentId)) {
    setPreviousInitial(initialRecruitmentId);
    setRecruitmentId(initialRecruitmentId);
  }

  const selectRecruitment = React.useCallback(
    (id: number) => {
      setSelectedRecruitment(id);
      setRecruitmentId(id);
      onSelectRecruitment?.(id);
      router.refresh();
    },
    [router, onSelectRecruitment],
  );

  const value = React.useMemo(
    () => ({ recruitmentId, selectRecruitment }),
    [recruitmentId, selectRecruitment],
  );

  return (
    <RecruitmentContext.Provider value={value}>
      {children}
    </RecruitmentContext.Provider>
  );
}
