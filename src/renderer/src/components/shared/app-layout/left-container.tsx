import { type ReactNode } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'

interface LeftContainerProps {
  children: ReactNode
}

export function LeftContainer({ children }: LeftContainerProps) {
  return (
    <ResizablePanel
      minSize="10%"
      maxSize="45%"
      defaultSize="25%"
      className="min-h-0"
    >
      {children}
    </ResizablePanel>
  )
}
