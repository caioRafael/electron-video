import { useEffect } from 'react'
import { Player } from './components/feature/player'
import { WorkspaceAssetDropOverlay } from './components/feature/workspace/WorkspaceAssetDropOverlay'
import { WorkspaceModal } from './components/feature/workspace/WorkspaceModal'
import { WorkspaceSidebar } from './components/feature/workspace/WorkspaceSidebar'
import { AppLayout } from './components/shared/app-layout'
import { usePlayback } from './hooks/usePlayback'
import { refreshWorkspaces } from './services/workspace/session'
import { useWorkspaceStore } from './stores'
import { TimeLineContainer } from './components/feature/timeline'

export function App() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)

  usePlayback()

  useEffect(() => {
    async function loadWorkspaces() {
      await refreshWorkspaces()
    }

    loadWorkspaces()
  }, [])

  return (
    <>
      <AppLayout
        left={
          <>
            <WorkspaceModal open={!currentWorkspace} />
            <WorkspaceSidebar />
          </>
        }
        top={<Player />}
        bottom={
          <>
            <TimeLineContainer />
          </>
        }
        right="right panel - timeline editor"
      />
      <WorkspaceAssetDropOverlay />
    </>
  )
}
