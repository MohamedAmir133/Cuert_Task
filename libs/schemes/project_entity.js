import { EntitySchema } from "typeorm";

export const ProjectSchema = new EntitySchema({
    name: "Project",
    tableName: "projects",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        name: {
            type: "varchar",
        },
        description: {
            type: "text",
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
        },
    },
    relations: {
        owner: {
            type: "many-to-one",
            target: "User",
            nullable: true,
            onDelete: "CASCADE",
            inverseSide: "ownedProjects",
        },
        members: {
            type: "many-to-many",
            target: "User",
            inverseSide: "projects",
            joinTable: true,
        },
        tasks: {
            type: "one-to-many",
            target: "Task",
            inverseSide: "project",
        },
    },
});
