import type { NextFunction, Request, Response } from "express";

// if we put ( _ ) in the arguments, we are telling typescript that we are not going to use that argument
// and we add that argument intentionally
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Error", err.stack);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// if status code is 200 and we still hit the error handler, that means its and internal server error
// so we set the status code to 500
