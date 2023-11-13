export const W3mFrameConstants = {
  SECURE_SITE: 'http://localhost:3010',
  APP_EVENT_KEY: '@w3m-app/',
  FRAME_EVENT_KEY: '@w3m-frame/',
  RPC_METHOD_KEY: 'RPC_',

  APP_SWITCH_NETWORK: '@w3m-app/SWITCH_NETWORK',
  APP_CONNECT_EMAIL: '@w3m-app/CONNECT_EMAIL',
  APP_CONNECT_DEVICE: '@w3m-app/CONNECT_DEVICE',
  APP_CONNECT_OTP: '@w3m-app/CONNECT_OTP',
  APP_GET_USER: '@w3m-app/GET_USER',
  APP_SIGN_OUT: '@w3m-app/SIGN_OUT',
  APP_IS_CONNECTED: '@w3m-app/IS_CONNECTED',
  APP_GET_CHAIN_ID: '@w3m-app/GET_CHAIN_ID',
  APP_RPC_PERSONAL_SIGN: '@w3m-app/RPC_PERSONAL_SIGN',
  APP_RPC_ETH_SEND_TRANSACTION: '@w3m-app/RPC_ETH_SEND_TRANSACTION',
  APP_RPC_ETH_ACCOUNTS: '@w3m-app/RPC_ETH_ACCOUNTS',
  APP_RPC_ETH_GET_BALANCE: '@w3m-app/RPC_ETH_GET_BALANCE',
  APP_RPC_ETH_ESTIMATE_GAS: '@w3m-app/RPC_ETH_ESTIMATE_GAS',
  APP_RPC_ETH_GAS_PRICE: '@w3m-app/RPC_ETH_GAS_PRICE',
  APP_RPC_ETH_ETH_SIGN_TYPED_DATA_V4: '@w3m-app/RPC_ETH_ETH_SIGN_TYPED_DATA_V4',

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
  FRAME_RPC_REQUEST_ERROR: '@w3m-frame/RPC_REQUEST_ERROR'
} as const
