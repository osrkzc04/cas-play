import { RouterProvider } from "react-router-dom";

import { AppProviders } from "./providers";
import { router } from "@/routes/AppRoutes";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
