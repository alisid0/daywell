import Link from "next/link";
import { PageStyle } from "../page-style";
import { ContactEmail } from "../owner-details";
export const metadata = { title: "Delete your account · Daywell" };
export default function DeleteAccountHelp() {
  return <main className="daywell-page"><PageStyle /><article className="well-space daywell-page-inner daywell-legal">
    <h1>Delete your Daywell account</h1>
    <p>You can manage your account in a browser. You do not need to install an app or give a reason.</p>
    <ol><li><Link href="/account">Open Your data</Link> and sign in to the account you want to close.</li><li>You can download your saved records first.</li><li>Choose Review account closure, check the explanation, then confirm.</li><li>Keep your status receipt. If the connection is lost, use Check account status.</li></ol>
    <p>Your active Daywell records are removed and new saves are blocked. Provider records, backups and subscriptions are handled separately; read <Link href="/privacy">the privacy notice</Link>.</p>
    <p>If you cannot sign in, contact <ContactEmail />. Do not send passwords, payment details or private photos. Account ownership must be verified before anyone removes records for you.</p>
    <Link className="well-button" href="/account">Open Your data</Link>
  </article></main>;
}
