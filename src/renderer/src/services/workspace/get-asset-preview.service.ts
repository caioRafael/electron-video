export function getAssetPreview(
  workspacePath: string,
  assetId: string,
): Promise<string | null> {
  return window.api.workspace.getAssetPreview(workspacePath, assetId)
}
