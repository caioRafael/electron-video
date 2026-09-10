import { type ReactNode } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'

interface RightContainerProps {
  children: ReactNode
}

export function RightContainer({ children }: RightContainerProps) {
  return (
    <ResizablePanel minSize="10%" maxSize="45%" defaultSize="25%">
      {children}
    </ResizablePanel>
  )
}
