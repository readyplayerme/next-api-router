# Next.js API router

Simple utility allowing to route API endpoints by http methods with middleware functionality.

## API

### NextApiRouter
* `#create()` - creates a NextApiRouter instance
### NextApiRouter.prototype
* `#setLogger(logger: Console): this` - sets a logger to be used by router. Default: `console`
* `#use(middleware): this` - adds a middleware to execution pipeline. Middleware is a function receiving arguments as follows:
  * `request: NextApiRequest` 
  * `response: NextApiResponse`
* `#post(handler)`/`#get(handler)`/`#put(handler)`/`#patch(handler)`/`#delete(handler)` - adds a handler to requests with respective method. Handlers return value is sent as a response with status 200 unless response is already sent explicitly using Nextjs API. Handler is a function receiving arguments as follows:
    * `request: NextApiRequest`
    * `response: NextApiResponse` 
* `#init()` - initializer returning a Nextjs API handler which should exported by default from a Nextjs route endpoint file
* `#events` - event emitter

### Handler
Route handler can be added as a function or a configuration object:

```typescript
export declare type NextApiRouterHandlerFn<T = any> = (
  this: NextApiRouterHandlerFnCtx,
  req: NextApiRequest,
  res: NextApiResponse<T>
) => T | Promise<T>;
```

or

```typescript
export interface NextApiConfigurableHandlerOptions {
  schema?: ValidationSchema;
  middlewares?: NextApiRouterHandlerFn[];
  handler: NextApiRouterHandlerFn | NextApiRouterHandlerFn[];
}
```

Schema is jsonschema validating request/response payloads. Validation is omitted if schema is not provided. It is responding with `400` if request payload is not valid and `500` for response.
```typescript
export interface ValidationSchema {
  query?: AnySchema;
  body?: AnySchema;
  response?: {
    [key: number]: AnySchema;
  };
}
```
It is possible to separately validate `query`, `body` and response payload by response code. E.g. the schema as follows is only validating response payloads with status `200`. This schema is filtering out fields that are not specified and tries to cast types.
```typescript
const schema = {
  response: {
    200: schema
  }
}
```

jsonschema is implemented using [ajv](https://ajv.js.org/) with [ajv-formats](https://www.npmjs.com/package/ajv-formats) included.

## Usage notes
* it is possible to add multiple middlewares which would be executed in order of addition
* handler is executed after a middleware
* middleware added before handler is ignored
* pipeline execution stops if middleware ends a request
* it is possible to subscribe to error events (e.g. for reporting/logging purposes)

## Example

```javascript
const router = NextApiRouter.create() // or new NextApiRouter()
    .use(function (request: NextApiRequest, response: NextApiResponse) { // Add a middleware
      this.user = { id: 1, name: 'John Doe'} // middlewares and handlers share common context
    })
    .post(function (request: NextApiRequest, response: NextApiResponse) {
      return this.user // respond with some payload
    })
    // this middleware is only added to a subsequent handerlr.
    // E.g. it is called before get handler below but not the post one above
    .use(middleware)
    .get(handler)

router.events.on("error", (error) => /* process error */)

export default router.init()
```

## Roadmap

* add endpoint generic typing for request
