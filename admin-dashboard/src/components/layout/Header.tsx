import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">PickAlo Admin</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" onPress={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
