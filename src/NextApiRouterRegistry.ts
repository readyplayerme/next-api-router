import merge from "lodash/merge";

import { NextApiConfigurableHandler } from "./NextApiConfigurableHandler";
import type {
  NextApiRouterHandlersRegistry,
  NextApiRouterHandlersRegistrationOptions,
  NextApiRouterMethod,
  EndpointSignature,
} from "./types";

export class NextApiRouterRegistry {
  private registry: NextApiRouterHandlersRegistry = {};

  register({
    method,
    middlewares,
    handler,
  }: NextApiRouterHandlersRegistrationOptions): this {
    const config: NextApiRouterHandlersRegistry = {
      [method]: new NextApiConfigurableHandler({
        ...(typeof handler === "object" ? handler : { handler }),
        middlewares,
      }),
    };

    merge(this.registry, config);

    return this;
  }

  match(method?: string): NextApiConfigurableHandler | void {
    if (!method) {
      return undefined;
    }

    return this.registry[method.toLowerCase() as NextApiRouterMethod];
  }

  getSignatures(): EndpointSignature[] {
    return Object.keys(this.registry).map((method) => ({
      method,
      ...this.registry[method as NextApiRouterMethod]?.getSignature(),
    }));
  }
}
