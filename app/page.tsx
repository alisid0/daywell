import Daywell from "./daywell";
import {accountOf,requireChatGPTUser} from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Home(){const user=await requireChatGPTUser("/");return <Daywell account={accountOf(user)}/>}
