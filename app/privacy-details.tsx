import type { ReactNode } from "react";

/** Keep sharing information available before an action without crowding its controls. */
export function PrivacyDetails({ children }: { children: ReactNode }) {
  return <details className="privacy-details"><summary>Privacy &amp; details</summary><div>{children}</div></details>;
}
