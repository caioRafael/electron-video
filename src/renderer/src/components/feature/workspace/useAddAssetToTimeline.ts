import { Asset } from '@shared/assets'
import {
  addAssetToCurrentTimeline,
  getAddAssetToTimelineError,
} from '@/services/workspace/session'
import { useState } from 'react'

export function useAddAssetToTimeline() {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')

  async function addAsset(asset: Asset) {
    if (isAdding) {
      return
    }

    setIsAdding(true)

    try {
      await addAssetToCurrentTimeline(asset)
      setError('')
    } catch (addError) {
      setError(getAddAssetToTimelineError(addError))
    } finally {
      setIsAdding(false)
    }
  }

  return {
    isAdding,
    error,
    addAsset,
  }
}
