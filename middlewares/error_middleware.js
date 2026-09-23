import { sendError } from "../utils/responses.js";

export const notFoundHandler = (req, res) => {
    return sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found.`);
};

export const errorHandler = (error, _req, res, _next) => {
    console.error(error);

    const statusCode = Number(error.statusCode) || 500;
    const message = statusCode === 500 ? "Internal server error." : error.message;

    return sendError(res, statusCode, message);
};
