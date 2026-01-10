
import React from "react";
import { useActivities } from "../context/ActivityContext";
import DashboardStats from "../components/dashboard/DashboardStats";
import CreatorDistribution from "../components/dashboard/CreatorDistribution";
import DashboardActivities from "../components/dashboard/DashboardActivities";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { getRecentActivities } = useActivities();
  const { dashboardStats, isLoading } = useDashboardData();
  const recentActivities = getRecentActivities(3);

  const { 
    totalCreators, 
    teamA, 
    teamB, 
    teamC, 
    maleCreators, 
    femaleCreators,
    transCreators,
    aiCreators,
    statsData 
  } = dashboardStats;

  return (
    <div className="p-8 w-full bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your creator management system</p>
      </div>

      <DashboardStats 
        isLoading={isLoading}
        totalCreators={totalCreators}
        teamA={teamA}
        teamB={teamB}
        teamC={teamC}
        statsData={statsData}
      />

      <CreatorDistribution
        isLoading={isLoading}
        maleCreators={maleCreators}
        femaleCreators={femaleCreators}
        transCreators={transCreators}
        aiCreators={aiCreators}
      />

      <DashboardActivities activities={recentActivities} />
    </div>
  );
};

export default Dashboard;
