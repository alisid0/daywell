import Daywell from "../daywell";
import { accountOf, requireChatGPTUser } from "../chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function EatPage() {
  const user = await requireChatGPTUser("/eat");
  return <Daywell initialView="eat" account={accountOf(user)}/>;
}
