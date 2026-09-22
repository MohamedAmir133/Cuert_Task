import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateTaskDto,
    mapUpdateTaskDto,
    validateCreateTaskDto,
    validateUpdateTaskDto,
} from "../dtos/task_dto.js";
import { hasValidationErrors, isPositiveInteger } from "../dtos/shared_dto.js";
import { sendError, sendSuccess } from "../utils/responses.js";

const taskRepository = () => AppDataSource.getRepository("Task");
const projectRepository = () => AppDataSource.getRepository("Project");
const userRepository = () => AppDataSource.getRepository("User");

const findProject = (projectId) => {
    return projectRepository().findOneBy({ id: Number(projectId) });
};

const findAssignee = (assigneeId) => {
    if (assigneeId === undefined || assigneeId === null) {
        return null;
    }

    return userRepository().findOneBy({ id: Number(assigneeId) });
};

export const createTask = async (req, res) => {
    const errors = validateCreateTaskDto(req.body);
    if (hasValidationErrors(errors)) {
        return sendError(res, 400, "Validation failed.", errors);
    }

    const project = await findProject(req.body.projectId);
    if (!project) {
        return sendError(res, 404, "Project not found.");
    }

    const assignee = await findAssignee(req.body.assigneeId);
    if (req.body.assigneeId !== undefined && req.body.assigneeId !== null && !assignee) {
        return sendError(res, 404, "Assignee user not found.");
    }

    const task = taskRepository().create(mapCreateTaskDto(req.body, project, assignee));

    const savedTask = await taskRepository().save(task);
    return sendSuccess(res, 201, "Task created successfully.", savedTask);
};

export const getTasks = async (req, res) => {
    const where = {};

    if (req.query.projectId !== undefined) {
        if (!isPositiveInteger(req.query.projectId)) {
            return sendError(res, 400, "projectId query must be a positive integer.");
        }
        where.project = { id: Number(req.query.projectId) };
    }

    const tasks = await taskRepository().find({
        where,
        relations: { project: true, assignee: true },
        order: { id: "ASC" },
    });

    return sendSuccess(res, 200, "Tasks fetched successfully.", tasks);
};

export const getTaskById = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Task id must be a positive integer.");
    }

    const task = await taskRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { project: true, assignee: true },
    });

    if (!task) {
        return sendError(res, 404, "Task not found.");
    }

    return sendSuccess(res, 200, "Task fetched successfully.", task);
};

export const updateTask = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Task id must be a positive integer.");
    }

    const errors = validateUpdateTaskDto(req.body);
    if (hasValidationErrors(errors)) {
        return sendError(res, 400, "Validation failed.", errors);
    }

    const task = await taskRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { project: true, assignee: true },
    });

    if (!task) {
        return sendError(res, 404, "Task not found.");
    }
    //update project and assignee if provided in the request body
    // if (req.body.projectId !== undefined) {
    //     const project = await findProject(req.body.projectId);
    //     if (!project) {
    //         return sendError(res, 404, "Project not found.");
    //     }
    //     task.project = project;
    // }

    // if (req.body.assigneeId !== undefined) {
    //     const assignee = await findAssignee(req.body.assigneeId);
    //     if (req.body.assigneeId !== null && !assignee) {
    //         return sendError(res, 404, "Assignee user not found.");
    //     }
    //     task.assignee = assignee;
    // }

    Object.assign(task, mapUpdateTaskDto(req.body));

    const savedTask = await taskRepository().save(task);
    return sendSuccess(res, 200, "Task updated successfully.", savedTask);
};

export const deleteTask = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Task id must be a positive integer.");
    }

    const task = await taskRepository().findOneBy({ id: Number(req.params.id) });
    if (!task) {
        return sendError(res, 404, "Task not found.");
    }

    await taskRepository().remove(task);
    return sendSuccess(res, 200, "Task deleted successfully.");
};
