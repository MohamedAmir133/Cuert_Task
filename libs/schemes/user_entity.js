import { EntitySchema } from "typeorm";

export const UserSchema = new EntitySchema({
    name: "User", // The name of the entity
    tableName: "users", // The name of the table in the database
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        name: {
            type: "varchar",
        },
        email: {
            type: "varchar",
            unique: true,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
        },
        password: {
            type: "varchar",
        },
    },
    relations: {
        projects: {
            type: "many-to-many",
            target: "Project",
            inverseSide: "members",
        },
        ownedProjects: {
        type: "one-to-many",
        target: "Project",
        inverseSide: "owner", 
        },
        assignedTasks: {
            type: "one-to-many",
            target: "Task",
            inverseSide: "assignee",
        },
    },
});
