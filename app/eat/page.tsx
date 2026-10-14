import Daywell from "../daywell";
import { accountOf, requirePlanUser } from "../chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function EatPage() {
  const user = await requirePlanUser("/eat");
  return <Daywell initialView="eat" account={accountOf(user)}/>;
}
