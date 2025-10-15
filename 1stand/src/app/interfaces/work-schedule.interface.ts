export interface WorkSchedule {
  id?: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}
