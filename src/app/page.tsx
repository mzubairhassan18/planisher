import { PlanisherMarketing } from "@/components/marketing/planisher-marketing";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Home() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();

  return <PlanisherMarketing isAuthenticated={Boolean(data?.claims?.sub)} />;
}
