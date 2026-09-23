import express from 'express';
import projectRoutes from "./routes/project_routes.js";
import taskRoutes from "./routes/task_routes.js";
import userRoutes from "./routes/user_routes.js";
import { login, register } from "./controllers/auth_controller.js";
import { requireAuth } from "./middlewares/auth_middleware.js";
import { errorHandler, notFoundHandler } from "./middlewares/error_middleware.js";


const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

app.post("/register", register);
app.post("/login", login);

app.use("/api/users", requireAuth, userRoutes);
app.use("/api/projects", requireAuth, projectRoutes);
app.use("/api/tasks", requireAuth, taskRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
