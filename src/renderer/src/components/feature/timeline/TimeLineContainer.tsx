import { TimeLineContent } from './TimeLineContent'
import { TimeLineHeader } from './TimeLineHeader'

export function TimeLineContainer() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <TimeLineHeader title="Timeline" />
      <TimeLineContent />
    </div>
  )
}
