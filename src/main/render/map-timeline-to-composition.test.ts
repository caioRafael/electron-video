import { describe, expect, it } from 'vitest'
import { Asset, AssetKind } from '../../shared/assets'
import {
  AudioAssetMetadata,
  ImageAssetMetadata,
  VideoAssetMetadata,
} from '../../shared/asset-metadata'
import { Project } from '../../shared/project'
import { Clip, Timeline } from '../../shared/timeline'
import {
  BLACK_FRAME_ASSET_ID,
  DEFAULT_RENDER_FPS,
  DEFAULT_RENDER_HEIGHT,
  DEFAULT_RENDER_WIDTH,
  mapTimelineToComposition,
} from './map-timeline-to-composition'

function createAsset(input: {
  id: string
  kind: AssetKind
  metadata?: Asset['metadata']
}): Asset {
  return {
    id: input.id,
    name: `${input.id}.file`,
    kind: input.kind,
    source: `assets/${input.kind}/${input.id}`,
    createdAt: '2026-09-15T00:00:00.000Z',
    metadata: input.metadata ?? null,
  }
}

function createVideoMetadata(): VideoAssetMetadata {
  return {
    kind: 'video',
    fileSize: 1024,
    format: 'mp4',
    width: 1920,
    height: 1080,
    duration: 10,
    fps: 30,
    codec: 'h264',
  }
}

function createImageMetadata(): ImageAssetMetadata {
  return {
    kind: 'image',
    fileSize: 256,
    format: 'png',
    width: 1920,
    height: 1080,
  }
}

function createAudioMetadata(): AudioAssetMetadata {
  return {
    kind: 'audio',
    fileSize: 512,
    format: 'mp3',
    duration: 12,
    sampleRate: 44100,
    channels: 2,
    codec: 'mp3',
  }
}

function createClip(input: {
  id: string
  assetId: string
  start: number
  duration: number
  sourceStart?: number
}): Clip {
  return {
    id: input.id,
    assetId: input.assetId,
    start: input.start,
    duration: input.duration,
    sourceStart: input.sourceStart ?? 0,
  }
}

function createProject(timeline: Timeline): Project {
  return {
    id: 'project_1',
    name: 'Test',
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    timeline,
  }
}

describe('mapTimelineToComposition', () => {
  it('maps a video clip to a video scene with mediaStart', () => {
    const video = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_1',
                assetId: video.id,
                start: 0,
                duration: 4,
                sourceStart: 1.5,
              }),
            ],
          },
        ],
      }),
      [video],
    )

    expect(result.composition.scenes).toEqual([
      {
        type: 'video',
        source: 'video_1',
        duration: 4,
        mediaStart: 1.5,
        shortMedia: 'freeze',
        keepAudio: true,
      },
    ])
    expect(result.assetIds).toEqual(['video_1'])
  })

  it('maps an image clip to an image scene', () => {
    const image = createAsset({
      id: 'image_1',
      kind: 'image',
      metadata: createImageMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_1',
                assetId: image.id,
                start: 0,
                duration: 5,
              }),
            ],
          },
        ],
      }),
      [image],
    )

    expect(result.composition.scenes).toEqual([
      {
        type: 'image',
        source: 'image_1',
        duration: 5,
      },
    ])
  })

  it('maps audio clips with absolute start on the composition timeline', () => {
    const video = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const audio = createAsset({
      id: 'audio_1',
      kind: 'audio',
      metadata: createAudioMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_video',
                assetId: video.id,
                start: 0,
                duration: 8,
              }),
            ],
          },
          {
            id: 'track_audio',
            kind: 'audio',
            clips: [
              createClip({
                id: 'clip_audio',
                assetId: audio.id,
                start: 2,
                duration: 3,
              }),
            ],
          },
        ],
      }),
      [video, audio],
    )

    expect(result.composition.audio).toEqual([
      {
        source: 'audio_1',
        role: 'focus',
        start: 2,
        duration: 3,
      },
    ])
    expect(result.assetIds).toEqual(['video_1', 'audio_1'])
  })

  it('disables keepAudio when a video scene overlaps an audio clip', () => {
    const video = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const audio = createAsset({
      id: 'audio_1',
      kind: 'audio',
      metadata: createAudioMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_video',
                assetId: video.id,
                start: 0,
                duration: 6,
              }),
            ],
          },
          {
            id: 'track_audio',
            kind: 'audio',
            clips: [
              createClip({
                id: 'clip_audio',
                assetId: audio.id,
                start: 1,
                duration: 2,
              }),
            ],
          },
        ],
      }),
      [video, audio],
    )

    expect(result.composition.scenes[0]?.keepAudio).toBe(false)
  })

  it('keeps embedded video audio when there is no overlapping audio clip', () => {
    const first = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const second = createAsset({
      id: 'video_2',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const audio = createAsset({
      id: 'audio_1',
      kind: 'audio',
      metadata: createAudioMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_1',
                assetId: first.id,
                start: 0,
                duration: 3,
              }),
              createClip({
                id: 'clip_2',
                assetId: second.id,
                start: 3,
                duration: 3,
              }),
            ],
          },
          {
            id: 'track_audio',
            kind: 'audio',
            clips: [
              createClip({
                id: 'clip_audio',
                assetId: audio.id,
                start: 3,
                duration: 3,
              }),
            ],
          },
        ],
      }),
      [first, second, audio],
    )

    expect(result.composition.scenes[0]?.keepAudio).toBe(true)
    expect(result.composition.scenes[1]?.keepAudio).toBe(false)
  })

  it('fills lead-in and in-between gaps with black frame scenes', () => {
    const video = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const image = createAsset({
      id: 'image_1',
      kind: 'image',
      metadata: createImageMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_1',
                assetId: video.id,
                start: 2,
                duration: 3,
              }),
              createClip({
                id: 'clip_2',
                assetId: image.id,
                start: 7,
                duration: 2,
              }),
            ],
          },
        ],
      }),
      [video, image],
    )

    expect(result.composition.scenes).toEqual([
      {
        type: 'image',
        source: BLACK_FRAME_ASSET_ID,
        duration: 2,
      },
      {
        type: 'video',
        source: 'video_1',
        duration: 3,
        mediaStart: 0,
        shortMedia: 'freeze',
        keepAudio: true,
      },
      {
        type: 'image',
        source: BLACK_FRAME_ASSET_ID,
        duration: 2,
      },
      {
        type: 'image',
        source: 'image_1',
        duration: 2,
      },
    ])
    expect(result.assetIds).toEqual([
      BLACK_FRAME_ASSET_ID,
      'video_1',
      'image_1',
    ])
  })

  it('fills a trailing gap when audio extends past the last visual clip', () => {
    const video = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const audio = createAsset({
      id: 'audio_1',
      kind: 'audio',
      metadata: createAudioMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_video',
                assetId: video.id,
                start: 0,
                duration: 4,
              }),
            ],
          },
          {
            id: 'track_audio',
            kind: 'audio',
            clips: [
              createClip({
                id: 'clip_audio',
                assetId: audio.id,
                start: 0,
                duration: 7,
              }),
            ],
          },
        ],
      }),
      [video, audio],
    )

    expect(result.composition.scenes[1]).toEqual({
      type: 'image',
      source: BLACK_FRAME_ASSET_ID,
      duration: 3,
    })
  })

  it('uses even canvas dimensions and 30 fps', () => {
    const video = createAsset({
      id: 'video_1',
      kind: 'video',
      metadata: createVideoMetadata(),
    })
    const result = mapTimelineToComposition(
      createProject({
        tracks: [
          {
            id: 'track_video',
            kind: 'video',
            clips: [
              createClip({
                id: 'clip_1',
                assetId: video.id,
                start: 0,
                duration: 1,
              }),
            ],
          },
        ],
      }),
      [video],
    )

    expect(result.composition.width).toBe(DEFAULT_RENDER_WIDTH)
    expect(result.composition.height).toBe(DEFAULT_RENDER_HEIGHT)
    expect(result.composition.fps).toBe(DEFAULT_RENDER_FPS)
    expect(result.composition.width % 2).toBe(0)
    expect(result.composition.height % 2).toBe(0)
  })

  it('throws when the timeline has no visual clips', () => {
    const audio = createAsset({
      id: 'audio_1',
      kind: 'audio',
      metadata: createAudioMetadata(),
    })

    expect(() => {
      mapTimelineToComposition(
        createProject({
          tracks: [
            {
              id: 'track_audio',
              kind: 'audio',
              clips: [
                createClip({
                  id: 'clip_audio',
                  assetId: audio.id,
                  start: 0,
                  duration: 4,
                }),
              ],
            },
          ],
        }),
        [audio],
      )
    }).toThrow('The timeline has no visual clips')
  })

  it('throws when a clip references a missing asset', () => {
    expect(() => {
      mapTimelineToComposition(
        createProject({
          tracks: [
            {
              id: 'track_video',
              kind: 'video',
              clips: [
                createClip({
                  id: 'clip_1',
                  assetId: 'missing',
                  start: 0,
                  duration: 2,
                }),
              ],
            },
          ],
        }),
        [],
      )
    }).toThrow('Asset not found')
  })
})
