import { z } from 'zod'
import { W3mFrameConstants, W3mFrameRpcConstants } from './W3mFrameConstants.js'

// -- Helpers ----------------------------------------------------------------
const zError = z.object({ message: z.string() })

function zType<K extends keyof typeof W3mFrameConstants>(key: K) {
  return z.literal(W3mFrameConstants[key])
}

// -- Responses --------------------------------------------------------------
export const GetTransactionByHashResponse = z.object({
  accessList: z.array(z.string()),
  blockHash: z.string().nullable(),
  blockNumber: z.string().nullable(),
  chainId: z.string(),
  from: z.string(),
  gas: z.string(),
  hash: z.string(),
  input: z.string().nullable(),
  maxFeePerGas: z.string(),
  maxPriorityFeePerGas: z.string(),
  nonce: z.string(),
  r: z.string(),
  s: z.string(),
  to: z.string(),
  transactionIndex: z.string().nullable(),
  type: z.string(),
  v: z.string(),
  value: z.string()
})
export const AppSwitchNetworkRequest = z.object({ chainId: z.number() })
export const AppConnectEmailRequest = z.object({ email: z.string().email() })
export const AppConnectOtpRequest = z.object({ otp: z.string() })
export const AppConnectSocialRequest = z.object({ uri: z.string() })
export const AppGetUserRequest = z.object({
  chainId: z.optional(z.number()),
  preferredAccountType: z.optional(z.string())
})
export const AppGetSocialRedirectUriRequest = z.object({
  provider: z.enum(['google', 'github', 'apple', 'facebook', 'x', 'discord'])
})
export const AppUpdateEmailRequest = z.object({ email: z.string().email() })
export const AppUpdateEmailPrimaryOtpRequest = z.object({ otp: z.string() })
export const AppUpdateEmailSecondaryOtpRequest = z.object({ otp: z.string() })
export const AppSyncThemeRequest = z.object({
  themeMode: z.optional(z.enum(['light', 'dark'])),
  themeVariables: z.optional(z.record(z.string(), z.string().or(z.number()))),
  w3mThemeVariables: z.optional(z.record(z.string(), z.string()))
})
export const AppSyncDappDataRequest = z.object({
  metadata: z
    .object({
      name: z.string(),
      description: z.string(),
      url: z.string(),
      icons: z.array(z.string())
    })
    .optional(),
  sdkVersion: z.string() as z.ZodType<
    | `${'html' | 'react' | 'vue'}-wagmi-${string}`
    | `${'html' | 'react' | 'vue'}-ethers5-${string}`
    | `${'html' | 'react' | 'vue'}-ethers-${string}`
    | `${'html' | 'react' | 'vue'}-solana-${string}`
  >,
  projectId: z.string()
})
export const AppSetPreferredAccountRequest = z.object({ type: z.string() })

export const FrameConnectEmailResponse = z.object({
  action: z.enum(['VERIFY_DEVICE', 'VERIFY_OTP'])
})
export const FrameConnectSocialResponse = z.object({
  email: z.string(),
  address: z.string(),
  chainId: z.number(),
  accounts: z.array(
    z.object({
      address: z.string(),
      type: z.enum([
        W3mFrameRpcConstants.ACCOUNT_TYPES.EOA,
        W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      ])
    })
  ),
  userName: z.string().optional()
})
export const FrameUpdateEmailResponse = z.object({
  action: z.enum(['VERIFY_PRIMARY_OTP', 'VERIFY_SECONDARY_OTP'])
})
export const FrameGetUserResponse = z.object({
  email: z.string().email(),
  address: z.string(),
  chainId: z.number(),
  smartAccountDeployed: z.optional(z.boolean()),
  accounts: z.array(
    z.object({
      address: z.string(),
      type: z.enum([
        W3mFrameRpcConstants.ACCOUNT_TYPES.EOA,
        W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      ])
    })
  ),
  preferredAccountType: z.optional(z.string())
})
export const FrameGetSocialRedirectUriResponse = z.object({ uri: z.string() })
export const FrameIsConnectedResponse = z.object({ isConnected: z.boolean() })
export const FrameGetChainIdResponse = z.object({ chainId: z.number() })
export const FrameSwitchNetworkResponse = z.object({ chainId: z.number() })
export const FrameUpdateEmailSecondaryOtpResolver = z.object({ newEmail: z.string().email() })
export const FrameGetSmartAccountEnabledNetworksResponse = z.object({
  smartAccountEnabledNetworks: z.array(z.number())
})
export const FrameInitSmartAccountResponse = z.object({
  address: z.string(),
  isDeployed: z.boolean()
})
export const FrameSetPreferredAccountResponse = z.object({ type: z.string(), address: z.string() })

export const RpcResponse = z.any()

export const RpcEthAccountsRequest = z.object({
  method: z.literal('eth_accounts')
})
export const RpcEthBlockNumber = z.object({
  method: z.literal('eth_blockNumber')
})

export const RpcEthCall = z.object({
  method: z.literal('eth_call'),
  params: z.array(z.any())
})

export const RpcEthChainId = z.object({
  method: z.literal('eth_chainId')
})

export const RpcEthEstimateGas = z.object({
  method: z.literal('eth_estimateGas'),
  params: z.array(z.any())
})

export const RpcEthFeeHistory = z.object({
  method: z.literal('eth_feeHistory'),
  params: z.array(z.any())
})

export const RpcEthGasPrice = z.object({
  method: z.literal('eth_gasPrice')
})

export const RpcEthGetAccount = z.object({
  method: z.literal('eth_getAccount'),
  params: z.array(z.any())
})

export const RpcEthGetBalance = z.object({
  method: z.literal('eth_getBalance'),
  params: z.array(z.any())
})

export const RpcEthGetBlockyByHash = z.object({
  method: z.literal('eth_getBlockByHash'),
  params: z.array(z.any())
})

export const RpcEthGetBlockByNumber = z.object({
  method: z.literal('eth_getBlockByNumber'),
  params: z.array(z.any())
})

export const RpcEthGetBlockReceipts = z.object({
  method: z.literal('eth_getBlockReceipts'),
  params: z.array(z.any())
})

export const RcpEthGetBlockTransactionCountByHash = z.object({
  method: z.literal('eth_getBlockTransactionCountByHash'),
  params: z.array(z.any())
})

export const RcpEthGetBlockTransactionCountByNumber = z.object({
  method: z.literal('eth_getBlockTransactionCountByNumber'),
  params: z.array(z.any())
})

export const RpcEthGetCode = z.object({
  method: z.literal('eth_getCode'),
  params: z.array(z.any())
})

export const RpcEthGetFilter = z.object({
  method: z.literal('eth_getFilterChanges'),
  params: z.array(z.any())
})

export const RpcEthGetFilterLogs = z.object({
  method: z.literal('eth_getFilterLogs'),
  params: z.array(z.any())
})

export const RpcEthGetLogs = z.object({
  method: z.literal('eth_getLogs'),
  params: z.array(z.any())
})

export const RpcEthGetProof = z.object({
  method: z.literal('eth_getProof'),
  params: z.array(z.any())
})

export const RpcEthGetStorageAt = z.object({
  method: z.literal('eth_getStorageAt'),
  params: z.array(z.any())
})

export const RpcEthGetTransactionByBlockHashAndIndex = z.object({
  method: z.literal('eth_getTransactionByBlockHashAndIndex'),
  params: z.array(z.any())
})

export const RpcEthGetTransactionByBlockNumberAndIndex = z.object({
  method: z.literal('eth_getTransactionByBlockNumberAndIndex'),
  params: z.array(z.any())
})

export const RpcEthGetTransactionByHash = z.object({
  method: z.literal('eth_getTransactionByHash'),
  params: z.array(z.any())
})

export const RpcEthGetTransactionCount = z.object({
  method: z.literal('eth_getTransactionCount'),
  params: z.array(z.any())
})

export const RpcEthGetTransactionReceipt = z.object({
  method: z.literal('eth_getTransactionReceipt'),
  params: z.array(z.any())
})

export const RpcEthGetUncleCountByBlockHash = z.object({
  method: z.literal('eth_getUncleCountByBlockHash'),
  params: z.array(z.any())
})

export const RpcEthGetUncleCountByBlockNumber = z.object({
  method: z.literal('eth_getUncleCountByBlockNumber'),
  params: z.array(z.any())
})

export const RpcEthMaxPriorityFeePerGas = z.object({
  method: z.literal('eth_maxPriorityFeePerGas')
})

export const RpcEthNewBlockFilter = z.object({
  method: z.literal('eth_newBlockFilter')
})

export const RpcEthNewFilter = z.object({
  method: z.literal('eth_newFilter'),
  params: z.array(z.any())
})

export const RpcEthNewPendingTransactionFilter = z.object({
  method: z.literal('eth_newPendingTransactionFilter')
})

export const RpcEthSendRawTransaction = z.object({
  method: z.literal('eth_sendRawTransaction'),
  params: z.array(z.any())
})

export const RpcEthSyncing = z.object({
  method: z.literal('eth_syncing'),
  params: z.array(z.any())
})

export const RpcUnistallFilter = z.object({
  method: z.literal('eth_uninstallFilter'),
  params: z.array(z.any())
})

export const RpcPersonalSignRequest = z.object({
  method: z.literal('personal_sign'),
  params: z.array(z.any())
})

export const RpcEthSignTypedDataV4 = z.object({
  method: z.literal('eth_signTypedData_v4'),
  params: z.array(z.any())
})

export const RpcEthSendTransactionRequest = z.object({
  method: z.literal('eth_sendTransaction'),
  params: z.array(z.any())
})

export const FrameSession = z.object({
  token: z.string()
})

export const W3mFrameSchema = {
  // -- App Events -----------------------------------------------------------

  appEvent: z
    .object({ type: zType('APP_SWITCH_NETWORK'), payload: AppSwitchNetworkRequest })

    .or(z.object({ type: zType('APP_CONNECT_EMAIL'), payload: AppConnectEmailRequest }))

    .or(z.object({ type: zType('APP_CONNECT_DEVICE') }))

    .or(z.object({ type: zType('APP_CONNECT_OTP'), payload: AppConnectOtpRequest }))

    .or(z.object({ type: zType('APP_CONNECT_SOCIAL'), payload: AppConnectSocialRequest }))

    .or(z.object({ type: zType('APP_GET_USER'), payload: z.optional(AppGetUserRequest) }))

    .or(
      z.object({
        type: zType('APP_GET_SOCIAL_REDIRECT_URI'),
        payload: AppGetSocialRedirectUriRequest
      })
    )

    .or(z.object({ type: zType('APP_SIGN_OUT') }))

    .or(z.object({ type: zType('APP_IS_CONNECTED'), payload: z.optional(FrameSession) }))

    .or(z.object({ type: zType('APP_GET_CHAIN_ID') }))

    .or(z.object({ type: zType('APP_GET_SMART_ACCOUNT_ENABLED_NETWORKS') }))

    .or(z.object({ type: zType('APP_INIT_SMART_ACCOUNT') }))

    .or(
      z.object({ type: zType('APP_SET_PREFERRED_ACCOUNT'), payload: AppSetPreferredAccountRequest })
    )

    .or(
      z.object({
        type: zType('APP_RPC_REQUEST'),
        payload: RpcPersonalSignRequest.or(RpcEthSendTransactionRequest)
          .or(RpcEthAccountsRequest)
          .or(RpcEthBlockNumber)
          .or(RpcEthCall)
          .or(RpcEthChainId)
          .or(RpcEthEstimateGas)
          .or(RpcEthFeeHistory)
          .or(RpcEthGasPrice)
          .or(RpcEthGetAccount)
          .or(RpcEthGetBalance)
          .or(RpcEthGetBlockyByHash)
          .or(RpcEthGetBlockByNumber)
          .or(RpcEthGetBlockReceipts)
          .or(RcpEthGetBlockTransactionCountByHash)
          .or(RcpEthGetBlockTransactionCountByNumber)
          .or(RpcEthGetCode)
          .or(RpcEthGetFilter)
          .or(RpcEthGetFilterLogs)
          .or(RpcEthGetLogs)
          .or(RpcEthGetProof)
          .or(RpcEthGetStorageAt)
          .or(RpcEthGetTransactionByBlockHashAndIndex)
          .or(RpcEthGetTransactionByBlockNumberAndIndex)
          .or(RpcEthGetTransactionByHash)
          .or(RpcEthGetTransactionCount)
          .or(RpcEthGetTransactionReceipt)
          .or(RpcEthGetUncleCountByBlockHash)
          .or(RpcEthGetUncleCountByBlockNumber)
          .or(RpcEthMaxPriorityFeePerGas)
          .or(RpcEthNewBlockFilter)
          .or(RpcEthNewFilter)
          .or(RpcEthNewPendingTransactionFilter)
          .or(RpcEthSendRawTransaction)
          .or(RpcEthSyncing)
          .or(RpcUnistallFilter)
          .or(RpcPersonalSignRequest)
          .or(RpcEthSignTypedDataV4)
          .or(RpcEthSendTransactionRequest)
      })
    )

    .or(z.object({ type: zType('APP_UPDATE_EMAIL'), payload: AppUpdateEmailRequest }))

    .or(
      z.object({
        type: zType('APP_UPDATE_EMAIL_PRIMARY_OTP'),
        payload: AppUpdateEmailPrimaryOtpRequest
      })
    )

    .or(
      z.object({
        type: zType('APP_UPDATE_EMAIL_SECONDARY_OTP'),
        payload: AppUpdateEmailSecondaryOtpRequest
      })
    )

    .or(z.object({ type: zType('APP_SYNC_THEME'), payload: AppSyncThemeRequest }))

    .or(z.object({ type: zType('APP_SYNC_DAPP_DATA'), payload: AppSyncDappDataRequest })),

  // -- Frame Events ---------------------------------------------------------
  frameEvent: z
    .object({ type: zType('FRAME_SWITCH_NETWORK_ERROR'), payload: zError })

    .or(
      z.object({ type: zType('FRAME_SWITCH_NETWORK_SUCCESS'), payload: FrameSwitchNetworkResponse })
    )

    .or(z.object({ type: zType('FRAME_CONNECT_EMAIL_ERROR'), payload: zError }))

    .or(
      z.object({ type: zType('FRAME_CONNECT_EMAIL_SUCCESS'), payload: FrameConnectEmailResponse })
    )

    .or(z.object({ type: zType('FRAME_CONNECT_OTP_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_CONNECT_OTP_SUCCESS') }))

    .or(z.object({ type: zType('FRAME_CONNECT_DEVICE_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_CONNECT_DEVICE_SUCCESS') }))

    .or(
      z.object({
        type: zType('FRAME_CONNECT_SOCIAL_SUCCESS'),
        payload: FrameConnectSocialResponse
      })
    )
    .or(
      z.object({
        type: zType('FRAME_CONNECT_SOCIAL_ERROR'),
        payload: zError
      })
    )

    .or(z.object({ type: zType('FRAME_GET_USER_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_GET_USER_SUCCESS'), payload: FrameGetUserResponse }))

    .or(z.object({ type: zType('FRAME_GET_SOCIAL_REDIRECT_URI_ERROR'), payload: zError }))

    .or(
      z.object({
        type: zType('FRAME_GET_SOCIAL_REDIRECT_URI_SUCCESS'),
        payload: FrameGetSocialRedirectUriResponse
      })
    )

    .or(z.object({ type: zType('FRAME_SIGN_OUT_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_SIGN_OUT_SUCCESS') }))

    .or(z.object({ type: zType('FRAME_IS_CONNECTED_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_IS_CONNECTED_SUCCESS'), payload: FrameIsConnectedResponse }))

    .or(z.object({ type: zType('FRAME_GET_CHAIN_ID_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_GET_CHAIN_ID_SUCCESS'), payload: FrameGetChainIdResponse }))

    .or(z.object({ type: zType('FRAME_RPC_REQUEST_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_RPC_REQUEST_SUCCESS'), payload: RpcResponse }))

    .or(z.object({ type: zType('FRAME_SESSION_UPDATE'), payload: FrameSession }))

    .or(z.object({ type: zType('FRAME_UPDATE_EMAIL_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_UPDATE_EMAIL_SUCCESS'), payload: FrameUpdateEmailResponse }))

    .or(z.object({ type: zType('FRAME_UPDATE_EMAIL_PRIMARY_OTP_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_UPDATE_EMAIL_PRIMARY_OTP_SUCCESS') }))

    .or(z.object({ type: zType('FRAME_UPDATE_EMAIL_SECONDARY_OTP_ERROR'), payload: zError }))

    .or(
      z.object({
        type: zType('FRAME_UPDATE_EMAIL_SECONDARY_OTP_SUCCESS'),
        payload: FrameUpdateEmailSecondaryOtpResolver
      })
    )

    .or(z.object({ type: zType('FRAME_SYNC_THEME_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_SYNC_THEME_SUCCESS') }))

    .or(z.object({ type: zType('FRAME_SYNC_DAPP_DATA_ERROR'), payload: zError }))

    .or(z.object({ type: zType('FRAME_SYNC_DAPP_DATA_SUCCESS') }))

    .or(
      z.object({
        type: zType('FRAME_GET_SMART_ACCOUNT_ENABLED_NETWORKS_SUCCESS'),
        payload: FrameGetSmartAccountEnabledNetworksResponse
      })
    )

    .or(
      z.object({
        type: zType('FRAME_GET_SMART_ACCOUNT_ENABLED_NETWORKS_ERROR'),
        payload: zError
      })
    )
    .or(z.object({ type: zType('FRAME_INIT_SMART_ACCOUNT_ERROR'), payload: zError }))
    .or(
      z.object({
        type: zType('FRAME_SET_PREFERRED_ACCOUNT_SUCCESS'),
        payload: FrameSetPreferredAccountResponse
      })
    )
    .or(z.object({ type: zType('FRAME_SET_PREFERRED_ACCOUNT_ERROR'), payload: zError }))
}
