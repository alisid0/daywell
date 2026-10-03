import Daywell from "../daywell";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  await requireChatGPTUser("/welcome");
  return <Daywell showWelcome />;
}
