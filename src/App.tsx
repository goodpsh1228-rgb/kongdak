import { DisclaimerModal } from './components/ui'
import { useRoute } from './lib/router'
import { SettingsProvider } from './lib/settings'
import { Measure } from './screens/Measure'
import { Result } from './screens/Result'
import { SettingsScreen } from './screens/Settings'

function Screens() {
  const r = useRoute()
  switch (r.name) {
    case 'settings':
      return <SettingsScreen />
    case 'result':
      return <Result />
    default:
      return <Measure />
  }
}

export default function App() {
  return (
    <SettingsProvider>
      <Screens />
      <DisclaimerModal />
    </SettingsProvider>
  )
}
