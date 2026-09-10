import { type ReactNode } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'

interface TopContainerProps {
  children: ReactNode
}

export function TopContainer({ children }: TopContainerProps) {
  return (
    <ResizablePanel minSize="10%" defaultSize="60%">
      {children}
    </ResizablePanel>
  )
}
