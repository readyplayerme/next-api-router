import { NextApiRequest, NextApiResponse } from "next";
import createError, {
  HttpError,
  BadRequest,
  InternalServerError,
  HttpErrorConstructor,
} from "http-errors";
import Ajv, { AnySchema } from "ajv";
import addFormats from "ajv-formats";
import castArray from "lodash/castArray";
import cloneDeep from "lodash/cloneDeep";

import { NextApiRouterHandlerFnCtx } from "@readyplayerme/next-api-router";
import type { NextApiRouterHandlerFn, ValidationSchema } from "./types";

const bodyValidator = new Ajv();
addFormats(bodyValidator);
const queryValidator = new Ajv({ coerceTypes: true });
addFormats(queryValidator);
const responseValidator = new Ajv({
  removeAdditional: true,
  coerceTypes: true,
});
addFormats(responseValidator);

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

  // TODO: add jsonschema validations for body, query and response
  constructor({
    middlewares,
    handler,
    schema,
  }: {
    middlewares: NextApiRouterHandlerFn[];
    handler: NextApiRouterHandlerFn | NextApiRouterHandlerFn[];
    schema?: ValidationSchema;
  }) {
    this.middlewares = middlewares;
    this.handler = castArray(handler);
    this.schema = schema;
  }

  async run(request: NextApiRequest, response: NextApiResponse): Promise<void> {
    const { send } = response;

    this.validateRequest(request);

    response.send = (value) =>
      send.call(response, this.validateResponse(response.statusCode, value));

    const result = await pipeAsyncWithContext(
      ...this.middlewares,
      ...this.handler
    )(request, response);

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
  return async (request: NextApiRequest, response: NextApiResponse) => {
    const context: NextApiRouterHandlerFnCtx = {};

    try {
      return await fns.reduce(async (prev, next) => {
        await prev;
        if (response.headersSent) {
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
}
