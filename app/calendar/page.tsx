import Daywell from "../daywell";
import { accountOf, requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";
export default async function CalendarPage() {
  const user = await requireChatGPTUser("/calendar");
  return <Daywell initialView="calendar" account={accountOf(user)} />;
}
