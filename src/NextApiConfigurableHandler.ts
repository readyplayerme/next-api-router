import { NextApiRequest, NextApiResponse } from "next";
import createError, { HttpError } from "http-errors";
import castArray from "lodash/castArray";

import type {
  NextApiRouterHandlerFn,
  NextApiRouterHandlerFnCtx,
} from "./types";

export class NextApiConfigurableHandler {
  private middlewares: NextApiRouterHandlerFn[];

  private handler: NextApiRouterHandlerFn[];

  // TODO: add jsonschema validations for body, query and response
  constructor({
    middlewares,
    handler,
  }: {
    middlewares: NextApiRouterHandlerFn[];
    handler: NextApiRouterHandlerFn | NextApiRouterHandlerFn[];
  }) {
    this.middlewares = middlewares;
    this.handler = castArray(handler);
  }

  async run(request: NextApiRequest, response: NextApiResponse): Promise<void> {
    const result = await pipeAsyncWithContext(
      ...this.middlewares,
      ...this.handler
    )(request, response);

    if (!response.finished) {
      response.json(result);
    }
  }
}

const pipeAsyncWithContext =
  (...fns: NextApiRouterHandlerFn[]) =>
  async (request: NextApiRequest, response: NextApiResponse) => {
    const context: NextApiRouterHandlerFnCtx = {};

    try {
      return await fns.reduce(async (prev, next) => {
        await prev;
        if (response.finished) {
          return Promise.resolve();
        }

        return next.call(context, request, response);
      }, Promise.resolve());
    } catch (error) {
      const extendedError =
        error instanceof HttpError
          ? error
          : createError(500, (error as Error).message);
      extendedError.ctx = context;
      extendedError.request = request;
      extendedError.response = response;

      throw extendedError;
    }
  };
