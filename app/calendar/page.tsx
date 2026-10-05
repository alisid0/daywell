import Daywell from "../daywell";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";
export default async function CalendarPage() {
  await requireChatGPTUser("/calendar");
  return <Daywell initialView="calendar" />;
}
