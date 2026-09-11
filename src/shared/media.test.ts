import { describe, expect, it } from 'vitest'
import {
  createAssetMediaUrl,
  MEDIA_ASSET_HOST,
  MEDIA_PROTOCOL,
  parseAssetMediaRequestUrl,
} from './media'

describe('asset media url', () => {
  it('creates a logical videolab URL for an asset id', () => {
    expect(createAssetMediaUrl('asset_123')).toBe('videolab://asset/asset_123')
  })

  it('uses the defined protocol and host', () => {
    const url = new URL(createAssetMediaUrl('asset_abc'))

    expect(url.protocol).toBe(`${MEDIA_PROTOCOL}:`)
    expect(url.hostname).toBe(MEDIA_ASSET_HOST)
    expect(url.pathname).toBe('/asset_abc')
  })

  it('does not include a filesystem path', () => {
    const url = createAssetMediaUrl('asset_123')

    expect(url.includes('/Users/')).toBe(false)
    expect(url.includes('C:\\')).toBe(false)
    expect(url.startsWith('file:')).toBe(false)
  })

  it('parses the asset id from a valid request URL', () => {
    expect(parseAssetMediaRequestUrl('videolab://asset/asset_123')).toBe(
      'asset_123',
    )
  })

  it('rejects a non-asset host', () => {
    expect(() =>
      parseAssetMediaRequestUrl('videolab://file/secret.txt'),
    ).toThrow('Invalid asset')
  })

  it('rejects a path that tries to escape the asset host', () => {
    expect(() =>
      parseAssetMediaRequestUrl('videolab://asset/../secret'),
    ).toThrow('Invalid asset')
  })
})
