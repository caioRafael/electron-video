import { ImportAssetsResult } from '@shared/assets'

export function importWorkspaceAssetPaths(
  workspacePath: string,
  filePaths: string[],
): Promise<ImportAssetsResult> {
  return window.api.workspace.importAssetPaths(workspacePath, filePaths)
}
