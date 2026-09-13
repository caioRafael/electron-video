import { type ReactNode } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'

interface TopContainerProps {
  children: ReactNode
}

export function TopContainer({ children }: TopContainerProps) {
  return (
    <ResizablePanel minSize="10%" defaultSize="60%" className="min-h-0">
      <div className="h-full min-h-0 overflow-hidden">{children}</div>
    </ResizablePanel>
  )
}
