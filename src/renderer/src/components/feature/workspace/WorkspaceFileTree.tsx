import { WorkspaceEntry } from '@shared/workspace'
import { FileIcon, FolderIcon } from '@phosphor-icons/react'

interface WorkspaceFileTreeProps {
  entries: WorkspaceEntry[]
}

export function WorkspaceFileTree({ entries }: WorkspaceFileTreeProps) {
  if (entries.length === 0) {
    return (
      <p className="px-2.5 py-2 text-muted-foreground">
        Nenhum arquivo neste workspace
      </p>
    )
  }

  return <WorkspaceFileList entries={entries} />
}

interface WorkspaceFileListProps {
  entries: WorkspaceEntry[]
}

function WorkspaceFileList({ entries }: WorkspaceFileListProps) {
  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <WorkspaceFileNode key={entry.path} entry={entry} />
      ))}
    </ul>
  )
}

interface WorkspaceFileNodeProps {
  entry: WorkspaceEntry
}

function WorkspaceFileNode({ entry }: WorkspaceFileNodeProps) {
  return (
    <li>
      <div className="flex items-center gap-1.5 px-2.5 py-1">
        {entry.isDirectory ? <FolderIcon /> : <FileIcon />}
        <span className="truncate">{entry.name}</span>
      </div>
      {entry.isDirectory && entry.children.length > 0 ? (
        <div className="pl-3">
          <WorkspaceFileList entries={entry.children} />
        </div>
      ) : null}
    </li>
  )
}
