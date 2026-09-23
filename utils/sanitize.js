const stripPasswordFromUser = (user) => {
    if (!user || typeof user !== "object") {
        return user;
    }

    const { password, ...safeUser } = user;
    return safeUser;
};

export const sanitizeProject = (project) => {
    if (!project || typeof project !== "object") {
        return project;
    }

    return {
        ...project,
        owner: stripPasswordFromUser(project.owner),
        members: Array.isArray(project.members)
            ? project.members.map(stripPasswordFromUser)
            : project.members,
    };
};

export const sanitizeTask = (task) => {
    if (!task || typeof task !== "object") {
        return task;
    }

    return {
        ...task,
        project: sanitizeProject(task.project),
        assignee: stripPasswordFromUser(task.assignee),
    };
};
