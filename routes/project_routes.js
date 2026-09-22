import { Router } from "express";
import {
    createProject,
    deleteProject,
    getProjectById,
    getProjects,
    updateProject,
} from "../controllers/project_controller.js";

const router = Router();

router.route("/").get(getProjects).post(createProject);
router.route("/:id").get(getProjectById).patch(updateProject).delete(deleteProject);

export default router;

