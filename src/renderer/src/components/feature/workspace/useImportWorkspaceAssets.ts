import { AssetKind } from '@shared/assets'
import {
  getImportAssetsError,
  importAssetsIntoCurrentWorkspace,
} from '@/services/workspace/session'
import { useState } from 'react'

export function useImportWorkspaceAssets() {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')

  async function importAssets(kind?: AssetKind) {
    setIsImporting(true)
    setError('')

    try {
      const result = await importAssetsIntoCurrentWorkspace(kind)
      const importError = getImportAssetsError(result)

      if (importError) {
        setError(importError)
      }
    } catch {
      setError('Não foi possível importar os arquivos')
    } finally {
      setIsImporting(false)
    }
  }

  return {
    importAssets,
    isImporting,
    error,
  }
}
