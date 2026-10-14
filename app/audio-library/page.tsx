import { requirePlanUser } from '@/app/chatgpt-auth';
import AudioLibrary from './library';
export const dynamic = 'force-dynamic';
export default async function AudioLibraryPage() {
  await requirePlanUser('/audio-library');
  return <AudioLibrary />;
}
