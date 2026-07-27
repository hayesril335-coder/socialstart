import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/navigation/AppHeader'
import { BottomNavigation } from '../components/navigation/BottomNavigation'
export function MainAppLayout(){return <div className="app-shell"><AppHeader/><main><Outlet/></main><BottomNavigation/></div>}
