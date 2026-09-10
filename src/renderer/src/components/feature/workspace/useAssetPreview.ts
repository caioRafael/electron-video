import { Asset } from '@shared/assets'
import { getAssetPreview } from '@/services/workspace/get-asset-preview.service'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useEffect, useState } from 'react'

export function useAssetPreview(asset: Asset) {
  const workspacePath = useWorkspaceStore(
    (state) => state.currentWorkspace?.path,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!workspacePath || (asset.kind !== 'image' && asset.kind !== 'video')) {
      setPreviewUrl(null)
      return
    }

    const currentWorkspacePath = workspacePath

    let cancelled = false

    async function loadPreview() {
      try {
        const preview = await getAssetPreview(currentWorkspacePath, asset.path)

        if (!cancelled) {
          setPreviewUrl(preview)
        }
      } catch {
        if (!cancelled) {
          setPreviewUrl(null)
        }
      }
    }

    loadPreview()

    return () => {
      cancelled = true
    }
  }, [workspacePath, asset.path, asset.kind])

  return previewUrl
}
