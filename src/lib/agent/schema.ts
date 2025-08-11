import { z } from "zod";

export const SwapIntent = z.object({
  kind: z.literal("swap"),
  amount: z.number().positive(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  slippageBps: z.number().int().min(1).max(5000).optional(), // 1 = 0.01%, 50 = 0.5%, 500 = 5%
});

export const RegisterIpIntent = z.object({
  kind: z.literal("register"),
  prompt: z.string().optional(),
  title: z.string().optional(),
  license: z.enum(["none","nc","cc0","by","by-nc","custom"]).optional(),
});

export type Intent =
  | z.infer<typeof SwapIntent>
  | z.infer<typeof RegisterIpIntent>;
