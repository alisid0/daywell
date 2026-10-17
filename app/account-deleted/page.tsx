import Link from "next/link";
import { redirect } from "next/navigation";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { readClosure, closureReceipt } from "@/lib/account-lifecycle";
import { PageStyle } from "../page-style";
export const dynamic = "force-dynamic";
export default async function AccountDeleted() {
  const user = await requireChatGPTUser("/account-deleted", true);
  const closure = await readClosure(database(), user.userId);
  if (!closure) redirect("/account");
  const receipt = closureReceipt(closure);
  return <main className="daywell-page"><PageStyle /><div className="well-space daywell-page-inner">
    <div className="well-heading"><span>Confirmed account status</span><h1>Your Daywell account is closed.</h1><p>Your saved records have been removed from Daywell’s active database. This sign-in can no longer save records or start new AI requests.</p></div>
    <section className="well-card"><h2>Your receipt</h2><p>Closed: <time dateTime={receipt.closedAt}>{receipt.closedAt}</time></p><p className="account-email">Reference: {receipt.requestId}</p><p>{receipt.retained}</p><p>Provider-held data still needs separate handling. This receipt does not confirm provider deletion or cancel a subscription.</p><p>This account’s food drafts are cleared on connected browsers. Shared reading and appearance preferences are kept.</p></section>
    <div className="well-actions daywell-page-actions"><a className="well-button" href={chatGPTSignOutPath("/")}>Sign out</a><Link className="well-button well-secondary" href="/privacy">Privacy details</Link><Link className="well-button well-secondary" href="/support">Help and support</Link></div>
  </div></main>;
}
