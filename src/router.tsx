
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/publicRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";
import { customerRoutes } from "./routes/customerRoutes";

// Combine all routes
const router = createBrowserRouter([
  ...publicRoutes,
  ...adminRoutes,
  ...trainerRoutes,
  ...customerRoutes,
]);

export default router;
