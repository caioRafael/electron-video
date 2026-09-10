import { type ReactNode } from 'react'
import { ResizableHandle, ResizablePanelGroup } from '@/components/ui/resizable'
import { BottomContainer } from './bottom-container'
import { CenterContainer } from './center-container'
import { LeftContainer } from './left-container'
import { RightContainer } from './right-container'
import { TopContainer } from './top-container'

interface AppLayoutProps {
  left: ReactNode
  top: ReactNode
  bottom: ReactNode
  right: ReactNode
}

export function AppLayout({ left, top, bottom, right }: AppLayoutProps) {
  return (
    <main className="flex flex-1 w-screen h-screen">
      <ResizablePanelGroup orientation="horizontal">
        <LeftContainer>{left}</LeftContainer>
        <ResizableHandle />
        <CenterContainer>
          <TopContainer>{top}</TopContainer>
          <ResizableHandle />
          <BottomContainer>{bottom}</BottomContainer>
        </CenterContainer>
        <ResizableHandle />
        <RightContainer>{right}</RightContainer>
      </ResizablePanelGroup>
    </main>
  )
}
