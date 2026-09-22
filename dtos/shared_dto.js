export const isPositiveInteger = (value) => {
    return Number.isInteger(Number(value)) && Number(value) > 0;
};

export const hasValidationErrors = (errors) => {
    return Object.keys(errors).length > 0;
};

export const validateIdParam = (id, fieldName = "id") => {
    if (!isPositiveInteger(id)) {
        return `${fieldName} must be a positive integer.`;
    }

    return null;
};

