import { memo, useEffect, useRef, useState } from 'react'
import { cx } from '~/lib/utils'

export const AQRM_SCRIPT_SRC = 'https://aqrm.mooth.tech/aqrm.js?s=utils.mooth.tech'

export const MODAL_ROOT_ID = 'aqrm-modal-root'

export const FeedbackButtonModalRoot: React.FC = memo(() => <div id={MODAL_ROOT_ID} />)

const FeedbackButton: React.FC = () => {
  const [enabled, setEnabled] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let widget: { unregister: () => void }
    let register = (window as any)._AQRM_REGISTER

    const root = document.getElementById(MODAL_ROOT_ID)

    const loadedPromise = new Promise((resolve, reject) => {
      let tries = 0

      const check = () => {
        tries++
        register = (window as any)._AQRM_REGISTER
        if (register) {
          resolve(true)
        } else if (tries <= 5) {
          setTimeout(() => check(), 500)
        } else {
          reject()
        }
      }

      check()
    })

    loadedPromise
      .then(() => {
        if (register) {
          widget = register(root, buttonRef.current)
          setEnabled(true)
        }
      })
      .catch(() => setEnabled(false))

    return () => {
      widget?.unregister?.()
    }
  }, [])

  return (
    <button
      ref={buttonRef}
      disabled={!enabled}
      className={cx(
        'inline-block focus-outline px-2',
        enabled ? 'link link-hover' : 'cursor-not-allowed opacity-75'
      )}
    >
      Feedback &amp; Suggestions
    </button>
  )
}

export default FeedbackButton
