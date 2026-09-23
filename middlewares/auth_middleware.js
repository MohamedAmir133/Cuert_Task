import jwt from "jsonwebtoken";
import { AppDataSource } from "../libs/config/database.js";
import { sendError } from "../utils/responses.js";

const userRepository = () => AppDataSource.getRepository("User");

//user be logged in to access the protected routes
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendError(res, 401, "Authentication token is required.");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const secret = process.env.JWT_SECRET || "development-only-jwt-secret";

    try {
        const payload = jwt.verify(token, secret);
        const user = await userRepository().findOneBy({ id: Number(payload.userId) });

        if (!user) {
            return sendError(res, 401, "Invalid authentication token.");
        }

        req.user = user;
        return next();
    } catch (_error) {
        return sendError(res, 401, "Invalid authentication token.");
    }
};
