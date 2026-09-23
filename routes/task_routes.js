import { Router } from "express";
import {
    createTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateTask,
} from "../controllers/task_controller.js";

const router = Router();

router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTaskById).patch(updateTask).delete(deleteTask);

export default router;
