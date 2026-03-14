import { Home, Map, AlertTriangle, Package, Users, Users2, BookOpen, BarChart3, Wifi, WifiOff, Zap, ZapOff, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
  { id: 'map' as const, label: 'Live Map', icon: Map },
  { id: 'sos' as const, label: 'SOS Triage', icon: AlertTriangle },
  { id: 'resource' as const, label: 'Resource Logistics', icon: Package },
  { id: 'volunteer' as const, label: 'Volunteer Mesh', icon: Users },
  { id: 'guide' as const, label: 'Emergency Guide', icon: BookOpen },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  { id: 'community' as const, label: 'Community', icon: Users2 },
];

export function AppSidebar() {
  const { activeView, setActiveView, online, highContrast, toggleHighContrast, userProfile } = useApp();

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col border-r border-white/[0.08] h-screen"
      style={{
        background: 'hsl(var(--sidebar-background))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="p-5 border-b border-white/[0.08]">
        <h1 className="font-medium text-lg tracking-tight text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
          Res<span className="text-primary">Cue</span>
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>DISASTER RESPONSE v2.0</p>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ease-out ${
              activeView === item.id
                ? 'bg-sidebar-accent text-primary border-r-2 border-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/[0.08] space-y-4">
        {/* User Mini Profile */}
        <div 
          onClick={() => setActiveView('settings')}
          className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors flex-shrink-0">
            <img 
              src="/images/unknown_boy_avatar_1773454567626.png" 
              alt="User Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{userProfile.name}</p>
            <p className="text-[10px] text-primary truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{userProfile.role}</p>
          </div>
        </div>

        {/* Existing System Controls */}
        <div className="space-y-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            {online ? (
              <>
                <Wifi className="w-3 h-3 text-success" />
                <span className="text-success">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-urgent" />
                <span className="text-urgent">OFFLINE</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={toggleHighContrast}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 ease-out"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {highContrast ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
              <span>{highContrast ? 'NORMAL MODE' : 'BATTERY SAVER'}</span>
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`p-1.5 rounded-md transition-all duration-200 ease-out ${
                activeView === 'settings' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
              title="Settings & Profile"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
