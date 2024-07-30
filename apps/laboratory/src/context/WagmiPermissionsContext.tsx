import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import {
  GRANTED_PERMISSIONS_KEY,
  PASSKEY_LOCALSTORAGE_KEY,
  PERMISSION_CONSUMED_COUNT,
  removeItem,
  setItem,
  WC_COSIGNER_DATA,
  type PasskeyLocalStorageFormat
} from '../utils/LocalStorage'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import type { GrantPermissionsReturnType } from 'viem/experimental'
import type { AddPermissionResponse } from '../hooks/useWalletConnectCosigner'
import type { P256Credential } from 'webauthn-p256'

type PasskeyStorageType = P256Credential | PasskeyLocalStorageFormat | undefined
interface WagmiPermissionsContextType {
  permissionConsumedCount: string | undefined
  passkey: PasskeyStorageType
  isPasskeyAvailable: boolean
  passkeyId: string
  grantedPermissions: GrantPermissionsReturnType | undefined
  wcCosignerData: AddPermissionResponse | undefined
  setGrantedPermissions: React.Dispatch<
    React.SetStateAction<GrantPermissionsReturnType | undefined>
  >
  setWCCosignerData: React.Dispatch<React.SetStateAction<AddPermissionResponse | undefined>>
  setPasskey: (value: PasskeyStorageType) => void
  clearGrantedPermissions: () => void
  setPermissionConsumedCount: React.Dispatch<React.SetStateAction<string | undefined>>
}
function noop() {
  console.warn('WagmiPermissionsContext used outside of provider')
}
export const WagmiPermissionsContext = createContext<WagmiPermissionsContextType>({
  permissionConsumedCount: undefined,
  passkey: undefined,
  isPasskeyAvailable: false,
  passkeyId: '',
  grantedPermissions: undefined,
  wcCosignerData: undefined,
  setPermissionConsumedCount: noop,
  setGrantedPermissions: noop,
  setWCCosignerData: noop,
  setPasskey: noop,
  clearGrantedPermissions: noop
})

interface WagmiPermissionsProviderProps {
  children: ReactNode
}

export function WagmiPermissionsProvider({ children }: WagmiPermissionsProviderProps) {
  const [passkey, setPasskey] = useLocalStorageState<PasskeyStorageType>(
    PASSKEY_LOCALSTORAGE_KEY,
    undefined
  )
  const [permissionConsumedCount, setPermissionConsumedCount] = useLocalStorageState<
    string | undefined
  >(PERMISSION_CONSUMED_COUNT, '0')
  const [grantedPermissions, setGrantedPermissions] = useLocalStorageState<
    GrantPermissionsReturnType | undefined
  >(GRANTED_PERMISSIONS_KEY, undefined)
  const [wcCosignerData, setWCCosignerData] = useLocalStorageState<
    AddPermissionResponse | undefined
  >(WC_COSIGNER_DATA, undefined)

  const [isPasskeyAvailable, setIsPasskeyAvailable] = useState(false)
  const [passkeyId, setPasskeyId] = useState('')
  function setNewPasskey(value: PasskeyStorageType) {
    setItem(PASSKEY_LOCALSTORAGE_KEY, '')
    setPasskey(value)
    setIsPasskeyAvailable(false)
  }
  function clearGrantedPermissions() {
    removeItem(GRANTED_PERMISSIONS_KEY)
    setGrantedPermissions(undefined)
  }

  useEffect(() => {
    if (passkey) {
      setIsPasskeyAvailable(true)
      setPasskeyId((passkey as P256Credential).id)
    }
  }, [passkey])

  return (
    <WagmiPermissionsContext.Provider
      value={{
        permissionConsumedCount,
        passkey,
        isPasskeyAvailable,
        passkeyId,
        grantedPermissions,
        wcCosignerData,
        clearGrantedPermissions,
        setPermissionConsumedCount,
        setPasskey: setNewPasskey,
        setGrantedPermissions,
        setWCCosignerData
      }}
    >
      {children}
    </WagmiPermissionsContext.Provider>
  )
}
export function useWagmiPermissions() {
  const context = useContext(WagmiPermissionsContext)
  if (context === undefined) {
    throw new Error('useWagmiPermissions must be used within a GrantedPermissionsProvider')
  }

  return context
}
