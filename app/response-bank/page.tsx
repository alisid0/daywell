import { requireChatGPTUser } from '@/app/chatgpt-auth';
import ResponseBank from './bank';
export const dynamic = 'force-dynamic';
export default async function ResponseBankPage() {
  await requireChatGPTUser('/response-bank');
  return <ResponseBank />;
}
