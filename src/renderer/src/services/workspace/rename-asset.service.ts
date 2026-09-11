import { WorkspaceAssets } from '@shared/assets'

export function renameWorkspaceAsset(
  workspacePath: string,
  assetId: string,
  nextName: string,
): Promise<WorkspaceAssets> {
  return window.api.workspace.renameAsset(workspacePath, assetId, nextName)
}
