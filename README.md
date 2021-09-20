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
* `#init()' - initializer returning a Nextjs API handler which should exported by default from a Nextjs route endpoint file
* `#events' - event emitter

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

router.events.on("error", (error) => /* process error */)

export default router.init()
```
