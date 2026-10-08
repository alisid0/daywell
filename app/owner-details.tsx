// Who runs Daywell and how long the voice provider keeps transcripts, shown on the privacy and
// support pages. Fill these in before launch; until then the pages show a highlighted gap.
const owner = { name: "", email: "", transcriptDays: 0 } as const;

const gap = (text: string) => <mark className="draft-gap">{text}</mark>;
export const OwnerName = () => owner.name ? <>{owner.name}</> : gap("owner’s name to be added");
export const ContactEmail = () => owner.email ? <a href={`mailto:${owner.email}`}>{owner.email}</a> : gap("contact email to be added");
export const TranscriptDays = () => owner.transcriptDays ? <>{owner.transcriptDays} days</> : gap("number of days to be set");
