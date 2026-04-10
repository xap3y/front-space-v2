"use server";

import {RoleType} from "@/types/user";
import {getUserRoleBadgeElement, type RoleBadgeOptions} from "@/lib/roleBadge";

export const getUserRoleBadgeServer = async (
    role: RoleType,
    opts?: RoleBadgeOptions
) => getUserRoleBadgeElement(role, opts);
