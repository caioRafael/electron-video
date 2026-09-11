import { describe, expect, it } from 'vitest'
import { isWorkspaceAssetFile, resolveAssetSource } from './asset-path'

const workspacePath = '/Users/user/MyProject'

describe('resolveAssetSource', () => {
  it('resolves a valid relative source inside the workspace', () => {
    expect(resolveAssetSource(workspacePath, 'assets/videos/intro.mp4')).toBe(
      '/Users/user/MyProject/assets/videos/intro.mp4',
    )
  })

  it('rejects path traversal', () => {
    expect(() =>
      resolveAssetSource(workspacePath, '../../arquivo.txt'),
    ).toThrow('Invalid asset source')
    expect(() =>
      resolveAssetSource(workspacePath, '../../../Users/user/private.txt'),
    ).toThrow('Invalid asset source')
    expect(() =>
      resolveAssetSource(workspacePath, 'assets/videos/../../secret.txt'),
    ).toThrow('Invalid asset source')
  })

  it('rejects an empty source', () => {
    expect(() => resolveAssetSource(workspacePath, '')).toThrow(
      'Invalid asset source',
    )
  })
})

describe('isWorkspaceAssetFile', () => {
  it('accepts a file inside an asset directory', () => {
    expect(
      isWorkspaceAssetFile(
        workspacePath,
        '/Users/user/MyProject/assets/videos/intro.mp4',
      ),
    ).toBe(true)
  })

  it('rejects a file outside the allowed asset directories', () => {
    expect(
      isWorkspaceAssetFile(workspacePath, '/Users/user/MyProject/project.json'),
    ).toBe(false)
    expect(isWorkspaceAssetFile(workspacePath, '/Users/user/private.txt')).toBe(
      false,
    )
  })

  it('rejects the asset directory itself', () => {
    expect(
      isWorkspaceAssetFile(
        workspacePath,
        '/Users/user/MyProject/assets/videos',
      ),
    ).toBe(false)
  })
})
