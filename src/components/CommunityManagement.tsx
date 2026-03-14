import { Bell, Mail, Phone, Users, BarChart3 } from 'lucide-react';
import { useState } from 'react';

type TabId = 'members' | 'subscriptions' | 'communications' | 'analytics';

const members = [
  { name: 'Rajesh Kumar', phone: '+91-9876543210', email: 'rajesh@email.com', location: 'Mumbai, Maharashtra', status: 'active', joined: '1/15/2024' },
  { name: 'Priya Sharma', phone: '+91-9876543211', email: 'priya@email.com', location: 'Goa, Goa', status: 'active', joined: '1/20/2024' },
  { name: 'Vikram Singh', phone: '+91-9876543212', email: 'vikram@email.com', location: 'Chennai, Tamil Nadu', status: 'inactive', joined: '2/1/2024' },
];

export function CommunityManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('members');

  const summaryCards = [
    { label: 'Total Members', value: '3', icon: Users },
    { label: 'Active Subscribers', value: '2', icon: Bell },
    { label: 'SMS Subscribers', value: '2', icon: Phone },
    { label: 'Email Subscribers', value: '2', icon: Mail },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-background">
      <div>
        <h2 className="text-lg font-medium text-[#E1E1E1] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>Community Management</h2>
        <p className="text-xs text-muted-foreground mt-0.5 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          Manage community members and communication channels
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div
            key={card.label}
            className="bg-card border border-white/[0.08] rounded-[12px] p-6 flex items-center gap-3 transition-all duration-200 ease-out hover:border-white/[0.12]"
          >
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary">
              <card.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                {card.label}
              </p>
              <p className="text-lg font-medium text-[#E1E1E1]" style={{ fontFamily: 'Inter, sans-serif' }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-white/[0.08] flex gap-6 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
        {[
          { id: 'members', label: 'Members' },
          { id: 'subscriptions', label: 'Subscriptions' },
          { id: 'communications', label: 'Communications' },
          { id: 'analytics', label: 'Analytics' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`pb-2 -mb-px border-b-2 transition-all duration-200 ease-out ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#E1E1E1]" style={{ fontFamily: 'Inter, sans-serif' }}>Community Members</h3>
            <button className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-xs hover:opacity-90 transition-all duration-200 ease-out" style={{ fontFamily: 'Inter, sans-serif' }}>
              + Add Member
            </button>
          </div>
          <div className="border border-white/[0.08] rounded-[12px] overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Joined</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.email} className="border-t border-subtle border-border">
                    <td className="px-4 py-2 text-foreground">{m.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.phone}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.location}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                          m.status === 'active'
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{m.joined}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button className="px-2 py-1 rounded bg-secondary text-foreground text-[11px] hover:bg-secondary/80">
                        Edit
                      </button>
                      <button className="px-2 py-1 rounded bg-destructive text-destructive-foreground text-[11px] hover:bg-destructive/90">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">Subscription Management</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                title: 'SMS Subscriptions',
                description: 'Manage SMS alert subscriptions',
                icon: Phone,
              },
              {
                title: 'Email Subscriptions',
                description: 'Manage email alert subscriptions',
                icon: Mail,
              },
              {
                title: 'Push Notifications',
                description: 'Manage push notification subscriptions',
                icon: Bell,
              },
            ].map(card => (
              <div
                key={card.title}
                className="bg-card border border-white/[0.08] rounded-[12px] p-6 space-y-3 transition-all duration-200 ease-out hover:border-white/[0.12]"
              >
                <div className="flex items-center gap-2">
                  <card.icon className="w-4 h-4 text-primary" />
                  <h4 className="font-mono text-sm font-semibold text-foreground">{card.title}</h4>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">{card.description}</p>
                <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-mono text-xs hover:opacity-90 transition-opacity duration-75">
                  Manage {card.title.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">Recent Communications</h3>
          <div className="border border-white/[0.08] rounded-[12px] p-6 space-y-3 text-xs text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
            <p>No recent campaigns. Use your messaging tools to send alerts to community members.</p>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Community Analytics
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Members', value: '3', sub: '+0 this week' },
              { label: 'Active Subscribers', value: '2', sub: '+0% this month' },
              { label: 'Reports This Week', value: '0', sub: 'No change' },
              { label: 'Verified Reports', value: '0', sub: '+0% accuracy' },
            ].map(card => (
              <div
                key={card.label}
                className="bg-card border border-white/[0.08] rounded-[12px] p-6 space-y-1 transition-all duration-200 ease-out hover:border-white/[0.12]"
              >
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="font-mono text-xl font-semibold text-foreground">{card.value}</p>
                <p className="font-mono text-[11px] text-success">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

