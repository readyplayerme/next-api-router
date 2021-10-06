import { NextApiRequest, NextApiResponse } from "next";
import { AnySchema } from "ajv";

import { NextApiRouterHandlerFnCtx } from "@readyplayerme/next-api-router";
import type { NextApiConfigurableHandler } from "./NextApiConfigurableHandler";

export type NextApiRouterMethod = "post" | "get" | "put" | "patch" | "delete";

export declare type NextApiRouterHandlerFn<T = any> = (
  this: NextApiRouterHandlerFnCtx,
  req: NextApiRequest,
  res: NextApiResponse<T>
) => T | Promise<T>;

export interface ValidationSchema {
  query?: AnySchema;
  body?: AnySchema;
  response?: {
    [key: number]: AnySchema;
  };
}

export interface NextApiConfigurableHandlerOptions {
  schema?: ValidationSchema;
  middlewares?: NextApiRouterHandlerFn[];
  handler: NextApiRouterHandlerFn | NextApiRouterHandlerFn[];
}

export type NextApiRouterHandler =
  | NextApiConfigurableHandlerOptions
  | NextApiRouterHandlerFn;

export type NextApiRouterHandlersRegistry = {
  [key in NextApiRouterMethod]?: NextApiConfigurableHandler;
};

export interface NextApiRouterHandlersRegistrationOptions {
  method: NextApiRouterMethod;
  middlewares: NextApiRouterHandlerFn[];
  handler: NextApiRouterHandler;
}
