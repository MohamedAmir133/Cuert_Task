import "dotenv/config";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../libs/config/database.js";

const password = "password123";

const users = [
    { name: "Ahmed Hassan", email: "ahmed@example.com" },
    { name: "Mona Ali", email: "mona@example.com" },
    { name: "Omar Samir", email: "omar@example.com" },
];

const findOrCreateUser = async (repository, userData, passwordHash) => {
    const existingUser = await repository.findOneBy({ email: userData.email });
    if (existingUser) {
        return existingUser;
    }

    return repository.save(repository.create({ ...userData, password: passwordHash }));
};

const findOrCreateProject = async (repository, projectData) => {
    const existingProject = await repository.findOne({
        where: { name: projectData.name },
        relations: { owner: true, members: true },
    });
    if (existingProject) {
        return existingProject;
    }

    return repository.save(repository.create(projectData));
};

const findOrCreateTask = async (repository, taskData) => {
    const existingTask = await repository.findOne({
        where: {
            title: taskData.title,
            project: { id: taskData.project.id },
        },
    });
    if (existingTask) {
        return existingTask;
    }

    return repository.save(repository.create(taskData));
};

const seed = async () => {
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository("User");
    const projectRepository = AppDataSource.getRepository("Project");
    const taskRepository = AppDataSource.getRepository("Task");
    const passwordHash = await bcrypt.hash(password, 12);

    const [ahmed, mona, omar] = await Promise.all(
        users.map((user) => findOrCreateUser(userRepository, user, passwordHash)),
    );

    const aerodynamics = await findOrCreateProject(projectRepository, {
        name: "Aerodynamics Package",
        description: "Design and validate the front wing and undertray package.",
        owner: ahmed,
        members: [ahmed, mona],
    });

    const powertrain = await findOrCreateProject(projectRepository, {
        name: "Powertrain Reliability",
        description: "Prepare reliability tasks for the endurance event.",
        owner: omar,
        members: [omar, mona],
    });

    await Promise.all([
        findOrCreateTask(taskRepository, {
            title: "Run CFD baseline",
            description: "Generate baseline CFD results for the current front wing.",
            status: "In Progress",
            priority: "High",
            project: aerodynamics,
            assignee: mona,
        }),
        findOrCreateTask(taskRepository, {
            title: "Review mounting points",
            description: "Check chassis mounting points for the aero package.",
            status: "To Do",
            priority: "Medium",
            project: aerodynamics,
            assignee: ahmed,
        }),
        findOrCreateTask(taskRepository, {
            title: "Inspect cooling system",
            description: "Inspect coolant routing before the next test day.",
            status: "Done",
            priority: "High",
            project: powertrain,
            assignee: omar,
        }),
    ]);

    console.log("Seed data created.");
    console.log(`Demo password for all seed users: ${password}`);

    await AppDataSource.destroy();
};

seed().catch(async (error) => {
    console.error("Seed failed:", error);
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    process.exit(1);
});
