import { ENTRYPOINT_ADDRESS_V07, createBundlerClient } from 'permissionless'
import { pimlicoBundlerActions, pimlicoPaymasterActions } from 'permissionless/actions/pimlico'
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico'
import { createPublicClient, http, type Chain } from 'viem'

export function getPublicClientUrl(): string {
  const localPublicClientUrl = process.env['NEXT_PUBLIC_LOCAL_CLIENT_URL']
  if (localPublicClientUrl) {
    return localPublicClientUrl
  }

  return ''
}

export function getBundlerUrl(): string {
  const localBundlerUrl = process.env['NEXT_PUBLIC_LOCAL_BUNDLER_URL']
  if (localBundlerUrl) {
    return localBundlerUrl
  }
  const apiKey = process.env['NEXT_PUBLIC_PIMLICO_KEY']
  if (!apiKey) {
    throw new Error('env NEXT_PUBLIC_PIMLICO_KEY missing.')
  }

  return `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`
}

export function getPaymasterUrl(): string {
  const localPaymasterUrl = process.env['NEXT_PUBLIC_LOCAL_PAYMASTER_URL']
  if (localPaymasterUrl) {
    return localPaymasterUrl
  }
  const apiKey = process.env['NEXT_PUBLIC_PIMLICO_KEY']
  if (!apiKey) {
    throw new Error('env NEXT_PUBLIC_PIMLICO_KEY missing.')
  }

  return `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`
}

export function createClients(chain: Chain) {
  const publicClientUrl = getPublicClientUrl()
  const bundlerUrl = getBundlerUrl()
  const paymasterUrl = getPaymasterUrl()
  const publicClient = createPublicClient({
    transport: http(publicClientUrl),
    chain
  })

  const bundlerClient = createBundlerClient({
    transport: http(bundlerUrl, {
      timeout: 30000
    }),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain
  })
    .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07))
    .extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07))

  const pimlicoPaymasterClient = createPimlicoPaymasterClient({
    transport: http(paymasterUrl),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain
  })

  return { publicClient, bundlerClient, pimlicoPaymasterClient }
}
