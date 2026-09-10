import { Asset, AssetKind } from '@shared/assets'
import { FilmStripIcon, ImageIcon, MusicNoteIcon } from '@phosphor-icons/react'
import { useAssetPreview } from './useAssetPreview'

interface WorkspaceAssetPreviewProps {
  asset: Asset
}

export function WorkspaceAssetPreview({ asset }: WorkspaceAssetPreviewProps) {
  const previewUrl = useAssetPreview(asset)

  return (
    <div className="flex size-full items-center justify-center overflow-hidden bg-muted">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <AssetKindIcon kind={asset.kind} />
      )}
    </div>
  )
}

interface AssetKindIconProps {
  kind: AssetKind
}

function AssetKindIcon({ kind }: AssetKindIconProps) {
  if (kind === 'audio') {
    return <MusicNoteIcon />
  }

  if (kind === 'video') {
    return <FilmStripIcon />
  }

  return <ImageIcon />
}
