type ApiResponse<T> = {
  status: string;
  code: number;
  messages: string[];
  result: T;
};

export default ApiResponse;
