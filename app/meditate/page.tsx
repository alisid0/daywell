import { requireChatGPTUser } from '@/app/chatgpt-auth';
import MeditationSpace from './space';
export const dynamic = 'force-dynamic';
export default async function MeditationPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  await requireChatGPTUser('/meditate');
  const query = await searchParams;
  return <MeditationSpace initialSessionId={query.session} />;
}
