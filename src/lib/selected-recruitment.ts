import { cookies } from "next/headers";

import { SELECTED_RECRUITMENT_COOKIE_NAME } from "@/constants/cookies.const";
import { getActiveRecruitment, getRecruitmentById } from "@/lib/recruitment";

/** Reads the recruitment currently selected in the dashboard sidebar. */
export async function getSelectedRecruitmentId(): Promise<number | null> {
  const store = await cookies();
  const value = store.get(SELECTED_RECRUITMENT_COOKIE_NAME)?.value;
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/** The recruitment the dashboard should operate on: the sidebar selection if it exists, otherwise the active one. */
export async function getTargetRecruitment() {
  const selectedId = await getSelectedRecruitmentId();

  if (selectedId) {
    const selected = await getRecruitmentById(selectedId);
    if (selected) return selected;
  }

  return getActiveRecruitment();
}

export async function getTargetRecruitmentId(): Promise<number | undefined> {
  return (await getTargetRecruitment())?.id;
}
