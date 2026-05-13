import AppShell from "@/components/ui/AppShell";
import UserChartsConfig from "@/components/admin/UserChartsConfig";

export default async function UserGraficosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <UserChartsConfig userId={id} />
    </AppShell>
  );
}
