import express from 'express';
import projectRoutes from "./routes/project_routes.js";
import taskRoutes from "./routes/task_routes.js";
import userRoutes from "./routes/user_routes.js";
import { sendError, sendSuccess } from "./utils/responses.js";


const app = express();

app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

export default app;
