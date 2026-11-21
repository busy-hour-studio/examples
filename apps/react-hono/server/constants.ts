/** Error codes this server returns (API errors pass through with the API's
 *  own code). */
export const AppErrorCode = {
  UNAUTHORIZED: "unauthorized",
  INVALID_REQUEST: "invalid_request",
  NOT_FOUND: "not_found",
  INTERNAL: "internal_error",
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];
