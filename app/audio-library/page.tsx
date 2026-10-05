import { requireChatGPTUser } from '@/app/chatgpt-auth';
import AudioLibrary from './library';
export const dynamic = 'force-dynamic';
export default async function AudioLibraryPage() {
  await requireChatGPTUser('/audio-library');
  return <AudioLibrary />;
}
