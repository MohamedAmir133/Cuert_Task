import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateUserDto,
    mapUpdateUserDto,
    validateCreateUserDto,
    validateUpdateUserDto,
} from "../dtos/user_dto.js";
import { hasValidationErrors, isPositiveInteger } from "../dtos/shared_dto.js";
import { sendError, sendSuccess } from "../utils/responses.js";

const userRepository = () => AppDataSource.getRepository("User");

const withoutPassword = (user) => {
    if (!user) {
        return user;
    }

    const { password, ...safeUser } = user;
    return safeUser;
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

    const user = userRepository().create(dto);
    const savedUser = await userRepository().save(user);

    return sendSuccess(res, 201, "User created successfully.", withoutPassword(savedUser));
};

export const getUsers = async (_req, res) => {
    const users = await userRepository().find({
        relations: { projects: true, assignedTasks: true }, //to also show userdata with their projects and assigned tasks
    });

    return sendSuccess(res, 200, "Users fetched successfully.", users.map(withoutPassword));
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

