import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef, useState } from 'react'
import mitt from 'mitt'

const em = mitt<Record<string, any>>()

// This block relies on window, so to make sure it only runs on the client
// we need to check if `window` is defined
if (typeof window !== 'undefined') {
  // We define this globally since it simplifies the already extremely
  // complicated hook a tiny bit, and we can handle emitting changes from
  // other tabs / windows in one spot
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage && event.key != null) {
      em.emit(event.key, event.newValue == null ? null : JSON.parse(event.newValue))
    }
  })

  // Same as above  - we can handle setting localStorage all in one spot
  em.on('*', (key, data) => {
    localStorage.setItem(key, data)
  })
}

export const useSyncedLocalStorage = <T extends NonNullable<any>, K extends string = string>(
  key: K,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(initialValue)
  const initialised = useRef(false)
  const shouldSync = useRef(false)
  const emitting = useRef(false)
  const initialValueRef = useRef(initialValue)

  useEffect(() => {
    initialValueRef.current = initialValue
  }, [initialValue])

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    const cached = localStorage.getItem(key)

    if (!cached) {
      setState(initialValueRef.current)
      return
    }

    try {
      setState(JSON.parse(cached))
    } catch (err) {
      setState(initialValueRef.current)
    }
  }, [key])

  useEffect(() => {
    const handler = (data: T | null) => {
      // If this hook is the one that sent the message, just ignore it
      if (!emitting.current) {
        shouldSync.current = false
        setState(data ?? initialValueRef.current)
      }
    }

    em.on(key, handler)

    return () => {
      em.off(key, handler)
    }
  }, [key])

  useEffect(() => {
    // Prevents this hook from re-sending an update
    if (!shouldSync.current) {
      shouldSync.current = true
      return
    }

    // Prevents this hook from setting itself again
    emitting.current = true
    em.emit(key, state)
    emitting.current = false
  }, [state, key])

  return [state, setState]
}
