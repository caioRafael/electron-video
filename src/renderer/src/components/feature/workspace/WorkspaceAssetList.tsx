import {
  Asset,
  AssetKind,
  AssetViewMode,
  WorkspaceAssets,
} from '@shared/assets'
import { Button } from '@/components/ui/button'
import {
  FilmStripIcon,
  ImageIcon,
  MusicNoteIcon,
  PlusIcon,
} from '@phosphor-icons/react'
import { WorkspaceAssetItem } from './WorkspaceAssetItem'

interface AssetSection {
  key: keyof WorkspaceAssets
  kind: AssetKind
  title: string
  emptyLabel: string
}

const ASSET_SECTIONS: AssetSection[] = [
  {
    key: 'audio',
    kind: 'audio',
    title: 'Áudio',
    emptyLabel: 'Nenhum áudio',
  },
  {
    key: 'videos',
    kind: 'video',
    title: 'Vídeos',
    emptyLabel: 'Nenhum vídeo',
  },
  {
    key: 'images',
    kind: 'image',
    title: 'Imagens',
    emptyLabel: 'Nenhuma imagem',
  },
]

interface WorkspaceAssetListProps {
  assets: WorkspaceAssets
  isImporting: boolean
  viewMode: AssetViewMode
  onImport: (kind: AssetKind) => void
}

export function WorkspaceAssetList({
  assets,
  isImporting,
  viewMode,
  onImport,
}: WorkspaceAssetListProps) {
  return (
    <div className="flex flex-col gap-2 py-1">
      {ASSET_SECTIONS.map((section) => (
        <WorkspaceAssetSection
          key={section.key}
          section={section}
          assets={assets[section.key]}
          isImporting={isImporting}
          viewMode={viewMode}
          onImport={onImport}
        />
      ))}
    </div>
  )
}

interface WorkspaceAssetSectionProps {
  section: AssetSection
  assets: Asset[]
  isImporting: boolean
  viewMode: AssetViewMode
  onImport: (kind: AssetKind) => void
}

function WorkspaceAssetSection({
  section,
  assets,
  isImporting,
  viewMode,
  onImport,
}: WorkspaceAssetSectionProps) {
  return (
    <section>
      <header className="flex items-center justify-between gap-2 px-2.5 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <AssetKindIcon kind={section.kind} />
          <h2 className="truncate font-medium">{section.title}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={isImporting}
          onClick={() => onImport(section.kind)}
          aria-label={`Adicionar ${section.title.toLowerCase()}`}
        >
          <PlusIcon />
        </Button>
      </header>
      {assets.length === 0 ? (
        <p className="px-2.5 py-1 text-muted-foreground">
          {section.emptyLabel}
        </p>
      ) : (
        <ul
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-2 px-2.5 py-1'
              : 'flex flex-col'
          }
        >
          {assets.map((asset) => (
            <WorkspaceAssetItem
              key={asset.path}
              asset={asset}
              disabled={isImporting}
              viewMode={viewMode}
            />
          ))}
        </ul>
      )}
    </section>
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
