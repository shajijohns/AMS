export interface WorldMapLocation {
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  count: number;
  statuses: Record<string, number>;
}

export const STATUS_COLORS: Record<string, string> = {
  'Pending': '#ff9800', // Orange
  'Submitted': '#ff9800', // Orange
  'UnderReview': '#2196f3', // Blue
  'MoreInfoRequested': '#9c27b0', // Purple
  'Approved': '#4caf50', // Green
  'Rejected': '#f44336', // Red
  'Draft': '#9e9e9e' // Grey
};
