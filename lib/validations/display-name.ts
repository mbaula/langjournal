import { z } from "zod";

export const displayNameSchema = z.string().trim().optional().or(z.literal(""));
