import { NextApiHandler } from "next";

import {
  NextApiRouterHandlersRegistrationOptions,
  NextApiRouterRegistry,
} from "../src";

afterEach(() => jest.resetAllMocks());

describe("NextApiRouterRegistry", () => {
  it("registers and matches a handler", () => {
    const registry = new NextApiRouterRegistry();
    const handler = () => {};
    const middlewares: NextApiHandler[] = [];
    const handlerOptions: NextApiRouterHandlersRegistrationOptions = {
      method: "post",
      middlewares,
      handler,
    };

    expect(registry.register(handlerOptions)).toBeInstanceOf(
      NextApiRouterRegistry
    );
    expect(registry.match("post")).toMatchObject({
      middlewares,
      handler: [handler],
    });
  });

  it("resolves with undefined if method not provided", () => {
    const registry = new NextApiRouterRegistry();
    expect(registry.match()).toBeUndefined();
  });
});
