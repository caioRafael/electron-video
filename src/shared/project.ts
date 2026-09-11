import { z } from 'zod'

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProjectInput {
  name: string
}

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export function normalizeProject(value: unknown): Project | null {
  const result = projectSchema.safeParse(value)

  if (!result.success) {
    return null
  }

  return {
    id: result.data.id,
    name: result.data.name,
    createdAt: result.data.createdAt,
    updatedAt: result.data.updatedAt,
  }
}
