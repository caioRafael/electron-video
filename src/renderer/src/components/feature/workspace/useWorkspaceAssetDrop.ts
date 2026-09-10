import {
  getImportAssetsError,
  importAssetPathsIntoCurrentWorkspace,
} from '@/services/workspace/session'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useEffect, useRef, useState } from 'react'

export function useWorkspaceAssetDrop() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const workspaceRef = useRef(currentWorkspace)
  const isImportingRef = useRef(false)

  workspaceRef.current = currentWorkspace

  useEffect(() => {
    let dragDepth = 0

    function containsFiles(event: DragEvent): boolean {
      return Boolean(event.dataTransfer?.types.includes('Files'))
    }

    function handleDragEnter(event: DragEvent) {
      if (!containsFiles(event) || !workspaceRef.current) {
        return
      }

      event.preventDefault()
      dragDepth += 1
      setIsDraggingFiles(true)
      setError('')
    }

    function handleDragOver(event: DragEvent) {
      if (!containsFiles(event)) {
        return
      }

      event.preventDefault()

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = workspaceRef.current ? 'copy' : 'none'
      }
    }

    function handleDragLeave(event: DragEvent) {
      if (!containsFiles(event) || !workspaceRef.current) {
        return
      }

      event.preventDefault()
      dragDepth -= 1

      if (dragDepth <= 0) {
        dragDepth = 0
        setIsDraggingFiles(false)
      }
    }

    async function handleDrop(event: DragEvent) {
      event.preventDefault()
      dragDepth = 0
      setIsDraggingFiles(false)

      if (!workspaceRef.current || isImportingRef.current) {
        return
      }

      const files = event.dataTransfer?.files

      if (!files || files.length === 0) {
        return
      }

      const filePaths = Array.from(files)
        .map((file) => window.api.getPathForFile(file))
        .filter((filePath) => filePath.length > 0)

      if (filePaths.length === 0) {
        return
      }

      isImportingRef.current = true
      setIsImporting(true)
      setError('')

      try {
        const result = await importAssetPathsIntoCurrentWorkspace(filePaths)
        const importError = getImportAssetsError(result)

        if (importError) {
          setError(importError)
        }
      } catch {
        setError('Não foi possível importar os arquivos')
      } finally {
        isImportingRef.current = false
        setIsImporting(false)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  return {
    isDraggingFiles,
    isImporting,
    error,
  }
}
