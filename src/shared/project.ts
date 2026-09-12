import { z } from 'zod'
import { Timeline, createEmptyTimeline, timelineSchema } from './timeline'

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  timeline: Timeline
}

export interface UpdateProjectInput {
  name: string
}

export interface UpdateProjectTimelineInput {
  timeline: Timeline
}

export const persistedProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  timeline: timelineSchema.optional(),
})

export const projectSchema = persistedProjectSchema.extend({
  timeline: timelineSchema,
})

export function normalizeProject(value: unknown): Project | null {
  const result = persistedProjectSchema.safeParse(value)

  if (!result.success) {
    return null
  }

  return {
    id: result.data.id,
    name: result.data.name,
    createdAt: result.data.createdAt,
    updatedAt: result.data.updatedAt,
    timeline: result.data.timeline ?? createEmptyTimeline(),
  }
}

export function projectNeedsTimelineMigration(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return !Object.prototype.hasOwnProperty.call(value, 'timeline')
}
