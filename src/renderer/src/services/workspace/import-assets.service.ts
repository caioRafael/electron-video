import { AssetKind, ImportAssetsResult } from '@shared/assets'

export function importWorkspaceAssets(
  workspacePath: string,
  kind?: AssetKind,
): Promise<ImportAssetsResult> {
  return window.api.workspace.importAssets(workspacePath, kind)
}
