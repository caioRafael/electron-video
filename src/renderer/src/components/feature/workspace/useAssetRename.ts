import { Asset, getAssetBaseName } from '@shared/assets'
import {
  getRenameAssetError,
  renameAssetInCurrentWorkspace,
} from '@/services/workspace/session'
import { useRef, useState } from 'react'

export function useAssetRename(asset: Asset) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [error, setError] = useState('')
  const canceledRef = useRef(false)
  const isCommittingRef = useRef(false)
  const hasCommittedRef = useRef(false)

  function startRename() {
    canceledRef.current = false
    hasCommittedRef.current = false
    setDraftName(getAssetBaseName(asset.name))
    setError('')
    setIsRenaming(true)
  }

  function cancelRename() {
    canceledRef.current = true
    setError('')
    setIsRenaming(false)
  }

  async function commitRename() {
    if (
      canceledRef.current ||
      isCommittingRef.current ||
      hasCommittedRef.current
    ) {
      return
    }

    const nextName = draftName.trim()
    const currentName = getAssetBaseName(asset.name)

    if (!nextName) {
      setError('Informe um nome')
      return
    }

    if (nextName === currentName) {
      hasCommittedRef.current = true
      setError('')
      setIsRenaming(false)
      return
    }

    isCommittingRef.current = true

    try {
      await renameAssetInCurrentWorkspace(asset.path, nextName)
      hasCommittedRef.current = true
      setError('')
      setIsRenaming(false)
    } catch (renameError) {
      setError(getRenameAssetError(renameError))
    } finally {
      isCommittingRef.current = false
    }
  }

  return {
    isRenaming,
    draftName,
    error,
    setDraftName,
    startRename,
    cancelRename,
    commitRename,
  }
}
