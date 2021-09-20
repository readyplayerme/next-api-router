import EventEmitter from "events";
import { NextApiRequest } from "next";
import { NotFound } from "http-errors";

import {
  NextApiRouter,
  NextApiRouterRegistry,
  NextApiRouterMethod,
  NextApiConfigurableHandler,
} from "../src";
import { mockResponse } from "./mocks";

afterEach(() => jest.resetAllMocks());

describe("NextApiRouter", () => {
  describe("NextApiRouter.create", () => {
    it("creates an instance of NextApiRouter", () => {
      expect(NextApiRouter.create()).toBeInstanceOf(NextApiRouter);
    });
  });

  describe("NextApiRouter.prototype.use", () => {
    it("registers a middleware and resolves with itself", () => {
      const router = NextApiRouter.create();
      expect(router.use(() => {})).toBe(router);
    });
  });

  const methods: NextApiRouterMethod[] = [
    "post",
    "get",
    "put",
    "patch",
    "delete",
  ];
  methods.forEach((method) => {
    describe(`NextApiRouter.prototype.${method}`, () => {
      it(`registers a ${method} handler with root path`, () => {
        const router = NextApiRouter.create();
        const register = jest.spyOn(
          NextApiRouterRegistry.prototype,
          "register"
        );
        const handler = () => {};

        expect(router[method](handler)).toBe(router);
        expect(register).toHaveBeenCalledWith({
          method,
          middlewares: [],
          handler,
        });
      });

      it(`registers a ${method} handler with custom path and middlewares`, () => {
        const router = NextApiRouter.create();
        const register = jest.spyOn(
          NextApiRouterRegistry.prototype,
          "register"
        );
        const middleware = () => {};
        const handler = () => {};
        router.use(middleware)[method](handler);

        expect(register).toHaveBeenCalledWith({
          method,
          middlewares: [middleware],
          handler,
        });
      });
    });
  });

  describe("NextApiRouter.prototype.init", () => {
    it("runs a relevant handler", async () => {
      const request = { method: "POST" } as NextApiRequest;
      const response = mockResponse();
      const handler = new NextApiConfigurableHandler({
        middlewares: [],
        handler() {},
      });
      jest
        .spyOn(NextApiRouterRegistry.prototype, "match")
        .mockReturnValue(handler);
      const run = jest.spyOn(handler, "run").mockResolvedValue(undefined);
      await NextApiRouter.create().init()(request, response);

      expect(run).toHaveBeenCalledWith(request, response);
    });

    it("responds with 404 if handler is not found", async () => {
      const request = { method: "POST" } as NextApiRequest;
      const response = mockResponse();
      const logger = { error: jest.fn() } as unknown as Console;
      await NextApiRouter.create().setLogger(logger).init()(request, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(logger.error).toHaveBeenCalledWith(new NotFound());
      expect(response.json).toHaveBeenCalledWith({
        type: "NotFoundError",
        message: "Not Found",
        status: 404,
      });
    });

    it("responds with 500 on unhandled error", async () => {
      const request = { method: "POST" } as NextApiRequest;
      const response = mockResponse();
      const handler = new NextApiConfigurableHandler({
        middlewares: [],
        handler() {},
      });
      jest
        .spyOn(NextApiRouterRegistry.prototype, "match")
        .mockReturnValue(handler);
      const error = new Error("unhandled");
      jest.spyOn(handler, "run").mockRejectedValue(error);
      const logger = { error: jest.fn() } as unknown as Console;
      await NextApiRouter.create().setLogger(logger).init()(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith(error);
      expect(response.json).toHaveBeenCalledWith({
        type: "InternalServerError",
        message: "internal server error occurred",
        status: 500,
      });
    });

    it("emits an error", async () => {
      const request = { method: "POST" } as NextApiRequest;
      const response = mockResponse();
      const handler = new NextApiConfigurableHandler({
        middlewares: [],
        handler() {},
      });
      jest
        .spyOn(NextApiRouterRegistry.prototype, "match")
        .mockReturnValue(handler);
      const error = new Error("unhandled");
      jest.spyOn(handler, "run").mockRejectedValue(error);
      jest.spyOn(EventEmitter.prototype, "emit").mockReturnValue(true);
      jest.spyOn(EventEmitter.prototype, "listenerCount").mockReturnValue(1);
      const logger = { error: jest.fn() } as unknown as Console;
      await NextApiRouter.create().setLogger(logger).init()(request, response);

      expect(EventEmitter.prototype.emit).toHaveBeenCalledWith("error", error);
    });
  });
});
