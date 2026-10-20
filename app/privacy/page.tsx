import Link from "next/link";
import { PageStyle } from "../page-style";
import { ContactEmail, OwnerName, TranscriptDays } from "../owner-details";
export const metadata = { title: "Privacy · Daywell" };
export default function Privacy() {
  return <main className="daywell-page"><PageStyle /><article className="well-space daywell-page-inner daywell-legal">
    <Link className="well-text-button" href="/">← Back to Daywell</Link>
    <div className="well-heading"><span>Private testing notice · 11 October 2026</span><h1>How Daywell uses your data</h1><p>Daywell keeps the records you choose to save. You can download those records or close your account from Your data.</p></div>
    <section><h2>Who runs Daywell</h2><p>Operator: <OwnerName />. Contact: <ContactEmail />.</p><p>This notice describes the private test. Operator details, provider retention and the public service’s privacy terms must be completed before public launch.</p></section>
    <section><h2>What Daywell saves</h2><ul>
      <li>Your plans, tasks, meals, shopping, food basket and its change history, movement, sleep, notes, profile details and settings.</li>
      <li>An account identifier from your verified sign-in, plus counters that limit paid features. The Daywell database does not need your email to link these records.</li>
      <li>On your device: unsaved food drafts are linked to your account. Reading, appearance, units and voice preferences are shared browser choices.</li>
    </ul><p>Food, sleep, movement and reflections may reveal personal information about your wellbeing. Daywell is for everyday routines, not medical advice.</p></section>
    <section><h2>When information leaves Daywell</h2><ul>
      <li><strong>Cloudflare</strong> hosts the app, database and private tester sign-in. Its sign-in service receives your email.</li>
      <li><strong>ElevenLabs</strong> handles live conversations and requested spoken replies. It receives the words or audio needed for that request. Conversations can include the timer state and proposed timer you are discussing. Transcript retention: <TranscriptDays />. We do not promise that every provider copy is immediately deleted.</li>
      <li><strong>OpenAI</strong> processes a food photo, recording or description when you request understanding. Meal suggestions can include your recorded ingredients and quantities. You review the result before saving. Daywell’s database keeps confirmed records, not the original image or recording; provider handling and safety exceptions are separate.</li>
      <li><strong>TypeSafe/JEV</strong>, when enabled, receives the short request and candidate replies to help choose a recording. Exact local matches do not need that request.</li>
      <li><strong>Your browser’s speech service</strong> may send speech to its vendor for recognition. Do not assume browser speech stays on the device.</li>
    </ul><p>Sharing details appear before connected features are used. You can add records by hand and use recorded sessions without starting a live conversation.</p></section>
    <section><h2>Download and closure</h2><p><Link href="/account">Your data</Link> downloads a consistent copy of your saved database records, including food history and usage counts. Device-only drafts, provider records, support records and backups are excluded and labelled in the file.</p>
      <p>Closing an account removes its active Daywell records and blocks new saves and AI requests for that sign-in. Connected browsers remove that account’s food drafts. Shared device preferences are kept; an offline device cannot be cleared until it reconnects.</p>
      <p>A minimal account key, closure time and receipt remain to stop older devices restoring erased data. Provider removal is not automated by this control. Backup retention and the operational removal process still require verification; there is no promise here of a fixed deletion period across all services.</p>
      <p>Closing Daywell does not delete an external sign-in account or cancel a subscription. For information outside the download, or a wider deletion request, use the contact above once configured. Necessary legal retention must be assessed and explained separately where lawful.</p></section>
    <section><h2>Other choices</h2><p>You can edit or remove saved entries in the app. For UK privacy concerns, you can contact the <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner’s Office</a>.</p></section>
    <section><h2>Audience and updates</h2><p>The private test is designed for adults. Public launch countries and audience details remain to be confirmed. This page will be updated when the service or its data handling changes.</p></section>
  </article></main>;
}
