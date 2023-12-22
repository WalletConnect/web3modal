export const W3mFrameConstants = {
  SECURE_SITE_SDK: 'http://localhost:3010/sdk',
  APP_EVENT_KEY: '@w3m-app/',
  FRAME_EVENT_KEY: '@w3m-frame/',
  RPC_METHOD_KEY: 'RPC_',
  STORAGE_KEY: '@w3m-storage/',

  SESSION_TOKEN_KEY: 'SESSION_TOKEN_KEY',
  EMAIL_LOGIN_USED_KEY: 'EMAIL_LOGIN_USED_KEY',
  LAST_EMAIL_LOGIN_TIME: 'LAST_EMAIL_LOGIN_TIME',
  EMAIL: 'EMAIL',

  APP_SWITCH_NETWORK: '@w3m-app/SWITCH_NETWORK',
  APP_CONNECT_EMAIL: '@w3m-app/CONNECT_EMAIL',
  APP_CONNECT_DEVICE: '@w3m-app/CONNECT_DEVICE',
  APP_CONNECT_OTP: '@w3m-app/CONNECT_OTP',
  APP_GET_USER: '@w3m-app/GET_USER',
  APP_SIGN_OUT: '@w3m-app/SIGN_OUT',
  APP_IS_CONNECTED: '@w3m-app/IS_CONNECTED',
  APP_GET_CHAIN_ID: '@w3m-app/GET_CHAIN_ID',
  APP_RPC_REQUEST: '@w3m-app/RPC_REQUEST',
  APP_UPDATE_EMAIL: '@w3m-app/UPDATE_EMAIL',
  APP_AWAIT_UPDATE_EMAIL: '@w3m-app/AWAIT_UPDATE_EMAIL',

  FRAME_SWITCH_NETWORK_ERROR: '@w3m-frame/SWITCH_NETWORK_ERROR',
  FRAME_SWITCH_NETWORK_SUCCESS: '@w3m-frame/SWITCH_NETWORK_SUCCESS',
  FRAME_CONNECT_EMAIL_ERROR: '@w3m-frame/CONNECT_EMAIL_ERROR',
  FRAME_CONNECT_EMAIL_SUCCESS: '@w3m-frame/CONNECT_EMAIL_SUCCESS',
  FRAME_CONNECT_DEVICE_ERROR: '@w3m-frame/CONNECT_DEVICE_ERROR',
  FRAME_CONNECT_DEVICE_SUCCESS: '@w3m-frame/CONNECT_DEVICE_SUCCESS',
  FRAME_CONNECT_OTP_SUCCESS: '@w3m-frame/CONNECT_OTP_SUCCESS',
  FRAME_CONNECT_OTP_ERROR: '@w3m-frame/CONNECT_OTP_ERROR',
  FRAME_GET_USER_SUCCESS: '@w3m-frame/GET_USER_SUCCESS',
  FRAME_GET_USER_ERROR: '@w3m-frame/GET_USER_ERROR',
  FRAME_SIGN_OUT_SUCCESS: '@w3m-frame/SIGN_OUT_SUCCESS',
  FRAME_SIGN_OUT_ERROR: '@w3m-frame/SIGN_OUT_ERROR',
  FRAME_IS_CONNECTED_SUCCESS: '@w3m-frame/IS_CONNECTED_SUCCESS',
  FRAME_IS_CONNECTED_ERROR: '@w3m-frame/IS_CONNECTED_ERROR',
  FRAME_GET_CHAIN_ID_SUCCESS: '@w3m-frame/GET_CHAIN_ID_SUCCESS',
  FRAME_GET_CHAIN_ID_ERROR: '@w3m-frame/GET_CHAIN_ID_ERROR',
  FRAME_RPC_REQUEST_SUCCESS: '@w3m-frame/RPC_REQUEST_SUCCESS',
  FRAME_RPC_REQUEST_ERROR: '@w3m-frame/RPC_REQUEST_ERROR',
  FRAME_SESSION_UPDATE: '@w3m-frame/SESSION_UPDATE',
  FRAME_UPDATE_EMAIL_SUCCESS: '@w3m-frame/UPDATE_EMAIL_SUCCESS',
  FRAME_UPDATE_EMAIL_ERROR: '@w3m-frame/UPDATE_EMAIL_ERROR',
  FRAME_AWAIT_UPDATE_EMAIL_SUCCESS: '@w3m-frame/AWAIT_UPDATE_EMAIL_SUCCESS',
  FRAME_AWAIT_UPDATE_EMAIL_ERROR: '@w3m-frame/AWAIT_UPDATE_EMAIL_ERROR'
} as const
