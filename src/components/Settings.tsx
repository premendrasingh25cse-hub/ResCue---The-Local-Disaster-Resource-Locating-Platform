import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Moon, Globe, LogOut, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Settings() {
  const { userProfile, setUserProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'preferences'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Local form state
  const [formData, setFormData] = useState({
    name: userProfile.name,
    email: userProfile.email,
    phone: userProfile.phone,
  });

  useEffect(() => {
    setFormData({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
    });
  }, [userProfile]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate network delay
    setTimeout(() => {
      setUserProfile({
        ...userProfile,
        ...formData
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'User Profile' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security & Privacy' },
    { id: 'preferences', icon: Globe, label: 'App Preferences' },
  ] as const;

  return (
    <div className="h-full overflow-y-auto bg-transparent p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-medium text-[#E1E1E1] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Settings & Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage your ResCue account defaults, notifications, and application preferences.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ease-out font-medium
                  ${
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'
                  }
                `}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="card-premium p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border-2 border-white/20 relative group cursor-pointer overflow-hidden">
                    <img 
                      src="/images/unknown_boy_avatar_1773454567626.png" 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-white font-medium">Edit</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-medium text-white" style={{ fontFamily: 'Inter, sans-serif' }}>{userProfile.name}</h3>
                    <p className="text-sm text-primary">{userProfile.role} · ResCue Hub 89</p>
                    <p className="text-xs text-muted-foreground">Joined March 2024</p>
                  </div>
                </div>

                <div className="card-premium p-6 sm:p-8 space-y-6">
                  <h4 className="text-lg font-medium text-white border-b border-white/10 pb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Role / Designation</label>
                      <input 
                        type="text" 
                        value={userProfile.role} 
                        disabled
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-muted-foreground opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end items-center gap-4">
                    {saveSuccess && (
                      <span className="text-sm text-success flex items-center gap-1.5 animate-in fade-in">
                        <Check className="w-4 h-4" />
                        Saved successfully!
                      </span>
                    )}
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 bg-primary/90 hover:bg-primary text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[130px]"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'profile' && (
              <div className="card-premium p-12 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  {activeTab === 'notifications' && <Bell className="w-8 h-8" />}
                  {activeTab === 'security' && <Shield className="w-8 h-8" />}
                  {activeTab === 'preferences' && <Globe className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-medium text-white capitalize space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {activeTab.replace('-', ' ')} Settings
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  This preferences section is currently offline. Advanced configuration options will be available in the next deployment update.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
