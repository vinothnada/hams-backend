export const successResponse = <T>(data: T, message = 'Success', statusCode = 200): object => ({
  success: true,
  message,
  data,
  statusCode,
});

export const paginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): object => ({
  success: true,
  data,
  pagination: { total, page, limit, pages: Math.ceil(total / limit) },
});
