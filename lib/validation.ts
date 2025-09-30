import { z } from "zod";
export const joinCodeSchema = z.string().trim().toUpperCase().length(6, "Code must be 6 chars");
export const nicknameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(20, "Max 20 characters")
  .regex(/^[A-Za-z0-9_\- ]+$/, "Letters, numbers, space, _ or - only");