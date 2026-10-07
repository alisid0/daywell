import Daywell from "../daywell";
import { requireChatGPTUser } from "../chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function EatPage() {
  await requireChatGPTUser("/eat");
  return <Daywell initialView="eat"/>;
}
