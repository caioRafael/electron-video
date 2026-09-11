import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Asset } from '../../shared/assets'
import {
  createWorkspaceMarker,
  writeWorkspaceMarker,
} from '../workspace-marker'
import {
  clearCurrentWorkspacePath,
  setCurrentWorkspacePath,
} from '../workspace-session'
import { getMediaSource } from './source'

async function createWorkspaceFixture(assets: Asset[]): Promise<string> {
  const workspacePath = await mkdtemp(path.join(os.tmpdir(), 'video-lab-'))

  await mkdir(path.join(workspacePath, 'assets', 'audio'), { recursive: true })
  await mkdir(path.join(workspacePath, 'assets', 'videos'), { recursive: true })
  await mkdir(path.join(workspacePath, 'assets', 'images'), { recursive: true })

  for (const asset of assets) {
    const filePath = path.join(workspacePath, ...asset.source.split('/'))
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, `${asset.kind}-content`)
  }

  await writeWorkspaceMarker(
    workspacePath,
    createWorkspaceMarker('workspace_test', 'Test', assets),
  )

  return workspacePath
}

function createAsset(id: string, kind: Asset['kind'], source: string): Asset {
  return {
    id,
    name: path.basename(source),
    kind,
    source,
    createdAt: '2026-09-11T00:00:00.000Z',
    metadata: null,
  }
}

describe('getMediaSource', () => {
  afterEach(() => {
    clearCurrentWorkspacePath()
  })

  it('returns a videolab URL for a valid asset', async () => {
    const asset = createAsset('asset_123', 'video', 'assets/videos/intro.mp4')
    const workspacePath = await createWorkspaceFixture([asset])

    await setCurrentWorkspacePath(workspacePath)

    const source = await getMediaSource('asset_123')

    expect(source).toEqual({ url: 'videolab://asset/asset_123' })
    expect(JSON.stringify(source).includes(workspacePath)).toBe(false)
  })

  it('creates sources for image, video and audio assets', async () => {
    const assets = [
      createAsset('asset_image', 'image', 'assets/images/logo.png'),
      createAsset('asset_video', 'video', 'assets/videos/intro.mp4'),
      createAsset('asset_audio', 'audio', 'assets/audio/music.mp3'),
    ]
    const workspacePath = await createWorkspaceFixture(assets)

    await setCurrentWorkspacePath(workspacePath)

    await expect(getMediaSource('asset_image')).resolves.toEqual({
      url: 'videolab://asset/asset_image',
    })
    await expect(getMediaSource('asset_video')).resolves.toEqual({
      url: 'videolab://asset/asset_video',
    })
    await expect(getMediaSource('asset_audio')).resolves.toEqual({
      url: 'videolab://asset/asset_audio',
    })
  })

  it('throws when the asset does not exist', async () => {
    const workspacePath = await createWorkspaceFixture([])

    await setCurrentWorkspacePath(workspacePath)

    await expect(getMediaSource('asset_missing')).rejects.toThrow(
      'Asset not found',
    )
  })

  it('throws when no workspace is open', async () => {
    await expect(getMediaSource('asset_123')).rejects.toThrow(
      'Workspace not found',
    )
  })

  it('throws when the physical file is missing', async () => {
    const asset = createAsset('asset_123', 'video', 'assets/videos/intro.mp4')
    const workspacePath = await createWorkspaceFixture([])

    await writeWorkspaceMarker(
      workspacePath,
      createWorkspaceMarker('workspace_test', 'Test', [asset]),
    )
    await setCurrentWorkspacePath(workspacePath)

    await expect(getMediaSource('asset_123')).rejects.toThrow('Asset not found')
  })

  it('rejects a source that escapes the workspace', async () => {
    const asset = createAsset('asset_123', 'video', '../../secret.txt')
    const workspacePath = await createWorkspaceFixture([])

    await writeWorkspaceMarker(
      workspacePath,
      createWorkspaceMarker('workspace_test', 'Test', [asset]),
    )
    await setCurrentWorkspacePath(workspacePath)

    await expect(getMediaSource('asset_123')).rejects.toThrow(
      'Invalid asset source',
    )
  })

  it('rejects a file outside the allowed asset directories', async () => {
    const asset = createAsset('asset_123', 'video', 'project.json')
    const workspacePath = await createWorkspaceFixture([])

    await writeFile(path.join(workspacePath, 'project.json'), '{}')
    await writeWorkspaceMarker(
      workspacePath,
      createWorkspaceMarker('workspace_test', 'Test', [asset]),
    )
    await setCurrentWorkspacePath(workspacePath)

    await expect(getMediaSource('asset_123')).rejects.toThrow(
      'Invalid asset source',
    )
  })
})
