import { type ReactNode } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'

interface BottomContainerProps {
  children: ReactNode
}

export function BottomContainer({ children }: BottomContainerProps) {
  return (
    <ResizablePanel minSize="10%" defaultSize="40%">
      {children}
    </ResizablePanel>
  )
}
