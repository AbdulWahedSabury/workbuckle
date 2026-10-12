export interface ApiResponse<TData = unknown> {
  message?: string;
  data: TData;
}
