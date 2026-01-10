
import React from "react";
import { TrendingUp, Users, Activity, PieChart, BarChart } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  status?: string;
  isTopTeam?: boolean;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  status,
  isTopTeam,
  isLoading,
}) => (
  <div className="premium-stat-card group">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
    </div>
    <p className="text-4xl font-bold text-foreground">{isLoading ? '...' : value}</p>
    {!isLoading && isTopTeam && (
      <div className="text-xs text-muted-foreground mt-2">
        <TrendingUp className="h-3 w-3 inline mr-1" />
        <span>Top performing team</span>
      </div>
    )}
    {!isLoading && !isTopTeam && status && (
      <div className="text-xs text-muted-foreground mt-2">
        <TrendingUp className="h-3 w-3 inline mr-1" />
        <span>{status}</span>
      </div>
    )}
  </div>
);

interface DashboardStatsProps {
  isLoading: boolean;
  totalCreators: number;
  teamA: number;
  teamB: number;
  teamC: number;
  statsData: {
    totalGrowth: number | null;
    topTeam: string | null;
    teamAStatus: string | null;
    teamBStatus: string | null;
    teamCStatus: string | null;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  isLoading,
  totalCreators,
  teamA,
  teamB,
  teamC,
  statsData,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Creators"
        value={totalCreators}
        icon={<Users className="h-5 w-5" />}
        status={statsData.totalGrowth !== null ? `${statsData.totalGrowth > 0 ? `+${statsData.totalGrowth}%` : `${statsData.totalGrowth}%`} from last month` : undefined}
        isLoading={isLoading}
      />
      
      <StatCard
        title="A Team"
        value={teamA}
        icon={<Activity className="h-5 w-5" />}
        status={statsData.teamAStatus}
        isTopTeam={statsData.topTeam === "A Team"}
        isLoading={isLoading}
      />
      
      <StatCard
        title="B Team"
        value={teamB}
        icon={<PieChart className="h-5 w-5" />}
        status={statsData.teamBStatus}
        isTopTeam={statsData.topTeam === "B Team"}
        isLoading={isLoading}
      />
      
      <StatCard
        title="C Team"
        value={teamC}
        icon={<BarChart className="h-5 w-5" />}
        status={statsData.teamCStatus}
        isTopTeam={statsData.topTeam === "C Team"}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardStats;
