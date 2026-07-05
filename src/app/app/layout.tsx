import { AppShell } from "@/components/app-shell";
import { LocalDialogs } from "@/components/local-dialogs";
import { LocalStoreProvider } from "@/components/local-store";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocalStoreProvider>
      <AppShell>{children}</AppShell>
      <LocalDialogs />
    </LocalStoreProvider>
  );
}
