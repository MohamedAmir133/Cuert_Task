import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateTaskDto,
    mapUpdateTaskDto,
    validateCreateTaskDto,
    validateUpdateTaskDto,
} from "../dtos/task_dto.js";
import { hasValidationErrors, isPositiveInteger } from "../dtos/shared_dto.js";
import { sendError, sendSuccess } from "../utils/responses.js";
import { sanitizeTask } from "../utils/sanitize.js";

const taskRepository = () => AppDataSource.getRepository("Task");
const projectRepository = () => AppDataSource.getRepository("Project");
const userRepository = () => AppDataSource.getRepository("User");
const defaultPage = 1;
const defaultLimit = 10;

const findProject = (projectId) => {
    return projectRepository().findOne({
        where: { id: Number(projectId) },
        relations: { owner: true, members: true },
    });
};

const findAssignee = (assignedTo) => {
    if (assignedTo === undefined || assignedTo === null) {
        return null;
    }

    return userRepository().findOneBy({ id: Number(assignedTo) });
};

const getAssignedTo = (body) => body.assignedTo ?? body.assigneeId;

const getPagination = (query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : defaultPage;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
};

const canAccessProject = (project, userId) => {
    return project.owner?.id === userId || project.members?.some((member) => member.id === userId);
};

const isProjectMember = (project, userId) => {
    return project.members?.some((member) => member.id === userId);
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
    if (!canAccessProject(project, req.user.id)) {
        return sendError(res, 403, "You do not have access to this project.");
    }

    const assignedTo = getAssignedTo(req.body);
    const assignee = await findAssignee(assignedTo);
    if (assignedTo !== undefined && assignedTo !== null && !assignee) {
        return sendError(res, 404, "Assignee user not found.");
    }
    if (assignee && !isProjectMember(project, assignee.id)) {
        return sendError(res, 400, "assignedTo must be a member of the project.");
    }

    const task = taskRepository().create(mapCreateTaskDto(req.body, project, assignee));

    const savedTask = await taskRepository().save(task);
    return sendSuccess(res, 201, "Task created successfully.", sanitizeTask(savedTask));
};

export const getTasks = async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const query = taskRepository()
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.project", "project")
        .leftJoinAndSelect("project.owner", "owner")
        .leftJoinAndSelect("project.members", "member")
        .leftJoinAndSelect("task.assignee", "assignee")
        .where("(owner.id = :userId OR member.id = :userId)", { userId: req.user.id })
        .orderBy("task.id", "ASC")
        .skip(skip)
        .take(limit);

    if (req.query.projectId !== undefined) {
        if (!isPositiveInteger(req.query.projectId)) {
            return sendError(res, 400, "projectId query must be a positive integer.");
        }
        query.andWhere("project.id = :projectId", { projectId: Number(req.query.projectId) });
    }

    if (typeof req.query.status === "string" && req.query.status.trim() !== "") {
        query.andWhere("LOWER(task.status) = :status", { status: req.query.status.trim().toLowerCase() });
    }
    if (typeof req.query.priority === "string" && req.query.priority.trim() !== "") {
        query.andWhere("LOWER(task.priority) = :priority", { priority: req.query.priority.trim().toLowerCase() });
    }
    if (req.query.assignedTo !== undefined) {
        if (!isPositiveInteger(req.query.assignedTo)) {
            return sendError(res, 400, "assignedTo query must be a positive user id.");
        }
        query.andWhere("assignee.id = :assignedTo", { assignedTo: Number(req.query.assignedTo) });
    }

    const [tasks, total] = await query.getManyAndCount();

    return sendSuccess(res, 200, "Tasks fetched successfully.", {
        items: tasks.map(sanitizeTask),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};

export const getTaskById = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Task id must be a positive integer.");
    }

    const task = await taskRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { project: { owner: true, members: true }, assignee: true },
    });

    if (!task) {
        return sendError(res, 404, "Task not found.");
    }
    if (!canAccessProject(task.project, req.user.id)) {
        return sendError(res, 403, "You do not have access to this task.");
    }

    return sendSuccess(res, 200, "Task fetched successfully.", sanitizeTask(task));
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
        relations: { project: { owner: true, members: true }, assignee: true },
    });

    if (!task) {
        return sendError(res, 404, "Task not found.");
    }
    if (!canAccessProject(task.project, req.user.id)) {
        return sendError(res, 403, "You do not have access to this task.");
    }

    if (req.body.projectId !== undefined) {
        const project = await findProject(req.body.projectId);
        if (!project) {
            return sendError(res, 404, "Project not found.");
        }
        if (!canAccessProject(project, req.user.id)) {
            return sendError(res, 403, "You do not have access to this project.");
        }
        task.project = project;
    }

    const assignedTo = getAssignedTo(req.body);
    if (assignedTo !== undefined) {
        const assignee = await findAssignee(assignedTo);
        if (assignedTo !== null && !assignee) {
            return sendError(res, 404, "Assignee user not found.");
        }
        if (assignee && !isProjectMember(task.project, assignee.id)) {
            return sendError(res, 400, "assignedTo must be a member of the project.");
        }
        task.assignee = assignee;
    }

    Object.assign(task, mapUpdateTaskDto(req.body));

    const savedTask = await taskRepository().save(task);
    return sendSuccess(res, 200, "Task updated successfully.", sanitizeTask(savedTask));
};

export const deleteTask = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Task id must be a positive integer.");
    }

    const task = await taskRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { project: { owner: true, members: true } },
    });
    if (!task) {
        return sendError(res, 404, "Task not found.");
    }
    if (!canAccessProject(task.project, req.user.id)) {
        return sendError(res, 403, "You do not have access to this task.");
    }

    await taskRepository().remove(task);
    return sendSuccess(res, 200, "Task deleted successfully.");
};
