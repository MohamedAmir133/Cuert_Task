import { In } from "typeorm";
import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateProjectDto,
    mapUpdateProjectDto,
    validateCreateProjectDto,
    validateUpdateProjectDto,
} from "../dtos/project_dto.js";
import { hasValidationErrors, isPositiveInteger } from "../dtos/shared_dto.js";
import { sendError, sendSuccess } from "../utils/responses.js";

const projectRepository = () => AppDataSource.getRepository("Project");
const userRepository = () => AppDataSource.getRepository("User");

const addProjectProgress = (project) => {
    const tasks = project.tasks || [];
    const doneTasks = tasks.filter((task) => task.status === "Done").length;

    return {
        ...project,
        progress: {
            totalTasks: tasks.length,
            doneTasks,
            percentage: tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100),
        },
    };
};

const getMembersByIds = async (memberIds = []) => {
    if (memberIds.length === 0) {
        return [];
    }

    const members = await userRepository().findBy({ id: In(memberIds.map(Number)) });
    return members;
};

export const createProject = async (req, res) => {
    const errors = validateCreateProjectDto(req.body);
    if (hasValidationErrors(errors)) {
        return sendError(res, 400, "Validation failed.", errors);
    }

    const members = await getMembersByIds(req.body.memberIds);
    if (req.body.memberIds && members.length !== req.body.memberIds.length) {
        return sendError(res, 404, "One or more project members were not found.");
    }

    const project = projectRepository().create(mapCreateProjectDto(req.body, members));

    const savedProject = await projectRepository().save(project);
    return sendSuccess(res, 201, "Project created successfully.", savedProject);
};

export const getProjects = async (_req, res) => {
    const projects = await projectRepository().find({
        relations: { members: true, tasks: true },
    });

    return sendSuccess(res, 200, "Projects fetched successfully.", projects.map(addProjectProgress));
};

export const getProjectById = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Project id must be a positive integer.");
    }

    const project = await projectRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { members: true, tasks: true },
    });

    if (!project) {
        return sendError(res, 404, "Project not found.");
    }

    return sendSuccess(res, 200, "Project fetched successfully.", addProjectProgress(project));
};

export const updateProject = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Project id must be a positive integer.");
    }

    const errors = validateUpdateProjectDto(req.body);
    if (hasValidationErrors(errors)) {
        return sendError(res, 400, "Validation failed.", errors);
    }

    const project = await projectRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { members: true, tasks: true },
    });

    if (!project) {
        return sendError(res, 404, "Project not found.");
    }

    Object.assign(project, mapUpdateProjectDto(req.body));

    if (req.body.memberIds !== undefined) {
        const members = await getMembersByIds(req.body.memberIds);
        if (members.length !== req.body.memberIds.length) {
            return sendError(res, 404, "One or more project members were not found.");
        }
        project.members = members;
    }

    const savedProject = await projectRepository().save(project);
    return sendSuccess(res, 200, "Project updated successfully.", addProjectProgress(savedProject));
};

export const deleteProject = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Project id must be a positive integer.");
    }

    const project = await projectRepository().findOneBy({ id: Number(req.params.id) });
    if (!project) {
        return sendError(res, 404, "Project not found.");
    }

    await projectRepository().remove(project);
    return sendSuccess(res, 200, "Project deleted successfully.");
};
