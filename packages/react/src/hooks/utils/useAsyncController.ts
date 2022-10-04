import { useCallback, useEffect, useState } from 'react'
import { useClientInitialized } from '../data/useClientInitialized'
import { useOptionsChange } from './useOptionsChange'

type Arguments<TArgs> = TArgs & {
  enabled?: boolean
  watch?: boolean
}

interface Options<TArgs, TReturn> {
  fetchFn: (args: TArgs) => Promise<TReturn>
  watchFn?: (args: TArgs, callback: (watchData: TReturn) => void) => () => void
  args: Arguments<TArgs>
}

export function useAsyncController<TArgs, TReturn>({
  fetchFn,
  watchFn,
  args
}: Options<TArgs, TReturn>) {
  const { enabled, watch } = args
  const isEnabled = typeof enabled === 'undefined' ? true : enabled
  const [isLoading, setIsLoading] = useState(isEnabled)
  const [isFirstFetch, setIsFirstFetch] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [data, setData] = useState<TReturn | undefined>(undefined)
  const initialized = useClientInitialized()
  const ready = initialized && isEnabled

  const onFetch = useCallback(
    async (newArgs?: TArgs) => {
      let newData: TReturn | undefined = undefined

      if (!isLoading || isFirstFetch) {
        setIsFirstFetch(false)
        setIsLoading(true)
        try {
          newData = await fetchFn(newArgs ?? args)
          setData(newData)
          setError(undefined)
        } catch (err: unknown) {
          if (err instanceof Error) setError(err)
          else setError(new Error('Unknown error'))
          setData(undefined)
        } finally {
          setIsLoading(false)
        }
      }

      return newData
    },
    [fetchFn, args, isLoading, isFirstFetch]
  )

  useEffect(() => {
    let unwatch: (() => void) | undefined = undefined
    if (watch && !isFirstFetch && watchFn) unwatch = watchFn(args, newData => setData(newData))

    return () => {
      unwatch?.()
    }
  }, [watch, isFirstFetch, args, watchFn])

  useOptionsChange(() => {
    if (!watch && !isFirstFetch) {
      console.log('options changed fetch')
      onFetch()
    }
  }, args)

  useEffect(() => {
    if (ready && isFirstFetch) {
      console.log('ready fetch')
      onFetch()
    }
  }, [ready, isFirstFetch, onFetch])

  return {
    data,
    onFetch,
    isLoading,
    error
  }
}
