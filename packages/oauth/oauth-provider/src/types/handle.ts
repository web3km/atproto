import { z } from 'zod'
import { ensureValidHandle, normalizeHandle } from '@bluesky-social/syntax'

export const handleSchema = z
  .string()
  // @NOTE: We only check against validity towards ATProto's syntax. Additional
  // rules may be imposed by the store implementation.
  .superRefine((value, ctx) => {
    try {
      ensureValidHandle(value)
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : 'Invalid handle',
      })
    }
  })
  .transform(normalizeHandle)
