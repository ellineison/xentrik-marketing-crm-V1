export interface Schedule {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  color: string;
}
