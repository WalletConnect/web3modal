import { AccountCtrl } from '@web3modal/core'
import { useController } from '../utils/useController'

export function useAccount() {
  const { data, isReady } = useController({
    getFn: AccountCtrl.get,
    watchFn: AccountCtrl.watch,
    args: undefined
  })
  const account = {
    address: data?.address ?? '',
    connector: data?.connector,
    isConnected: data?.isConnected,
    isReconnecting: data?.isReconnecting,
    isConnecting: data?.isConnecting,
    isDisconnected: data?.isDisconnected,
    status: data?.status
  }

  return { account, isReady }
}
