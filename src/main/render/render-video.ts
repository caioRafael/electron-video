import path from 'node:path'
import {
  render,
  type RenderProgress as PatchworkRenderProgress,
} from '@caiorafael/patchwork'
import {
  app,
  BrowserWindow,
  dialog,
  SaveDialogOptions,
  WebContents,
} from 'electron'
import { WorkspaceAssets } from '../../shared/assets'
import { RenderProgress, RenderVideoResult } from '../../shared/render'
import { listWorkspaceAssets } from '../assets'
import { resolveAssetFilePath } from '../media/asset-resolver'
import { getWorkspaceProject } from '../project'
import { requireCurrentWorkspacePath } from '../workspace-session'
import { getBlackFramePath } from './black-frame'
import { ensureFfmpegOnPath } from './ensure-ffmpeg-path'
import {
  BLACK_FRAME_ASSET_ID,
  mapTimelineToComposition,
  MapTimelineToCompositionResult,
} from './map-timeline-to-composition'

const RENDER_PROGRESS_CHANNEL = 'render-video-progress'

let activeAbort: AbortController | null = null

function flattenWorkspaceAssets(assets: WorkspaceAssets) {
  return [...assets.audio, ...assets.videos, ...assets.images]
}

function sanitizeFileName(name: string): string {
  const sanitized = name.replace(/[\\/:*?"<>|]/g, '').trim()

  return sanitized || 'video'
}

function getDefaultOutputPath(projectName: string): string {
  return path.join(
    app.getPath('documents'),
    `${sanitizeFileName(projectName)}.mp4`,
  )
}

function ensureMp4Extension(filePath: string): string {
  if (filePath.toLowerCase().endsWith('.mp4')) {
    return filePath
  }

  return `${filePath}.mp4`
}

function toRenderProgress(progress: PatchworkRenderProgress): RenderProgress {
  return {
    phase: progress.phase,
    progress: progress.progress,
    elapsedMs: progress.elapsedMs,
    durationMs: progress.durationMs,
    fps: progress.fps,
    speed: progress.speed,
    message: progress.message,
  }
}

async function resolveRenderAssets(
  workspacePath: string,
  mapped: MapTimelineToCompositionResult,
): Promise<Record<string, string>> {
  const assets: Record<string, string> = {}

  for (const assetId of mapped.assetIds) {
    if (assetId === BLACK_FRAME_ASSET_ID) {
      assets[assetId] = await getBlackFramePath()
      continue
    }

    assets[assetId] = await resolveAssetFilePath(workspacePath, assetId)
  }

  return assets
}

async function renderMappedComposition(input: {
  workspacePath: string
  mapped: MapTimelineToCompositionResult
  outputPath: string
  signal: AbortSignal
  onProgress: (progress: RenderProgress) => void
}): Promise<RenderVideoResult> {
  await ensureFfmpegOnPath()

  const assets = await resolveRenderAssets(input.workspacePath, input.mapped)
  const result = await render({
    composition: input.mapped.composition,
    assets,
    output: input.outputPath,
    signal: input.signal,
    onProgress: (progress) => {
      input.onProgress(toRenderProgress(progress))
    },
  })

  return {
    canceled: false,
    outputPath: result.outputPath,
    duration: result.duration,
  }
}

export function cancelRenderVideo(): void {
  activeAbort?.abort()
}

export async function promptAndRenderVideo(
  sender: WebContents,
): Promise<RenderVideoResult> {
  if (activeAbort) {
    throw new Error('A render is already in progress')
  }

  const abort = new AbortController()
  activeAbort = abort

  try {
    const workspacePath = await requireCurrentWorkspacePath()
    const project = await getWorkspaceProject(workspacePath)
    const mapped = mapTimelineToComposition(
      project,
      flattenWorkspaceAssets(await listWorkspaceAssets(workspacePath)),
    )
    const browserWindow = BrowserWindow.fromWebContents(sender)
    const dialogOptions: SaveDialogOptions = {
      title: 'Salvar vídeo',
      defaultPath: getDefaultOutputPath(project.name),
      filters: [{ name: 'MP4', extensions: ['mp4'] }],
    }
    const saveResult = browserWindow
      ? await dialog.showSaveDialog(browserWindow, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true }
    }

    return await renderMappedComposition({
      workspacePath,
      mapped,
      outputPath: ensureMp4Extension(saveResult.filePath),
      signal: abort.signal,
      onProgress: (progress) => {
        if (!sender.isDestroyed()) {
          sender.send(RENDER_PROGRESS_CHANNEL, progress)
        }
      },
    })
  } catch (error) {
    if (abort.signal.aborted) {
      return { canceled: true }
    }

    throw error
  } finally {
    activeAbort = null
  }
}
