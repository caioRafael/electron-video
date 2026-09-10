import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDirectoryPath } from '@/services/workspace/get-directory-path.service'
import { createAndSelectWorkspace } from '@/services/workspace/session'
import { CircleNotchIcon, FolderOpenIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { z } from 'zod'
import { createWorkspaceSchema } from './create-workspace.schema'

interface CreateWorkspaceFieldErrors {
  name?: string
  directory?: string
}

interface CreateWorkspaceFormProps {
  onCancel: () => void
}

export function CreateWorkspaceForm({ onCancel }: CreateWorkspaceFormProps) {
  const [name, setName] = useState('')
  const [directory, setDirectory] = useState('')
  const [errors, setErrors] = useState<CreateWorkspaceFieldErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = isSelectingDirectory || isSubmitting

  function clearError(field: keyof CreateWorkspaceFieldErrors) {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }))
    setSubmitError('')
  }

  async function handleSelectDirectory() {
    setIsSelectingDirectory(true)

    try {
      const selectedDirectory = await getDirectoryPath()

      if (selectedDirectory) {
        setDirectory(selectedDirectory)
        clearError('directory')
      }
    } finally {
      setIsSelectingDirectory(false)
    }
  }

  async function handleSubmit() {
    const parsed = createWorkspaceSchema.safeParse({ name, directory })

    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors

      setErrors({
        name: fieldErrors.name?.[0],
        directory: fieldErrors.directory?.[0],
      })
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await createAndSelectWorkspace(parsed.data.directory, parsed.data.name)
    } catch {
      setSubmitError('Não foi possível criar o workspace')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="workspace-name">Nome</Label>
        <Input
          id="workspace-name"
          value={name}
          disabled={isLoading}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'workspace-name-error' : undefined}
          onChange={(event) => {
            setName(event.target.value)
            clearError('name')
          }}
        />
        {errors.name ? (
          <p id="workspace-name-error" className="text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="workspace-directory">Diretório</Label>
        <div className="flex gap-2">
          <Input
            id="workspace-directory"
            className="min-w-0"
            value={directory}
            placeholder="Selecione um diretório"
            readOnly
            disabled={isLoading}
            aria-invalid={Boolean(errors.directory)}
            aria-describedby={
              errors.directory ? 'workspace-directory-error' : undefined
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleSelectDirectory}
          >
            {isSelectingDirectory ? (
              <CircleNotchIcon className="animate-spin" />
            ) : (
              <FolderOpenIcon />
            )}
            Escolher
          </Button>
        </div>
        {errors.directory ? (
          <p id="workspace-directory-error" className="text-destructive">
            {errors.directory}
          </p>
        ) : null}
      </div>
      {submitError ? <p className="text-destructive">{submitError}</p> : null}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="button" disabled={isLoading} onClick={handleSubmit}>
          {isSubmitting ? <CircleNotchIcon className="animate-spin" /> : null}
          {isSubmitting ? 'Criando...' : 'Criar'}
        </Button>
      </DialogFooter>
    </div>
  )
}
