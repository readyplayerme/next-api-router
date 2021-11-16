import { NextApiRequest, NextApiResponse } from "next";
import {
  BadRequest,
  InternalServerError,
  HttpErrorConstructor,
} from "http-errors";
import Ajv, { AnySchema } from "ajv";
import addFormats from "ajv-formats";
import castArray from "lodash/castArray";
import cloneDeep from "lodash/cloneDeep";
import pickBy from "lodash/pickBy";

import type { NextApiRouterHandlerFnCtx } from "@readyplayerme/next-api-router";
import type {
  NextApiConfigurableHandlerConfig,
  NextApiRouterHandlerFn,
  ValidationSchema,
  EndpointSignature,
} from "./types";

const bodyValidator = new Ajv();
addFormats(bodyValidator);
bodyValidator.addKeyword("kind");
bodyValidator.addKeyword("modifier");
const queryValidator = new Ajv({ coerceTypes: true });
queryValidator.addKeyword("kind");
queryValidator.addKeyword("modifier");
addFormats(queryValidator);
const responseValidator = new Ajv({
  removeAdditional: true,
  coerceTypes: true,
});
addFormats(responseValidator);
responseValidator.addKeyword("kind");
responseValidator.addKeyword("modifier");

interface ValidatorOptions {
  data: unknown;
  validator: Ajv;
  schema?: AnySchema;
  name: "query" | "body" | "response";
  ErrorType?: HttpErrorConstructor;
}

export class NextApiConfigurableHandler {
  private middlewares: NextApiRouterHandlerFn[];

  private handler: NextApiRouterHandlerFn[];

  private schema?: ValidationSchema;

  private config?: NextApiConfigurableHandlerConfig;

  // TODO: add jsonschema validations for body, query and response
  constructor({
    middlewares,
    handler,
    schema,
    config,
  }: {
    middlewares: NextApiRouterHandlerFn[];
    handler: NextApiRouterHandlerFn | NextApiRouterHandlerFn[];
    schema?: ValidationSchema;
    config?: NextApiConfigurableHandlerConfig;
  }) {
    this.middlewares = middlewares;
    this.handler = castArray(handler);
    this.schema = schema;
    this.config = config;
  }

  async run(
    ctx: NextApiRouterHandlerFnCtx,
    request: NextApiRequest,
    response: NextApiResponse
  ): Promise<void> {
    const { send } = response;

    this.validateRequest(request);

    response.send = (value) =>
      send.call(response, this.validateResponse(response.statusCode, value));

    Object.assign(ctx, cloneDeep(this.config));

    const result = await pipeAsyncWithContext(
      ...this.middlewares,
      ...this.handler
    )(ctx, request, response);

    if (!response.headersSent) {
      response.json(result);
    }
  }

  private validateRequest(request: NextApiRequest): void {
    if (!this.schema) {
      return;
    }
    tryToValidate({
      data: request.query,
      validator: queryValidator,
      schema: this.schema?.query,
      name: "query",
    });
    tryToValidate({
      data: request.body,
      validator: bodyValidator,
      schema: this.schema?.body,
      name: "body",
    });
  }

  private validateResponse(status: number, response: unknown): unknown {
    const schema = this.schema?.response?.[status];
    if (!schema) {
      return response;
    }

    const data = cloneDeep(response);

    tryToValidate({
      data,
      validator: responseValidator,
      schema,
      name: "response",
      ErrorType: InternalServerError,
    });

    return data;
  }

  getSignature(): EndpointSignature {
    return {
      methodName: this.config?.methodName,
      query: this.schema?.query,
      body: this.schema?.body,
      response: pickBy(
        this.schema?.response,
        (_, key) => key.startsWith("2") && key.length === 3
      ),
    };
  }
}

function tryToValidate({
  data,
  validator,
  name,
  schema,
  ErrorType = BadRequest,
}: ValidatorOptions): void {
  if (!schema) {
    return;
  }

  const validate = validator.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new ErrorType(
      validate.errors
        ?.map(
          ({ message, instancePath }) => `'${name}${instancePath}' ${message}`
        )
        .join(", ")
    );
  }
}

function pipeAsyncWithContext(...fns: NextApiRouterHandlerFn[]) {
  return async (
    initCtx: Record<string, any> = {},
    request: NextApiRequest,
    response: NextApiResponse
  ) =>
    fns.reduce(async (prev, next) => {
      await prev;
      if (response.headersSent) {
        return Promise.resolve();
      }

      return next.call(initCtx, request, response);
    }, Promise.resolve());
}
