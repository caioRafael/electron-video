import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do workspace')
    .max(80, 'O nome deve ter no máximo 80 caracteres')
    .refine((value) => !/[\\/]/.test(value), 'O nome não pode conter barras'),
  directory: z.string().trim().min(1, 'Selecione um diretório'),
})
