import AppShell from "@/components/ui/AppShell";
import UserChartsConfig from "@/components/admin/UserChartsConfig";

// Dynamic segment [id] is available via params when real API is wired up.
// For now the component uses MOCK_USER — replace it with useParams() + fetch.
export default function UserGraficosPage() {
  return (
    <AppShell>
      <UserChartsConfig />
    </AppShell>
  );
}
