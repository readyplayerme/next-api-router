import { NextApiRequest, NextApiResponse } from "next";
import createError, { HttpError } from "http-errors";

import {
  NextApiConfigurableHandler,
  NextApiRouterHandlerFn,
  NextApiRouterHandlerFnCtx,
} from "../src";
import { mockResponse } from "./mocks";

describe("NextApiConfigurableHandler", () => {
  it("runs middlewares and handler", async () => {
    const middleware = jest.fn() as NextApiRouterHandlerFn;
    const handler = jest.fn() as NextApiRouterHandlerFn;
    const configurableHandler = new NextApiConfigurableHandler({
      middlewares: [middleware],
      handler,
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();

    await configurableHandler.run(request, response);

    expect(middleware).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it("stops pipeline if response is sent", async () => {
    function middleware(request: NextApiRequest, response: NextApiResponse) {
      response.json({ foo: "bar" });
    }
    const handler = jest.fn() as NextApiRouterHandlerFn;
    const configurableHandler = new NextApiConfigurableHandler({
      middlewares: [middleware],
      handler,
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();

    await configurableHandler.run(request, response);

    expect(handler).not.toHaveBeenCalled();
  });

  it("runs middlewares and handler with shared context", async () => {
    const user = { name: "John Doe" };
    function middleware(this: NextApiRouterHandlerFnCtx) {
      this.user = user;
    }
    function handler(
      this: NextApiRouterHandlerFnCtx,
      request: NextApiRequest,
      response: NextApiResponse
    ) {
      response.json(this.user);
    }
    const configurableHandler = new NextApiConfigurableHandler({
      middlewares: [middleware],
      handler,
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();
    await configurableHandler.run(request, response);

    expect(response.json).toHaveBeenCalledWith(user);
  });

  it("responds with handler return value", async () => {
    const user = { name: "John Doe" };
    function handler(this: NextApiRouterHandlerFnCtx) {
      return user;
    }
    const configurableHandler = new NextApiConfigurableHandler({
      middlewares: [],
      handler,
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();
    await configurableHandler.run(request, response);

    expect(response.json).toHaveBeenCalledWith(user);
  });

  it("extends error with context, request and response", async () => {
    const user = { name: "John Doe" };
    function handler(this: NextApiRouterHandlerFnCtx) {
      this.user = user;
      throw createError(404);
    }
    const configurableHandler = new NextApiConfigurableHandler({
      middlewares: [],
      handler,
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();

    try {
      await configurableHandler.run(request, response);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);

      if (error instanceof HttpError) {
        expect(error.request).toBe(request);
        expect(error.response).toBe(response);
        expect(error.ctx).toMatchObject({ user });
      }
    }
  });
});
