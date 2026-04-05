
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DashboardStats {
  totalCreators: number;
  teamA: number;
  teamB: number;
  teamC: number;
  maleCreators: number;
  femaleCreators: number;
  transCreators: number;
  aiCreators: number;
  statsData: {
    totalGrowth: number | null;
    topTeam: string | null;
    teamAStatus: string | null;
    teamBStatus: string | null;
    teamCStatus: string | null;
  };
}

// Initial empty state for dashboard stats
const initialDashboardStats: DashboardStats = {
  totalCreators: 0,
  teamA: 0,
  teamB: 0,
  teamC: 0,
  maleCreators: 0,
  femaleCreators: 0,
  transCreators: 0,
  aiCreators: 0,
  statsData: {
    totalGrowth: null,
    topTeam: null,
    teamAStatus: null,
    teamBStatus: null,
    teamCStatus: null
  }
};

export const useDashboardData = () => {
  const { toast } = useToast();

  // Define the fetch function outside of useQuery to make it reusable
  const fetchDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      const firstDayPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creators')
        .select('id, team, gender, creator_type, created_at')
        .eq('active', true);
        
      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
        throw new Error('Failed to fetch creators data');
      }
      
      const totalCreators = creatorsData.length;
      const teamA = creatorsData.filter(c => c.team === "A Team").length;
      const teamB = creatorsData.filter(c => c.team === "B Team").length;
      const teamC = creatorsData.filter(c => c.team === "C Team").length;
      const maleCreators = creatorsData.filter(c => c.gender === "Male").length;
      const femaleCreators = creatorsData.filter(c => c.gender === "Female").length;
      const transCreators = creatorsData.filter(c => c.gender === "Trans").length;
      const aiCreators = creatorsData.filter(c => c.creator_type === "AI").length;
      
      const thisMonthCreators = creatorsData.filter(c => 
        new Date(c.created_at) >= firstDayCurrentMonth
      ).length;
      
      const previousMonthCreators = creatorsData.filter(c =>
        new Date(c.created_at) >= firstDayPreviousMonth && 
        new Date(c.created_at) < firstDayCurrentMonth
      ).length;
      
      let totalGrowth = null;
      if (previousMonthCreators > 0) {
        totalGrowth = Math.round(((thisMonthCreators / previousMonthCreators) - 1) * 100);
      }
      
      const teamAStatus = teamA > 0 ? "Active team" : null;
      const teamBStatus = teamB > 0 ? "Growing steadily" : null;
      const teamCStatus = teamC > 0 ? "New additions" : null;
      
      let topTeam = null;
      if (teamA > teamB && teamA > teamC) {
        topTeam = "A Team";
      } else if (teamB > teamA && teamB > teamC) {
        topTeam = "B Team";
      } else if (teamC > teamA && teamC > teamB) {
        topTeam = "C Team";
      }
      
      return {
        totalCreators,
        teamA,
        teamB,
        teamC,
        maleCreators,
        femaleCreators,
        transCreators,
        aiCreators,
        statsData: {
          totalGrowth,
          topTeam,
          teamAStatus,
          teamBStatus,
          teamCStatus
        }
      };
    } catch (error) {
      console.error('Error in dashboard data fetch:', error);
      throw error;
    }
  }, []);

  // Use React Query for data fetching with caching
  const { 
    data: dashboardStats = initialDashboardStats, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Handle error with toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading dashboard",
        description: "Failed to retrieve dashboard statistics",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return { dashboardStats, isLoading, refetch };
};
