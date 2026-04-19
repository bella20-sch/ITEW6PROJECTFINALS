import { useData } from '../context/DataContext'
import ContentLoadingSkeleton from './ContentLoadingSkeleton'
import DirectoryLoadErrorPanel from './DirectoryLoadErrorPanel'

/** Blocks children until meta/students directory is loaded; clears stale UI on failure. */
export default function DirectoryFetchBarrier({ children }) {
  const { directoryStatus, reloadDirectory } = useData()
  if (directoryStatus === 'loading' || directoryStatus === 'idle') {
    return <ContentLoadingSkeleton title="Loading directory data…" />
  }
  if (directoryStatus === 'error') {
    return <DirectoryLoadErrorPanel onRetry={reloadDirectory} />
  }
  return children
}
