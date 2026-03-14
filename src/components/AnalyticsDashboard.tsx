import { Activity, BarChart3, Clock, MapPinned, ShieldAlert, Users } from 'lucide-react';

export function AnalyticsDashboard() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-background">
      <div>
        <h2 className="text-lg font-medium text-[#E1E1E1] flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          <BarChart3 className="w-5 h-5 text-primary" />
          Analytics Dashboard
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
          Comprehensive response performance and coverage metrics
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Reports (7d)', value: '128', icon: Activity },
          { label: 'Critical Alerts', value: '23', icon: ShieldAlert },
          { label: 'Active Responders', value: '64', icon: Users },
          { label: 'Regions Monitored', value: '12', icon: MapPinned },
        ].map(item => (
          <div
            key={item.label}
            className="bg-card border border-white/[0.08] rounded-[12px] p-6 flex items-center gap-3 transition-all duration-200 ease-out hover:border-white/[0.12]"
          >
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary">
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</p>
              <p className="text-lg font-medium text-[#E1E1E1]" style={{ fontFamily: 'Inter, sans-serif' }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-white/[0.08] rounded-[12px] p-6 space-y-4 transition-all duration-200 ease-out hover:border-white/[0.12]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#E1E1E1]" style={{ fontFamily: 'Inter, sans-serif' }}>Response Time Analysis</h3>
              <p className="text-[11px] text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                Average performance across all incident types
              </p>
            </div>
            <Clock className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Average Response Time', value: '2.3 hours' },
              { label: 'Critical Alert Response', value: '15 minutes' },
              { label: 'Verification Time', value: '45 minutes' },
            ].map(item => (
              <div
                key={item.label}
                className="bg-secondary rounded-lg px-3 py-3 border border-white/[0.08] space-y-1"
              >
                <p className="text-[11px] text-muted-foreground leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</p>
                <p className="text-sm font-medium text-primary" style={{ fontFamily: 'Inter, sans-serif' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-white/[0.08] rounded-[12px] p-6 space-y-4 transition-all duration-200 ease-out hover:border-white/[0.12]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#E1E1E1]" style={{ fontFamily: 'Inter, sans-serif' }}>Geographic Coverage</h3>
              <p className="text-[11px] text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                Reach and capacity of active response network
              </p>
            </div>
            <MapPinned className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active Regions', value: '12' },
              { label: 'Coverage Area', value: '2,500 km²' },
              { label: 'Population Served', value: '1.2M' },
              { label: 'Critical Hotspots', value: '7' },
            ].map(item => (
              <div
                key={item.label}
                className="bg-secondary rounded-lg px-3 py-3 border border-white/[0.08] space-y-1"
              >
                <p className="text-[11px] text-muted-foreground leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</p>
                <p className="text-sm font-medium text-primary" style={{ fontFamily: 'Inter, sans-serif' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

