import { proxy, subscribe as sub } from 'valtio/vanilla'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { FetchUtil } from '../utils/FetchUtil.js'
import type { Event } from '../utils/TypeUtil.js'
import { OptionsController } from './OptionsController.js'

// -- Helpers ------------------------------------------- //
const baseUrl = CoreHelperUtil.getAnalyticsUrl()
const api = new FetchUtil({ baseUrl, clientId: null })
const excluded = ['MODAL_CREATED']

// -- Types --------------------------------------------- //
export interface EventsControllerState {
  timestamp: number
  data: Event
}

// -- State --------------------------------------------- //
const state = proxy<EventsControllerState>({
  timestamp: Date.now(),
  data: {
    type: 'track',
    event: 'MODAL_CREATED'
  }
})

// -- Controller ---------------------------------------- //
export const EventsController = {
  state,

  subscribe(callback: (newState: EventsControllerState) => void) {
    return sub(state, () => callback(state))
  },

  _getApiHeaders() {
    const { projectId, sdkType, sdkVersion } = OptionsController.state

    return {
      'x-project-id': projectId,
      'x-sdk-type': sdkType || 'w3m',
      'x-sdk-version': sdkVersion || 'html-wagmi-4.2.2'
    }
  },

  async _sendAnalyticsEvent(payload: EventsControllerState) {
    try {
      if (excluded.includes(payload.data.event) || typeof window === 'undefined') {
        return
      }
      await api.post({
        path: '/e',
        headers: EventsController._getApiHeaders(),
        body: {
          eventId: CoreHelperUtil.getUUID(),
          url: window.location.href,
          domain: window.location.hostname,
          timestamp: payload.timestamp,
          props: payload.data
        }
      })
    } catch {
      // Catch silently
    }
  },

  sendEvent(data: EventsControllerState['data']) {
    state.timestamp = Date.now()
    state.data = data
    if (OptionsController.state.enableAnalytics) {
      EventsController._sendAnalyticsEvent(state)
    }
  }
}
