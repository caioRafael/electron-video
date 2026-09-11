import { protocol } from 'electron'
import { MEDIA_PROTOCOL, parseAssetMediaRequestUrl } from '../../shared/media'
import { requireCurrentWorkspacePath } from '../workspace-session'
import { resolveAssetFilePath } from './asset-resolver'
import { createAssetFileResponse } from './file-response'

export function registerMediaProtocolPrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
      },
    },
  ])
}

export function registerMediaProtocol(): void {
  protocol.handle(MEDIA_PROTOCOL, async (request) => {
    try {
      const assetId = parseAssetMediaRequestUrl(request.url)
      const workspacePath = await requireCurrentWorkspacePath()
      const filePath = await resolveAssetFilePath(workspacePath, assetId)

      return createAssetFileResponse(filePath, request.headers.get('range'))
    } catch {
      return new Response(null, { status: 404 })
    }
  })
}
