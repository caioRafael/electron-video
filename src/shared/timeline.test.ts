import { describe, expect, it } from 'vitest'
import { Asset, AssetKind } from './assets'
import { AudioAssetMetadata, VideoAssetMetadata } from './asset-metadata'
import {
  Clip,
  DEFAULT_CLIP_DURATION,
  MIN_CLIP_DURATION,
  MIN_TIMELINE_DURATION,
  appendAssetToTimeline,
  createEmptyTimeline,
  getAssetClipDuration,
  getAssetSourceDuration,
  getTimelineDuration,
  getTrackKindForAsset,
  getTrackLabel,
  getReorderedClips,
  getTrimmedClip,
  removeClipFromTimeline,
  reorderClipInTimeline,
  replaceClipInTimeline,
} from './timeline'

function createAsset(input: {
  id?: string
  kind: AssetKind
  name?: string
  metadata?: Asset['metadata']
}): Asset {
  return {
    id: input.id ?? 'asset_1',
    name: input.name ?? 'file.mp4',
    kind: input.kind,
    source: `assets/${input.kind}/file`,
    createdAt: '2026-09-11T00:00:00.000Z',
    metadata: input.metadata ?? null,
  }
}

function createVideoMetadata(duration: number): VideoAssetMetadata {
  return {
    kind: 'video',
    fileSize: 1024,
    format: 'mp4',
    width: 1920,
    height: 1080,
    duration,
    fps: 30,
    codec: 'h264',
  }
}

function createAudioMetadata(duration: number): AudioAssetMetadata {
  return {
    kind: 'audio',
    fileSize: 512,
    format: 'mp3',
    duration,
    sampleRate: 44100,
    channels: 2,
    codec: 'mp3',
  }
}

describe('getTrackKindForAsset', () => {
  it('maps video and image assets to a video track', () => {
    expect(getTrackKindForAsset('video')).toBe('video')
    expect(getTrackKindForAsset('image')).toBe('video')
  })

  it('maps audio assets to an audio track', () => {
    expect(getTrackKindForAsset('audio')).toBe('audio')
  })
})

describe('getAssetClipDuration', () => {
  it('uses video and audio metadata duration', () => {
    expect(
      getAssetClipDuration(
        createAsset({ kind: 'video', metadata: createVideoMetadata(12) }),
      ),
    ).toBe(12)
    expect(
      getAssetClipDuration(
        createAsset({ kind: 'audio', metadata: createAudioMetadata(8.5) }),
      ),
    ).toBe(8.5)
  })

  it('falls back to the default duration for images and missing metadata', () => {
    expect(getAssetClipDuration(createAsset({ kind: 'image' }))).toBe(
      DEFAULT_CLIP_DURATION,
    )
    expect(getAssetClipDuration(createAsset({ kind: 'video' }))).toBe(
      DEFAULT_CLIP_DURATION,
    )
  })
})

describe('getTimelineDuration', () => {
  it('never goes below the minimum canvas duration', () => {
    expect(getTimelineDuration(createEmptyTimeline())).toBe(
      MIN_TIMELINE_DURATION,
    )
  })

  it('uses the last clip end when it exceeds the minimum', () => {
    expect(
      getTimelineDuration({
        tracks: [
          {
            id: 'track_1',
            kind: 'video',
            clips: [
              {
                id: 'clip_1',
                assetId: 'asset_1',
                start: 0,
                duration: 40,
                sourceStart: 0,
              },
            ],
          },
        ],
      }),
    ).toBe(40)
  })
})

describe('getTrackLabel', () => {
  it('derives V and A labels from the kind index', () => {
    expect(getTrackLabel('video', 0)).toBe('V1')
    expect(getTrackLabel('audio', 1)).toBe('A2')
  })
})

describe('appendAssetToTimeline', () => {
  it('creates a video track and starts the first clip at 0', () => {
    const timeline = appendAssetToTimeline(
      createEmptyTimeline(),
      createAsset({ id: 'asset_video', kind: 'video' }),
    )

    expect(timeline.tracks).toHaveLength(1)
    expect(timeline.tracks[0].kind).toBe('video')
    expect(timeline.tracks[0].clips).toEqual([
      expect.objectContaining({
        assetId: 'asset_video',
        start: 0,
        duration: DEFAULT_CLIP_DURATION,
        sourceStart: 0,
      }),
    ])
    expect(timeline.tracks[0].clips[0].id.startsWith('clip_')).toBe(true)
    expect(timeline.tracks[0].id.startsWith('track_')).toBe(true)
  })

  it('appends a second clip of the same kind after the previous end', () => {
    const first = appendAssetToTimeline(
      createEmptyTimeline(),
      createAsset({
        id: 'asset_video',
        kind: 'video',
        metadata: createVideoMetadata(7),
      }),
    )
    const second = appendAssetToTimeline(
      first,
      createAsset({
        id: 'asset_video_2',
        kind: 'video',
        metadata: createVideoMetadata(9),
      }),
    )

    expect(second.tracks).toHaveLength(1)
    expect(second.tracks[0].clips).toHaveLength(2)
    expect(second.tracks[0].clips[1]).toEqual(
      expect.objectContaining({
        assetId: 'asset_video_2',
        start: 7,
        duration: 9,
      }),
    )
  })

  it('creates a second track for a different kind without changing the first', () => {
    const videoTimeline = appendAssetToTimeline(
      createEmptyTimeline(),
      createAsset({ id: 'asset_video', kind: 'video' }),
    )
    const firstTrack = videoTimeline.tracks[0]
    const nextTimeline = appendAssetToTimeline(
      videoTimeline,
      createAsset({ id: 'asset_audio', kind: 'audio' }),
    )

    expect(nextTimeline.tracks).toHaveLength(2)
    expect(nextTimeline.tracks[0]).toEqual(firstTrack)
    expect(nextTimeline.tracks[1].kind).toBe('audio')
    expect(nextTimeline.tracks[1].clips[0].assetId).toBe('asset_audio')
  })

  it('does not mutate the original timeline', () => {
    const original = createEmptyTimeline()
    const next = appendAssetToTimeline(
      original,
      createAsset({ id: 'asset_video', kind: 'video' }),
    )

    expect(original.tracks).toEqual([])
    expect(next).not.toBe(original)
    expect(next.tracks).not.toBe(original.tracks)
  })
})

function createClip(input: Partial<Clip> = {}): Clip {
  return {
    id: input.id ?? 'clip_1',
    assetId: input.assetId ?? 'asset_1',
    start: input.start ?? 2,
    duration: input.duration ?? 6,
    sourceStart: input.sourceStart ?? 0,
  }
}

describe('getAssetSourceDuration', () => {
  it('returns media duration for video and audio', () => {
    expect(
      getAssetSourceDuration(
        createAsset({ kind: 'video', metadata: createVideoMetadata(12) }),
      ),
    ).toBe(12)
    expect(
      getAssetSourceDuration(
        createAsset({ kind: 'audio', metadata: createAudioMetadata(8) }),
      ),
    ).toBe(8)
  })

  it('returns null for images and missing metadata', () => {
    expect(getAssetSourceDuration(createAsset({ kind: 'image' }))).toBeNull()
    expect(getAssetSourceDuration(createAsset({ kind: 'video' }))).toBeNull()
  })
})

describe('getTrimmedClip', () => {
  it('shortens the end of a clip', () => {
    expect(
      getTrimmedClip({
        clip: createClip(),
        edge: 'end',
        deltaSeconds: -2,
        minStart: 0,
        maxEnd: 20,
        sourceDuration: 12,
      }),
    ).toEqual(
      expect.objectContaining({
        start: 2,
        duration: 4,
        sourceStart: 0,
      }),
    )
  })

  it('does not extend a video past the remaining source', () => {
    expect(
      getTrimmedClip({
        clip: createClip({ start: 0, duration: 4, sourceStart: 2 }),
        edge: 'end',
        deltaSeconds: 20,
        minStart: 0,
        maxEnd: 40,
        sourceDuration: 8,
      }).duration,
    ).toBe(6)
  })

  it('does not overlap the next clip when extending the end', () => {
    expect(
      getTrimmedClip({
        clip: createClip({ start: 0, duration: 4 }),
        edge: 'end',
        deltaSeconds: 20,
        minStart: 0,
        maxEnd: 5,
        sourceDuration: null,
      }).duration,
    ).toBe(5)
  })

  it('moves the video in-point when trimming the start', () => {
    expect(
      getTrimmedClip({
        clip: createClip({ start: 2, duration: 6, sourceStart: 1 }),
        edge: 'start',
        deltaSeconds: 2,
        minStart: 0,
        maxEnd: 20,
        sourceDuration: 12,
      }),
    ).toEqual(
      expect.objectContaining({
        start: 4,
        duration: 4,
        sourceStart: 3,
      }),
    )
  })

  it('does not move a video in-point before the source start', () => {
    expect(
      getTrimmedClip({
        clip: createClip({ start: 4, duration: 4, sourceStart: 1 }),
        edge: 'start',
        deltaSeconds: -8,
        minStart: 0,
        maxEnd: 20,
        sourceDuration: 10,
      }),
    ).toEqual(
      expect.objectContaining({
        start: 3,
        duration: 5,
        sourceStart: 0,
      }),
    )
  })

  it('keeps an image sourceStart unchanged', () => {
    expect(
      getTrimmedClip({
        clip: createClip({ start: 4, duration: 5, sourceStart: 0 }),
        edge: 'start',
        deltaSeconds: -2,
        minStart: 0,
        maxEnd: 20,
        sourceDuration: null,
      }),
    ).toEqual(
      expect.objectContaining({
        start: 2,
        duration: 7,
        sourceStart: 0,
      }),
    )
  })

  it('enforces a minimum clip duration', () => {
    expect(
      getTrimmedClip({
        clip: createClip({ start: 0, duration: 2 }),
        edge: 'end',
        deltaSeconds: -10,
        minStart: 0,
        maxEnd: 20,
        sourceDuration: null,
      }).duration,
    ).toBe(MIN_CLIP_DURATION)
  })
})

describe('replaceClipInTimeline', () => {
  it('replaces the matching clip without mutating the original timeline', () => {
    const timeline = {
      tracks: [
        {
          id: 'track_1',
          kind: 'video' as const,
          clips: [createClip({ id: 'clip_1', duration: 6 })],
        },
      ],
    }
    const nextClip = createClip({ id: 'clip_1', duration: 3, sourceStart: 2 })
    const next = replaceClipInTimeline(timeline, nextClip)

    expect(next.tracks[0].clips[0]).toEqual(nextClip)
    expect(timeline.tracks[0].clips[0].duration).toBe(6)
  })
})

describe('getReorderedClips', () => {
  it('moves a clip after the next one and packs the track', () => {
    const clips = [
      createClip({ id: 'clip_a', start: 0, duration: 4 }),
      createClip({ id: 'clip_b', start: 4, duration: 3 }),
    ]

    expect(getReorderedClips(clips, 'clip_a', 6)).toEqual([
      expect.objectContaining({ id: 'clip_b', start: 0, duration: 3 }),
      expect.objectContaining({ id: 'clip_a', start: 3, duration: 4 }),
    ])
  })

  it('moves a clip to the start of the track', () => {
    const clips = [
      createClip({ id: 'clip_a', start: 0, duration: 4 }),
      createClip({ id: 'clip_b', start: 4, duration: 3 }),
    ]

    expect(getReorderedClips(clips, 'clip_b', 0)).toEqual([
      expect.objectContaining({ id: 'clip_b', start: 0 }),
      expect.objectContaining({ id: 'clip_a', start: 3 }),
    ])
  })
})

describe('reorderClipInTimeline', () => {
  it('keeps the timeline unchanged when the order stays the same', () => {
    const timeline = {
      tracks: [
        {
          id: 'track_1',
          kind: 'video' as const,
          clips: [
            createClip({ id: 'clip_a', start: 0, duration: 4 }),
            createClip({ id: 'clip_b', start: 4, duration: 3 }),
          ],
        },
      ],
    }

    const next = reorderClipInTimeline(timeline, 'clip_a', 1)

    expect(next.tracks[0]).toBe(timeline.tracks[0])
  })
})

describe('removeClipFromTimeline', () => {
  it('removes the clip and empty tracks', () => {
    const timeline = {
      tracks: [
        {
          id: 'track_1',
          kind: 'video' as const,
          clips: [
            createClip({ id: 'clip_a', start: 0, duration: 4 }),
            createClip({ id: 'clip_b', start: 4, duration: 3 }),
          ],
        },
      ],
    }

    expect(removeClipFromTimeline(timeline, 'clip_a').tracks[0].clips).toEqual([
      expect.objectContaining({ id: 'clip_b' }),
    ])
    expect(removeClipFromTimeline(timeline, 'clip_b').tracks[0].clips).toEqual([
      expect.objectContaining({ id: 'clip_a' }),
    ])
    expect(
      removeClipFromTimeline(
        removeClipFromTimeline(timeline, 'clip_a'),
        'clip_b',
      ).tracks,
    ).toEqual([])
  })

  it('does not mutate the original timeline', () => {
    const timeline = {
      tracks: [
        {
          id: 'track_1',
          kind: 'video' as const,
          clips: [createClip({ id: 'clip_a' })],
        },
      ],
    }

    removeClipFromTimeline(timeline, 'clip_a')

    expect(timeline.tracks[0].clips).toHaveLength(1)
  })
})
