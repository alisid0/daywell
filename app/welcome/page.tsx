import Daywell from "../daywell";
import { accountOf, requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await requireChatGPTUser("/welcome");
  return <Daywell showWelcome account={accountOf(user)} />;
}
