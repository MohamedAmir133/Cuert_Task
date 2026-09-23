import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateUserDto,
    mapUpdateUserDto,
    validateCreateUserDto,
    validateUpdateUserDto,
} from "../dtos/user_dto.js";
import { hasValidationErrors, isPositiveInteger } from "../dtos/shared_dto.js";
import { hashPassword, withoutPassword } from "./auth_controller.js";
import { sendError, sendSuccess } from "../utils/responses.js";

const userRepository = () => AppDataSource.getRepository("User");
const defaultPage = 1;
const defaultLimit = 10;

const getPagination = (query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : defaultPage;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
};

export const createUser = async (req, res) => {
    const errors = validateCreateUserDto(req.body);
    if (hasValidationErrors(errors)) {
        return sendError(res, 400, "Validation failed.", errors);
    }

    const dto = mapCreateUserDto(req.body);
    const existingUser = await userRepository().findOneBy({ email: dto.email });
    if (existingUser) {
        return sendError(res, 409, "Email is already used.");
    }

    const user = userRepository().create({
        ...dto,
        password: await hashPassword(dto.password),
    });
    const savedUser = await userRepository().save(user);

    return sendSuccess(res, 201, "User created successfully.", withoutPassword(savedUser));
};

export const getUsers = async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const query = userRepository()
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.projects", "project")
        .leftJoinAndSelect("user.assignedTasks", "task")
        .orderBy("user.id", "ASC")
        .skip(skip)
        .take(limit);

    if (typeof req.query.name === "string" && req.query.name.trim() !== "") {
        query.andWhere("LOWER(user.name) LIKE :name", {
            name: `%${req.query.name.trim().toLowerCase()}%`,
        });
    }
    if (typeof req.query.email === "string" && req.query.email.trim() !== "") {
        query.andWhere("LOWER(user.email) LIKE :email", {
            email: `%${req.query.email.trim().toLowerCase()}%`,
        });
    }

    const [users, total] = await query.getManyAndCount();

    return sendSuccess(res, 200, "Users fetched successfully.", {
        items: users.map(withoutPassword),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};

export const getUserById = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "User id must be a positive integer.");
    }

    const user = await userRepository().findOne({
        where: { id: Number(req.params.id) },
        relations: { projects: true, assignedTasks: true },
    });

    if (!user) {
        return sendError(res, 404, "User not found.");
    }

    return sendSuccess(res, 200, "User fetched successfully.", withoutPassword(user));
};

export const updateUser = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "User id must be a positive integer.");
    }

    const errors = validateUpdateUserDto(req.body);
    if (hasValidationErrors(errors)) {
        return sendError(res, 400, "Validation failed.", errors);
    }

    const user = await userRepository().findOneBy({ id: Number(req.params.id) });
    if (!user) {
        return sendError(res, 404, "User not found.");
    }

    const dto = mapUpdateUserDto(req.body);
    if (dto.email !== undefined) {
        const existingUser = await userRepository().findOneBy({ email: dto.email });
        if (existingUser && existingUser.id !== user.id) {
            return sendError(res, 409, "Email is already used.");
        }
    }
    if (dto.password !== undefined) {
        dto.password = await hashPassword(dto.password);
    }

    Object.assign(user, dto); // non-destructive update of user entity with the new values from dto
    const savedUser = await userRepository().save(user);

    return sendSuccess(res, 200, "User updated successfully.", withoutPassword(savedUser));
};

export const deleteUser = async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
        return sendError(res, 400, "User id must be a positive integer.");
    }

    const user = await userRepository().findOneBy({ id: Number(req.params.id) });
    if (!user) {
        return sendError(res, 404, "User not found.");
    }

    await userRepository().remove(user);
    return sendSuccess(res, 200, "User deleted successfully.");
};
