import { AppProviders } from "./providers";
import { AppRoutes } from "@/routes/AppRoutes";

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
