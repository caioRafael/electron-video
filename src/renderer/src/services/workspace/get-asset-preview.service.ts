export function getAssetPreview(
  workspacePath: string,
  assetPath: string,
): Promise<string | null> {
  return window.api.workspace.getAssetPreview(workspacePath, assetPath)
}
