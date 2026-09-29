export interface ApiResponse<TData = unknown> {
  next: any;
  results: any;
  message?: string;
  data: TData;
}
