import { useEffect, useEffectEvent, useState } from 'react'

type AsyncDataState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

export function useAsyncData<T>(factory: () => Promise<T>) {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })
  const [reloadVersion, setReloadVersion] = useState(0)
  const runFactory = useEffectEvent(factory)

  useEffect(() => {
    let isMounted = true

    runFactory()
      .then((data) => {
        if (!isMounted) {
          return
        }

        setState({
          data,
          error: null,
          isLoading: false,
        })
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setState({
          data: null,
          error: error instanceof Error ? error.message : 'No fue posible cargar la información.',
          isLoading: false,
        })
      })

    return () => {
      isMounted = false
    }
  }, [reloadVersion])

  return {
    ...state,
    reload() {
      setState((currentState) => ({
        data: currentState.data,
        error: null,
        isLoading: true,
      }))
      setReloadVersion((currentValue) => currentValue + 1)
    },
  }
}
