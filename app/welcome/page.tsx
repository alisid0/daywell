import Daywell from "../daywell";
import { accountOf, requirePlanUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await requirePlanUser("/welcome");
  return <Daywell showWelcome account={accountOf(user)} />;
}
