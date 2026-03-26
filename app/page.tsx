import ExperienceShell from "../components/ExperienceShell";
import { getProfile } from "../lib/site-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await getProfile();
  return <ExperienceShell initialProfile={profile} />;
}
