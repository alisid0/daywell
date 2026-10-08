import Link from "next/link";
import { PageStyle } from "../page-style";
import { ContactEmail, OwnerName, TranscriptDays } from "../owner-details";

export const metadata = { title: "Privacy · Daywell" };
export default function Privacy() {
  return <main className="daywell-page"><PageStyle /><article className="well-space daywell-page-inner daywell-legal">
    <Link className="well-text-button" href="/">← Back to Daywell</Link>
    <div className="well-heading"><span>Last updated 8 October 2026</span><h1>How Daywell uses your data</h1><p>The short version: Daywell keeps what you save so it’s there next time. Nothing is sold, and there are no adverts or tracking.</p></div>
    <section><h2>Who runs Daywell</h2><p>Daywell is run by <OwnerName />. For anything about your data, email <ContactEmail />.</p></section>
    <section><h2>What Daywell saves</h2><ul>
      <li><strong>What you add:</strong> plans and tasks, notes and reflections, meals, your food basket and shopping list, sleep times, movement and your settings.</li>
      <li><strong>Who you are:</strong> a code made from your sign-in, so your records stay yours. Daywell’s database doesn’t store your email address.</li>
      <li><strong>How often you use live conversations,</strong> as counts that reset each day.</li>
      <li><strong>On this device only:</strong> your reading comfort, appearance and voice choices, and unsaved drafts. These stay in your browser.</li>
    </ul></section>
    <section><h2>Information about your health</h2><p>Sleep, meals, movement and reflections can say something about your health. Daywell uses them only to show and organise your own records for you. They’re never used for advertising or shared for anyone else’s purposes.</p></section>
    <section><h2>Services that help run Daywell</h2><ul>
      <li><strong>Cloudflare</strong> hosts Daywell and its database in Western Europe. It also handles signing in, using your email address.</li>
      <li><strong>ElevenLabs</strong> runs live voice and AI chat, only when you start a conversation. It receives what you say or type, and keeps written transcripts for <TranscriptDays />. Recordings of your voice aren’t kept.</li>
      <li><strong>OpenAI:</strong> Daywell doesn’t currently send your photos or recordings for analysis. If that changes, Daywell will ask you first.</li>
    </ul></section>
    <section><h2>How long it’s kept</h2><p>Until you delete it, or delete your account. Copies in our backups are cleared automatically within 30 days.</p></section>
    <section><h2>Your choices</h2><ul>
      <li>Download everything, or delete your account, at any time from <Link href="/account">Your data</Link>.</li>
      <li>Change or remove any entry in the app.</li>
      <li>Ask about your data by emailing <ContactEmail />.</li>
      <li>If you’re unhappy with how your data is handled, you can complain to the <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner’s Office</a>.</li>
    </ul></section>
    <section><h2>Children</h2><p>Daywell is designed for adults.</p></section>
    <section><h2>Changes</h2><p>If this changes, we’ll update this page and the date at the top.</p></section>
  </article></main>;
}
