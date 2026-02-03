
import Assistants from "@/pages/Assistants";
import TrainingSessions from "@/pages/admin/TrainingSessions";
import AssistantSchedule from "@/pages/admin/AssistantSchedule";

export const assistantAdminRoutes = [
  {
    path: "/assistants",
    element: <Assistants />,
  },
  {
    path: "/admin/training-sessions",
    element: <TrainingSessions />,
  },
  {
    path: "/admin/assistant-schedule",
    element: <AssistantSchedule />,
  },
];
