export function Versions(): React.JSX.Element {
  const versions = window.electron.process.versions

  return (
    <p className="text-muted-foreground">
      Electron {versions.electron} · Chromium {versions.chrome} · Node{' '}
      {versions.node}
    </p>
  )
}
