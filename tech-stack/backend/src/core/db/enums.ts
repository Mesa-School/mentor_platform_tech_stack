export const Role = {
    USER: "USER",
    MANAGER: "MANAGER",
    ADMIN: "ADMIN"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
