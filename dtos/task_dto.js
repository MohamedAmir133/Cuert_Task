import { isPositiveInteger } from "./shared_dto.js";

export const TASK_STATUSES = ["To Do", "In Progress", "Done"];
export const TASK_PRIORITIES = ["Low", "Medium", "High"];

export const validateCreateTaskDto = (body) => {
    const errors = {};

    if (typeof body.title !== "string" || body.title.trim() === "") {
        errors.title = "Task title is required and must be a non-empty string.";
    }

    if (typeof body.description !== "string" || body.description.trim() === "") {
        errors.description = "Task description is required and must be a non-empty string.";
    }

    if (!isPositiveInteger(body.projectId)) {
        errors.projectId = "projectId is required and must be a positive project id.";
    }

    const assignedTo = body.assignedTo ?? body.assigneeId;
    if (assignedTo !== undefined && assignedTo !== null && !isPositiveInteger(assignedTo)) {
        errors.assignedTo = "assignedTo must be a positive user id or null.";
    }

    if (body.status !== undefined && !TASK_STATUSES.includes(body.status)) {
        errors.status = `Status must be one of: ${TASK_STATUSES.join(", ")}.`;
    }

    if (body.priority !== undefined && !TASK_PRIORITIES.includes(body.priority)) {
        errors.priority = `Priority must be one of: ${TASK_PRIORITIES.join(", ")}.`;
    }

    return errors;
};

export const validateUpdateTaskDto = (body) => {
    const errors = {};

    if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim() === "")) {
        errors.title = "Task title must be a non-empty string.";
    }

    if (body.description !== undefined && (typeof body.description !== "string" || body.description.trim() === "")) {
        errors.description = "Task description must be a non-empty string.";
    }

    if (body.projectId !== undefined && !isPositiveInteger(body.projectId)) {
        errors.projectId = "projectId must be a positive project id.";
    }

    const assignedTo = body.assignedTo ?? body.assigneeId;
    if (assignedTo !== undefined && assignedTo !== null && !isPositiveInteger(assignedTo)) {
        errors.assignedTo = "assignedTo must be a positive user id or null.";
    }

    if (body.status !== undefined && !TASK_STATUSES.includes(body.status)) {
        errors.status = `Status must be one of: ${TASK_STATUSES.join(", ")}.`;
    }

    if (body.priority !== undefined && !TASK_PRIORITIES.includes(body.priority)) {
        errors.priority = `Priority must be one of: ${TASK_PRIORITIES.join(", ")}.`;
    }

    return errors;
};

export const mapCreateTaskDto = (body, project, assignee) => ({
    title: body.title.trim(),
    description: body.description.trim(),
    status: body.status || "To Do",
    priority: body.priority || "Medium",
    project,
    assignee,
});

export const mapUpdateTaskDto = (body) => {
    const dto = {};

    if (body.title !== undefined) {
        dto.title = body.title.trim();
    }

    if (body.description !== undefined) {
        dto.description = body.description.trim();
    }

    if (body.status !== undefined) {
        dto.status = body.status;
    }

    if (body.priority !== undefined) {
        dto.priority = body.priority;
    }

    return dto;
};
