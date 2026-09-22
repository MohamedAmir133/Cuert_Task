import { EntitySchema } from "typeorm";

export const UserSchema = new EntitySchema({
    name: "User",
    tableName: "users",
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
        assignedTasks: {
            type: "one-to-many",
            target: "Task",
            inverseSide: "assignee",
        },
    },
});
