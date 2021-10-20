import { NextApiRequest, NextApiResponse } from "next";
import createError, { BadRequest, HttpError } from "http-errors";

import { NextApiRouterHandlerFnCtx } from "@readyplayerme/next-api-router";
import { NextApiConfigurableHandler, NextApiRouterHandlerFn } from "../src";
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

    await configurableHandler.run({}, request, response);

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

    await configurableHandler.run({}, request, response);

    expect(handler).not.toHaveBeenCalled();
  });

  it("runs middlewares and handler with shared context", async () => {
    const user = { name: "John Doe" };
    function middleware(this: NextApiRouterHandlerFnCtx) {
      (this as any).user = user;
    }
    function handler(
      this: NextApiRouterHandlerFnCtx,
      request: NextApiRequest,
      response: NextApiResponse
    ) {
      response.json((this as any).user);
    }
    const configurableHandler = new NextApiConfigurableHandler({
      middlewares: [middleware],
      handler,
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();
    await configurableHandler.run({}, request, response);

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
    await configurableHandler.run({}, request, response);

    expect(response.json).toHaveBeenCalledWith(user);
  });

  it("fails with body validation error", async () => {
    const configurableHandler = new NextApiConfigurableHandler({
      schema: {
        body: {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
          required: ["foo"],
        },
      },
      middlewares: [],
      handler() {},
    });
    const request = {
      body: {},
    } as NextApiRequest;
    const response = mockResponse();

    await expect(
      configurableHandler.run({}, request, response)
    ).rejects.toEqual(
      new BadRequest("'body' must have required property 'foo'")
    );
  });

  it("fails with query validation error", async () => {
    const configurableHandler = new NextApiConfigurableHandler({
      schema: {
        query: {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
          required: ["foo"],
        },
      },
      middlewares: [],
      handler() {},
    });
    const request = {
      query: {},
    } as NextApiRequest;
    const response = mockResponse();

    await expect(
      configurableHandler.run({}, request, response)
    ).rejects.toEqual(
      new BadRequest("'query' must have required property 'foo'")
    );
  });

  it("fails with response validation error", async () => {
    const configurableHandler = new NextApiConfigurableHandler({
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              foo: { type: "string" },
            },
            required: ["foo"],
          },
        },
      },
      middlewares: [],
      handler() {
        return {};
      },
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();

    await expect(
      configurableHandler.run({}, request, response)
    ).rejects.toEqual(
      new BadRequest("'response' must have required property 'foo'")
    );
  });

  it("filters out and coerces types on response", async () => {
    const configurableHandler = new NextApiConfigurableHandler({
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              foo: { type: "string" },
            },
            required: ["foo"],
            additionalProperties: false,
          },
        },
      },
      middlewares: [],
      handler() {
        return {
          foo: 1,
          bar: "private property",
        };
      },
    });
    const request = {} as NextApiRequest;
    const response = mockResponse();

    await configurableHandler.run({}, request, response);

    expect((response as any).sendOriginal).toHaveBeenCalledWith({ foo: "1" });
  });
});
