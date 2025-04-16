
import React from "react";
import { Activity } from "lucide-react";
import RecentActivities from "./RecentActivities";
import { Activity as ActivityType } from "@/types/activity";

interface DashboardActivitiesProps {
  activities: ActivityType[];
}

const DashboardActivities: React.FC<DashboardActivitiesProps> = ({ activities }) => {
  return (
    <div className="premium-card hover:border-brand-yellow/50">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center">
        <Activity className="h-5 w-5 mr-2 text-brand-yellow" />
        Recent Activities
      </h2>
      <RecentActivities activities={activities} />
    </div>
  );
};

export default DashboardActivities;
