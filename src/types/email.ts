import type { UserObjShort } from "@/types/user";

export interface EmailEntry {
  id: number;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  createdBy: UserObjShort | null;
}
