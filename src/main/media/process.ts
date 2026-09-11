import { spawn } from 'node:child_process'

const DEFAULT_TIMEOUT_MS = 30_000

export interface ProcessResult {
  stdout: string
  stderr: string
  exitCode: number
}

export function runProcess(
  binaryPath: string,
  args: readonly string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, [...args], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    function settle(callback: () => void): void {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timer)
      callback()
    }

    const timer = setTimeout(() => {
      child.kill()
      settle(() => {
        reject(new Error(`Process timed out: ${binaryPath}`))
      })
    }, timeoutMs)

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })

    child.on('error', (error) => {
      settle(() => {
        reject(error)
      })
    })

    child.on('close', (code) => {
      settle(() => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        })
      })
    })
  })
}
