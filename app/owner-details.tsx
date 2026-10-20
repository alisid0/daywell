import owner from "@/config/owner.json";
const gap = (text: string) => <mark className="draft-gap">{text}</mark>;
export const OwnerName = () => owner.name ? <>{owner.name}</> : gap("operator details pending");
export const ContactEmail = () => owner.email ? <a href={`mailto:${owner.email}`}>{owner.email}</a> : gap("support contact pending");
export const TranscriptDays = () => owner.transcriptDays !== null ? <>{owner.transcriptDays} days (configured period; processing and exceptions may differ)</> : gap("retention settings not yet verified");
