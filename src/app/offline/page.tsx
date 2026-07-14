import Link from "next/link";
import { CloudOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <span className="brand-mark">P</span>
      <CloudOff aria-hidden="true" size={34} />
      <h1>You are offline</h1>
      <p>
        Reconnect to open Planisher. Offline edits are intentionally disabled
        until project records and conflict handling are fully persistent.
      </p>
      <Link className="primary-button" href="/app">Try again</Link>
    </main>
  );
}
