import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from '../data/useBlockNumber'
import { useClientInitialized } from '../data/useClientInitialized'
import { useAddressChange } from './useAddressChange'
import { useChainIdChange } from './useChainIdChange'

// -- types ----------------------------------------------------- //
interface Controller<R, O> {
  fetch: (args: O) => Promise<R>
}

interface Options {
  watch?: boolean
  enabled?: boolean
  chainId?: number
  addressOrName?: string
}

export interface RefetchArgs {
  skipLoading?: boolean
}

// -- hook ------------------------------------------------------ //
export function useStaticAsyncController<R, O extends Options>(
  controller: Controller<R, O>,
  options: O
) {
  const enabled = typeof options.enabled === 'undefined' ? true : options.enabled
  const { chainId, addressOrName, watch } = options
  const [initial, setInitial] = useState(true)
  const [data, setData] = useState<R | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useClientInitialized()
  const { data: blockNumber } = useBlockNumber({ watch, enabled: enabled && watch, chainId })
  const ready = initialized && enabled

  const onFetch = useCallback(
    async (args?: RefetchArgs) => {
      try {
        if (!args?.skipLoading) setIsLoading(true)
        const newData = await controller.fetch(options)
        setData(newData)
        setError(undefined)
      } catch (err: unknown) {
        if (err instanceof Error) setError(err)
        else setError(new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    },
    [controller, options]
  )

  useEffect(() => {
    if (initial && !watch && ready) onFetch()
    setInitial(false)
  }, [ready, initial, watch, onFetch])

  useEffect(() => {
    if (!initial && watch && ready && Boolean(blockNumber)) onFetch({ skipLoading: true })
  }, [blockNumber, initial, watch, ready, onFetch])

  useEffect(() => {
    if (!enabled) setIsLoading(false)
  }, [enabled])

  useChainIdChange(() => {
    if (!initial && !watch) onFetch()
  }, chainId)

  useAddressChange(() => {
    if (!initial && !watch) onFetch()
  }, addressOrName)

  return {
    data,
    error,
    isLoading,
    onFetch
  }
}
