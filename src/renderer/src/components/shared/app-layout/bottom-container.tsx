import { type ReactNode } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'

interface BottomContainerProps {
  children: ReactNode
}

export function BottomContainer({ children }: BottomContainerProps) {
  return (
    <ResizablePanel minSize="10%" defaultSize="40%" className="min-h-0">
      <div className="h-full min-h-0 overflow-hidden">{children}</div>
    </ResizablePanel>
  )
}
