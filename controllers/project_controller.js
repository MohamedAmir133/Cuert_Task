import { Brackets, In } from "typeorm";
import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateProjectDto,
    mapUpdateProjectDto,
    validateCreateProjectDto,
    validateUpdateProjectDto,
} from "../dtos/project_dto.js";
import { hasValidationErrors, isPositiveInteger } from "../dtos/shared_dto.js";
import { sendError, sendSuccess } from "../utils/responses.js";
import { sanitizeProject } from "../utils/sanitize.js";

const projectRepository = () => AppDataSource.getRepository("Project");
const userRepository = () => AppDataSource.getRepository("User");
const defaultPage = 1;
const defaultLimit = 10;

const addProjectProgress = (project) => {
    const tasks = project.tasks || [];
    const doneTasks = tasks.filter((task) => task.status === "Done").length;

    return {
        ...sanitizeProject(project),
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

const getPagination = (query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : defaultPage;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
};

const isProjectMember = (project, userId) => {
    return project.members?.some((member) => member.id === userId);
};

const canAccessProject = (project, userId) => {
    return project.owner?.id === userId || isProjectMember(project, userId);
};

const findAccessibleProjectById = async (id, userId) => {
    return projectRepository().findOne({
        where: { id: Number(id) },
        relations: { owner: true, members: true, tasks: true },
    }).then((project) => {
        if (!project) {
            return { project: null, forbidden: false };
        }

        return { project, forbidden: !canAccessProject(project, userId) };
    });
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

    const memberMap = new Map(members.map((member) => [member.id, member]));
    memberMap.set(req.user.id, req.user);

    const project = projectRepository().create({
        ...mapCreateProjectDto(req.body, [...memberMap.values()]),
        owner: req.user,
    });

    const savedProject = await projectRepository().save(project);
    return sendSuccess(res, 201, "Project created successfully.", sanitizeProject(savedProject));
};

export const getProjects = async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const query = projectRepository()
        .createQueryBuilder("project")
        .leftJoinAndSelect("project.owner", "owner")
        .leftJoinAndSelect("project.members", "member")
        .leftJoinAndSelect("project.tasks", "task")
        .where(
            new Brackets((qb) => {
                qb.where("owner.id = :userId", { userId: req.user.id })
                    .orWhere("member.id = :userId", { userId: req.user.id });
            }),
        )
        .orderBy("project.id", "ASC")
        .skip(skip)
        .take(limit);

    if (typeof req.query.name === "string" && req.query.name.trim() !== "") {
        query.andWhere("LOWER(project.name) LIKE :name", {
            name: `%${req.query.name.trim().toLowerCase()}%`,
        });
    }

    const [projects, total] = await query.getManyAndCount();

    return sendSuccess(res, 200, "Projects fetched successfully.", {
        items: projects.map(addProjectProgress),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};

export const getProjectById = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Project id must be a positive integer.");
    }

    const { project, forbidden } = await findAccessibleProjectById(req.params.id, req.user.id);

    if (!project) {
        return sendError(res, 404, "Project not found.");
    }
    if (forbidden) {
        return sendError(res, 403, "You do not have access to this project.");
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

    const { project, forbidden } = await findAccessibleProjectById(req.params.id, req.user.id);

    if (!project) {
        return sendError(res, 404, "Project not found.");
    }
    if (forbidden) {
        return sendError(res, 403, "You do not have access to this project.");
    }

    Object.assign(project, mapUpdateProjectDto(req.body));

    if (req.body.memberIds !== undefined) {
        const members = await getMembersByIds(req.body.memberIds);
        if (members.length !== req.body.memberIds.length) {
            return sendError(res, 404, "One or more project members were not found.");
        }
        const memberMap = new Map(members.map((member) => [member.id, member]));
        memberMap.set(project.owner.id, project.owner);
        project.members = [...memberMap.values()];
    }

    const savedProject = await projectRepository().save(project);
    return sendSuccess(res, 200, "Project updated successfully.", addProjectProgress(savedProject));
};

export const deleteProject = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "Project id must be a positive integer.");
    }

    const { project, forbidden } = await findAccessibleProjectById(req.params.id, req.user.id);
    if (!project) {
        return sendError(res, 404, "Project not found.");
    }
    if (forbidden) {
        return sendError(res, 403, "You do not have access to this project.");
    }

    await projectRepository().remove(project);
    return sendSuccess(res, 200, "Project deleted successfully.");
};
