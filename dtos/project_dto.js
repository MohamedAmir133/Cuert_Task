import { isPositiveInteger } from "./shared_dto.js";

export const validateCreateProjectDto = (body) => {
    const errors = {};

    if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.name = "Project name is required and must be a non-empty string.";
    }

    if (typeof body.description !== "string" || body.description.trim() === "") {
        errors.description = "Project description is required and must be a non-empty string.";
    }

    if (body.memberIds !== undefined) {
        if (!Array.isArray(body.memberIds) || !body.memberIds.every(isPositiveInteger)) {
            errors.memberIds = "memberIds must be an array of positive user ids.";
        }
    }

    return errors;
};

export const validateUpdateProjectDto = (body) => {
    const errors = {};

    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim() === "")) {
        errors.name = "Project name must be a non-empty string.";
    }

    if (body.description !== undefined && (typeof body.description !== "string" || body.description.trim() === "")) {
        errors.description = "Project description must be a non-empty string.";
    }

    if (body.memberIds !== undefined) {
        if (!Array.isArray(body.memberIds) || !body.memberIds.every(isPositiveInteger)) {
            errors.memberIds = "memberIds must be an array of positive user ids.";
        }
    }

    return errors;
};

export const mapCreateProjectDto = (body, members) => ({
    name: body.name.trim(),
    description: body.description.trim(),
    members,
});

export const mapUpdateProjectDto = (body) => {
    const dto = {};

    if (body.name !== undefined) {
        dto.name = body.name.trim();
    }

    if (body.description !== undefined) {
        dto.description = body.description.trim();
    }

    return dto;
};

