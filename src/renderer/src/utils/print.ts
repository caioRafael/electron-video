export function print(message: string): void {
  window.electron.ipcRenderer.send('print', message)
}
