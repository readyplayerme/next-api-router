import EventEmitter from "events";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import assert from "http-assert";
import { isHttpError } from "http-errors";

import type { NextApiRouterHandlerFnCtx } from "@readyplayerme/next-api-router";
import { NextApiRouterRegistry } from "./NextApiRouterRegistry";
import type {
  EndpointSignature,
  NextApiRouterHandler,
  NextApiRouterHandlerFn,
  NextApiRouterMethod,
} from "./types";

interface NextApiHandlerWithSignatures extends NextApiHandler {
  getSignatures(): any;
}

export class NextApiRouter {
  static create(): NextApiRouter {
    return new NextApiRouter();
  }

  private handlers = new NextApiRouterRegistry();

  private middlewares: NextApiRouterHandlerFn[] = [];

  events = new EventEmitter();

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

  init(): NextApiHandlerWithSignatures {
    const handler = (request: NextApiRequest, response: NextApiResponse) =>
      this.run(request, response);
    handler.getSignatures = this.getSignatures.bind(this);

    return handler;
  }

  async run(request: NextApiRequest, response: NextApiResponse) {
    const context: NextApiRouterHandlerFnCtx = {};

    try {
      const handler = this.handlers.match(request.method);
      assert(handler, 404);

      return await handler.run(context, request, response);
    } catch (error) {
      if (this.events.listenerCount("error")) {
        this.events.emit("error", error, context, request, response);
      }

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

  getSignatures(): EndpointSignature[] {
    return this.handlers.getSignatures();
  }
}
