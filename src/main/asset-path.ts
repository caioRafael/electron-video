import path from 'node:path'
import { ASSET_DIRECTORIES, ASSETS_DIRECTORY } from '../shared/assets'

export function isInsideDirectory(
  targetPath: string,
  directoryPath: string,
): boolean {
  const relative = path.relative(
    path.resolve(directoryPath),
    path.resolve(targetPath),
  )

  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

export function resolveAssetSource(
  workspacePath: string,
  source: string,
): string {
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error('Invalid asset source')
  }

  const segments = source.split(/[\\/]/).filter((segment) => {
    return segment.length > 0 && segment !== '.'
  })

  if (segments.length === 0 || segments.includes('..')) {
    throw new Error('Invalid asset source')
  }

  return path.join(workspacePath, ...segments)
}

export function isWorkspaceAssetFile(
  workspacePath: string,
  assetPath: string,
): boolean {
  const resolvedAssetPath = path.resolve(assetPath)

  return Object.values(ASSET_DIRECTORIES).some((folder) => {
    const directoryPath = path.resolve(workspacePath, ASSETS_DIRECTORY, folder)

    return (
      resolvedAssetPath !== directoryPath &&
      isInsideDirectory(resolvedAssetPath, directoryPath)
    )
  })
}
