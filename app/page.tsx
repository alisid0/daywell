import Daywell from "./daywell";
import {accountOf,requirePlanUser} from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Home(){const user=await requirePlanUser("/");return <Daywell account={accountOf(user)}/>}
