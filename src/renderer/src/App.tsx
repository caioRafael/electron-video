import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Versions } from './components/Versions'

export function App(): React.JSX.Element {
  const handlePing = (): void => {
    window.electron.ipcRenderer.send('ping')
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Video Lab Desktop</CardTitle>
          <CardDescription>
            shadcn/ui initialized with the Lyra preset, emerald theme, IBM Plex Sans, and Phosphor
            icons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add more components with{' '}
            <code className="rounded-none bg-muted px-1 py-0.5 font-medium">
              pnpm dlx shadcn@latest add [component]
            </code>
            .
          </p>
        </CardContent>
        <CardFooter className="justify-between gap-2">
          <Versions />
          <Button onClick={handlePing}>Send IPC</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
