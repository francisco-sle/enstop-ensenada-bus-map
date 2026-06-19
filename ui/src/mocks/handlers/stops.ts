import { http, HttpResponse } from 'msw'
import stopsData from '../data/stops.json'

export const stopsHandlers = [
  // Handle stops request
  http.get('*/rest/v1/stops', () => {
    return HttpResponse.json(stopsData)
  }),
]
