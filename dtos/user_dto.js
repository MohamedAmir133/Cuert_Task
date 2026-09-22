export const validateCreateUserDto = (body) => {
    const errors = {};

    if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.name = "Name is required and must be a non-empty string.";
    }

    if (typeof body.email !== "string" || body.email.trim() === "") {
        errors.email = "Email is required and must be a non-empty string.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        errors.email = "Email must be a valid email address.";
    }

    if (typeof body.password !== "string" || body.password.length < 6) {
        errors.password = "Password is required and must be at least 6 characters.";
    }

    return errors;
};

export const validateUpdateUserDto = (body) => {
    const errors = {};

    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim() === "")) {
        errors.name = "Name must be a non-empty string.";
    }

    if (body.email !== undefined) {
        if (typeof body.email !== "string" || body.email.trim() === "") {
            errors.email = "Email must be a non-empty string.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
            errors.email = "Email must be a valid email address.";
        }
    }

    if (body.password !== undefined && (typeof body.password !== "string" || body.password.length < 6)) {
        errors.password = "Password must be at least 6 characters.";
    }

    return errors;
};

export const mapCreateUserDto = (body) => ({
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
});

export const mapUpdateUserDto = (body) => {
    const dto = {};

    if (body.name !== undefined) {
        dto.name = body.name.trim();
    }

    if (body.email !== undefined) {
        dto.email = body.email.trim().toLowerCase();
    }

    if (body.password !== undefined) {
        dto.password = body.password;
    }

    return dto;
};

