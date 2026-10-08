import Link from "next/link";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { PageStyle } from "../page-style";

export default function AccountDeleted() {
  return <main className="daywell-page"><PageStyle /><div className="well-space daywell-page-inner">
    <div className="well-heading"><span>Your account</span><h1>Your account has been deleted.</h1><p>Everything Daywell had saved for you has been removed. Copies in our backups are cleared automatically within 30 days.</p></div>
    <div className="well-actions daywell-page-actions">
      <a className="well-button" href={chatGPTSignOutPath("/")}>Sign out</a>
      <Link className="well-button well-secondary" href="/">Start again</Link>
    </div>
  </div></main>;
}
