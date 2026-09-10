import { type ReactNode } from 'react'
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

interface CenterContainerProps {
  children: ReactNode
}

export function CenterContainer({ children }: CenterContainerProps) {
  return (
    <ResizablePanel className="min-h-0">
      <ResizablePanelGroup className="min-h-0" orientation="vertical">
        {children}
      </ResizablePanelGroup>
    </ResizablePanel>
  )
}
