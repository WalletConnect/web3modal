import { z } from 'zod'
import {
  W3mFrameSchema,
  AppConnectEmailRequest,
  AppConnectOtpRequest,
  AppSwitchNetworkRequest,
  FrameConnectEmailResponse,
  FrameGetChainIdResponse,
  FrameGetUserResponse,
  FrameIsConnectedResponse,
  RpcPersonalSignRequest,
  RpcResponse,
  RpcEthSendTransactionRequest,
  RpcEthSignTypedDataV4,
  RpcEthAccountsRequest,
  RpcEthEstimateGas,
  RpcEthGasPrice,
  RpcEthBlockNumber,
  RpcEthGetTransactionByHash,
  RpcEthGetBlockByNumber,
  RpcEthCall,
  RpcEthFeeHistory,
  RpcEthGetAccount,
  RpcEthGetBalance,
  RpcEthGetBlockyByHash,
  RpcUnistallFilter,
  RpcEthSyncing,
  RpcEthSendRawTransaction,
  RpcEthNewPendingTransactionFilter,
  RpcEthNewFilter,
  RpcEthNewBlockFilter,
  RpcEthMaxPriorityFeePerGas,
  RpcEthGetUncleCountByBlockNumber,
  RpcEthGetUncleCountByBlockHash,
  RpcEthGetTransactionReceipt,
  RpcEthGetTransactionCount,
  RpcEthGetTransactionByBlockNumberAndIndex,
  RpcEthGetTransactionByBlockHashAndIndex,
  RpcEthGetStorageAt,
  RpcEthGetProof,
  RpcEthGetLogs,
  RpcEthGetFilterLogs,
  RpcEthGetFilter,
  RpcEthGetCode,
  RcpEthGetBlockTransactionCountByNumber,
  RcpEthGetBlockTransactionCountByHash,
  RpcEthGetBlockReceipts,
  FrameSession,
  AppGetUserRequest,
  AppUpdateEmailRequest,
  FrameUpdateEmailSecondaryOtpResolver,
  AppUpdateEmailPrimaryOtpRequest,
  AppUpdateEmailSecondaryOtpRequest,
  AppSyncThemeRequest,
  RpcEthChainId,
  FrameSwitchNetworkResponse,
  AppSyncDappDataRequest,
  FrameGetSmartAccountEnabledNetworksResponse
} from './W3mFrameSchema.js'

export namespace W3mFrameTypes {
  export type AppEvent = z.infer<typeof W3mFrameSchema.appEvent>

  export type FrameEvent = z.infer<typeof W3mFrameSchema.frameEvent>

  export interface Requests {
    AppConnectEmailRequest: z.infer<typeof AppConnectEmailRequest>
    AppConnectOtpRequest: z.infer<typeof AppConnectOtpRequest>
    AppSwitchNetworkRequest: z.infer<typeof AppSwitchNetworkRequest>
    AppGetUserRequest: z.infer<typeof AppGetUserRequest>
    AppUpdateEmailRequest: z.infer<typeof AppUpdateEmailRequest>
    AppSyncThemeRequest: z.infer<typeof AppSyncThemeRequest>
    AppSyncDappDataRequest: z.infer<typeof AppSyncDappDataRequest>
    AppUpdateEmailPrimaryOtpRequest: z.infer<typeof AppUpdateEmailPrimaryOtpRequest>
    AppUpdateEmailSecondaryOtpRequest: z.infer<typeof AppUpdateEmailSecondaryOtpRequest>
  }

  export interface Responses {
    FrameConnectEmailResponse: z.infer<typeof FrameConnectEmailResponse>
    FrameGetChainIdResponse: z.infer<typeof FrameGetChainIdResponse>
    FrameGetUserResponse: z.infer<typeof FrameGetUserResponse>
    FrameIsConnectedResponse: z.infer<typeof FrameIsConnectedResponse>
    FrameUpdateEmailSecondaryOtpResolver: z.infer<typeof FrameUpdateEmailSecondaryOtpResolver>
    FrameSwitchNetworkResponse: z.infer<typeof FrameSwitchNetworkResponse>
    FrameGetSmartAccountEnabledNetworksResponse: z.infer<
      typeof FrameGetSmartAccountEnabledNetworksResponse
    >
  }

  export interface Network {
    rpcUrl: string
    chainId: number
  }

  export type RPCRequest =
    | z.infer<typeof RpcEthAccountsRequest>
    | z.infer<typeof RpcEthBlockNumber>
    | z.infer<typeof RpcEthCall>
    | z.infer<typeof RpcEthChainId>
    | z.infer<typeof RpcEthEstimateGas>
    | z.infer<typeof RpcEthFeeHistory>
    | z.infer<typeof RpcEthGasPrice>
    | z.infer<typeof RpcEthGetAccount>
    | z.infer<typeof RpcEthGetBalance>
    | z.infer<typeof RpcEthGetBlockyByHash>
    | z.infer<typeof RpcEthGetBlockByNumber>
    | z.infer<typeof RpcEthGetBlockReceipts>
    | z.infer<typeof RcpEthGetBlockTransactionCountByHash>
    | z.infer<typeof RcpEthGetBlockTransactionCountByNumber>
    | z.infer<typeof RpcEthGetCode>
    | z.infer<typeof RpcEthGetFilter>
    | z.infer<typeof RpcEthGetFilterLogs>
    | z.infer<typeof RpcEthGetLogs>
    | z.infer<typeof RpcEthGetProof>
    | z.infer<typeof RpcEthGetStorageAt>
    | z.infer<typeof RpcEthGetTransactionByBlockHashAndIndex>
    | z.infer<typeof RpcEthGetTransactionByBlockNumberAndIndex>
    | z.infer<typeof RpcEthGetTransactionByHash>
    | z.infer<typeof RpcEthGetTransactionCount>
    | z.infer<typeof RpcEthGetTransactionReceipt>
    | z.infer<typeof RpcEthGetUncleCountByBlockHash>
    | z.infer<typeof RpcEthGetUncleCountByBlockNumber>
    | z.infer<typeof RpcEthMaxPriorityFeePerGas>
    | z.infer<typeof RpcEthNewBlockFilter>
    | z.infer<typeof RpcEthNewFilter>
    | z.infer<typeof RpcEthNewPendingTransactionFilter>
    | z.infer<typeof RpcEthSendRawTransaction>
    | z.infer<typeof RpcEthSyncing>
    | z.infer<typeof RpcUnistallFilter>
    | z.infer<typeof RpcPersonalSignRequest>
    | z.infer<typeof RpcEthSignTypedDataV4>
    | z.infer<typeof RpcEthSendTransactionRequest>

  export type RPCResponse = z.infer<typeof RpcResponse>

  export type FrameSessionType = z.infer<typeof FrameSession>
}
