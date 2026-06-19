import { routesHandlers } from './routes'
import { stopsHandlers } from './stops'
import { rpcHandlers } from './rpc'

export const handlers = [...routesHandlers, ...stopsHandlers, ...rpcHandlers]
