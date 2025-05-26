import mitt from "mitt"

type EventBus = {
  networkError: [cause: string]
  networkError_unauth: void
  routerError: void
}
export default mitt<EventBus>()
