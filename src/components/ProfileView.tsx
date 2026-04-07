import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  Bell,
  Shield,
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { UserProfile } from '../types';

export const ProfileView = ({ 
  userProfile, 
  onUpdateProfile,
  notificationsEnabled,
  setNotificationsEnabled,
  movementThreshold,
  setMovementThreshold
}: { 
  userProfile: UserProfile | null, 
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>,
  notificationsEnabled: boolean,
  setNotificationsEnabled: (enabled: boolean) => void,
  movementThreshold: number,
  setMovementThreshold: (threshold: number) => void
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userProfile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateProfile({ displayName: newName.trim() });
      setIsEditingName(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Profile Header */}
      <div className="bg-card border border-border p-10 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center border-4 border-border overflow-hidden">
            {userProfile.photoURL ? (
              <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={48} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-foreground/5 border border-border rounded-xl px-4 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Activity size={20} className="animate-spin" /> : <Settings size={20} />}
                  </button>
                  <button 
                    onClick={() => { setIsEditingName(false); setNewName(userProfile.displayName || ''); }}
                    className="p-2 bg-foreground/10 text-gray-500 rounded-xl hover:bg-foreground/20 transition-all"
                  >
                    <Settings size={20} className="rotate-45" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <h2 className="text-4xl font-bold tracking-tight">{userProfile.displayName || 'Investor'}</h2>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-all"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-500/20">
                  {userProfile.isPremium ? 'Premium Member' : 'Freemium Tier'}
                </span>
              </div>
            </div>
            <p className="text-gray-500 font-medium">{userProfile.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Stats */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Activity size={20} className="text-blue-500" />
            Account Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Watchlist Items", value: userProfile.watchlist?.length || 0, icon: TrendingUp, color: "text-green-500" },
              { label: "Analyses Run", value: userProfile.analysesCount || 0, icon: Zap, color: "text-yellow-500" },
              { label: "Trends Explored", value: userProfile.trendsCount || 0, icon: Activity, color: "text-blue-500" },
              { label: "Member Since", value: "2024", icon: Shield, color: "text-purple-500" }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-foreground/5 rounded-3xl border border-transparent hover:border-border transition-all">
                <stat.icon size={20} className={cn("mb-3", stat.color)} />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Bell size={20} className="text-yellow-500" />
            Notification Preferences
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-foreground/5 rounded-3xl">
              <div>
                <p className="font-bold mb-1">Price Change Alerts</p>
                <p className="text-xs text-gray-500">Get notified when stocks move significantly.</p>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative p-1",
                  notificationsEnabled ? "bg-green-500" : "bg-gray-400"
                )}
              >
                <motion.div 
                  animate={{ x: notificationsEnabled ? 24 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="p-6 bg-foreground/5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm">Alert Threshold</p>
                <span className="text-xs font-bold text-green-500">{movementThreshold}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5"
                value={movementThreshold}
                onChange={(e) => setMovementThreshold(parseFloat(e.target.value))}
                className="w-full accent-green-500"
              />
              <p className="text-[10px] text-gray-500 font-medium">Trigger alerts when a stock moves more than this percentage in a single session.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="bg-card border border-border p-10 rounded-[3rem] space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <CreditCard size={24} className="text-green-500" />
              Subscription Plan
            </h3>
            <p className="text-gray-500">Manage your billing and subscription features.</p>
          </div>
          <button className="px-8 py-4 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2">
            Manage Subscription <ArrowRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Current Plan", value: userProfile.isPremium ? "Premium" : "Freemium", icon: Shield },
            { label: "Next Billing", value: "N/A", icon: Activity },
            { label: "Payment Method", value: "Google Play", icon: CreditCard }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-foreground/5 rounded-3xl border border-border">
              <item.icon size={18} className="text-gray-400 mb-4" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="p-8 bg-green-500/5 rounded-[2rem] border border-green-500/10">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-green-500" />
            Plan Benefits
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Real-time AI Stock Analysis",
              "Unlimited Watchlist Items",
              "Advanced Technical Indicators",
              "Priority Market Alerts",
              "Voice Agent Access",
              "Ad-free Experience"
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
