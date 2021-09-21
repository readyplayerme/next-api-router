import EventEmitter from "events";
import type { NextApiHandler } from "next";
import assert from "http-assert";
import createError, { isHttpError } from "http-errors";

import { NextApiRouterRegistry } from "./NextApiRouterRegistry";
import {
  NextApiRouterHandler,
  NextApiRouterHandlerFn,
  NextApiRouterMethod,
} from "./types";

const { NODE_ENV } = process.env;

export class NextApiRouter {
  static create(): NextApiRouter {
    return new NextApiRouter();
  }

  private logger = console;

  private handlers = new NextApiRouterRegistry();

  private middlewares: NextApiRouterHandlerFn[] = [];

  events = new EventEmitter();

  setLogger(logger: Console): this {
    this.logger = logger;
    return this;
  }

  use(middleware: NextApiRouterHandlerFn): this {
    this.middlewares.push(middleware);
    return this;
  }

  post(handlerOrHandlerOptions: NextApiRouterHandler): this {
    return this.register("post", handlerOrHandlerOptions);
  }

  get(handlerOrHandlerOptions: NextApiRouterHandler): this {
    return this.register("get", handlerOrHandlerOptions);
  }

  put(handlerOrHandlerOptions: NextApiRouterHandler): this {
    return this.register("put", handlerOrHandlerOptions);
  }

  patch(handlerOrHandlerOptions: NextApiRouterHandler): this {
    return this.register("patch", handlerOrHandlerOptions);
  }

  delete(handlerOrHandlerOptions: NextApiRouterHandler): this {
    return this.register("delete", handlerOrHandlerOptions);
  }

  init(): NextApiHandler {
    return async (request, response) => {
      try {
        const handler = this.handlers.match(request.method);
        assert(handler, 404);

        return await handler.run(request, response);
      } catch (error) {
        if (this.events.listenerCount("error")) {
          this.events.emit("error", error);
        }

        this.logError(error as Error);

        if (isHttpError(error)) {
          return response.status(error.status).json({
            type: error.constructor.name,
            message: error.message,
            status: error.status,
          });
        }

        return response.status(500).json({
          status: 500,
          message: "internal server error occurred",
          type: "InternalServerError",
        });
      }
    };
  }

  private logError(error: Error): void {
    const loggerPayload = isHttpError(error)
      ? createError(error.statusCode, error.message)
      : error;
    this.logger.error(
      NODE_ENV === "development" ? loggerPayload : JSON.stringify(loggerPayload)
    );
  }

  private register(
    method: NextApiRouterMethod,
    handlerOrHandlerOptions: NextApiRouterHandler
  ): this {
    this.handlers.register({
      method,
      middlewares: [...this.middlewares],
      handler: handlerOrHandlerOptions,
    });

    return this;
  }
}
