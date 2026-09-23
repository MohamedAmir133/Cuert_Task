import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../libs/config/database.js";
import {
    mapCreateUserDto,
    validateCreateUserDto,
} from "../dtos/user_dto.js";
import { hasValidationErrors } from "../dtos/shared_dto.js";
import { sendError, sendSuccess } from "../utils/responses.js";

const userRepository = () => AppDataSource.getRepository("User");
const saltRounds = 12;

export const withoutPassword = (user) => {
    if (!user) {
        return user;
    }

    const { password, ...safeUser } = user;
    return safeUser;
};

export const hashPassword = (password) => bcrypt.hash(password, saltRounds);

export const signToken = (user) => {
    const secret = process.env.JWT_SECRET || "development-only-jwt-secret";
    return jwt.sign({ userId: user.id, email: user.email }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
};

export const register = async (req, res) => {
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

    return sendSuccess(res, 201, "User registered successfully.", {
        token: signToken(savedUser),
        user: withoutPassword(savedUser),
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return sendError(res, 400, "Email and password are required.");
    }

    const user = await userRepository().findOneBy({ email: email.trim().toLowerCase() });
    if (!user) {
        return sendError(res, 401, "Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return sendError(res, 401, "Invalid email or password.");
    }

    return sendSuccess(res, 200, "Login successful.", {
        token: signToken(user),
        user: withoutPassword(user),
    });
};
