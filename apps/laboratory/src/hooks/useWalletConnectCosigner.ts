import axios, { AxiosError } from 'axios'
import { bigIntReplacer } from '../utils/CommonUtils'
import type { UserOperation } from 'permissionless'

// Define types for the request and response
type AddPermission = {
  permissionType: string
  data: string
  required: boolean
  onChainValidated: boolean
}

type AddPermissionRequest = {
  permission: AddPermission
}

export type AddPermissionResponse = {
  pci: string
  key: string
}

type Signer = {
  type: string
  data: {
    ids: string[]
  }
}

type SignerData = {
  userOpBuilder: string
}

type PermissionsContext = {
  signer: Signer
  expiry: number
  signerData: SignerData
  factory?: string
  factoryData?: string
  permissionsContext: string
}

type UpdatePermissionsContextRequest = {
  pci: string
  signature?: string
  context: PermissionsContext
}

type RevokePermissionRequest = {
  pci: string
  signature: string
}

type CoSignRequest = {
  pci: string
  userOp: UserOperation<'v0.7'>
}

type CoSignResponse = {
  userOperationTxHash: string
}

// Define a custom error type
export class CoSignerApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'CoSignerApiError'
  }
}

export function useWalletConnectCosigner() {
  const baseUrl = 'https://rpc.walletconnect.com/v1/sessions'
  /**
   * Adds a new permission session for the account.
   *
   * @param address - CAIP-10 address format
   * @param projectId - The project identifier
   * @param permission - The permission details
   * @returns A promise that resolves to the new permission details
   * @throws {CoSignerApiError} If the API request fails
   */
  async function addPermission(
    address: string,
    projectId: string,
    permission: AddPermission
  ): Promise<AddPermissionResponse> {
    const url = `${baseUrl}/${encodeURIComponent(address)}`

    try {
      const response = await axios.post<AddPermissionResponse>(
        url,
        { permission } as AddPermissionRequest,
        {
          params: { projectId },
          headers: { 'Content-Type': 'application/json' }
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          throw new CoSignerApiError(axiosError.response.status, axiosError.response.data as string)
        } else {
          throw new CoSignerApiError(500, 'Network error')
        }
      }
      // Re-throw if it's not an Axios error
      throw error
    }
  }

  /**
   * Updates permissions context for a certain permission identifier.
   *
   * @param address - CAIP-10 address format
   * @param projectId - The project identifier
   * @param updateData - The update data including pci, signature, and context
   * @returns A promise that resolves when the update is successful
   * @throws {CoSignerApiError} If the API request fails
   */
  async function updatePermissionsContext(
    address: string,
    projectId: string,
    updateData: UpdatePermissionsContextRequest
  ): Promise<void> {
    const url = `${baseUrl}/${encodeURIComponent(address)}/context`

    try {
      await axios.post(url, updateData, {
        params: { projectId },
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          if (axiosError.response.status === 401) {
            throw new CoSignerApiError(401, 'Unauthorized - Wrong signature')
          }
          throw new CoSignerApiError(axiosError.response.status, axiosError.response.data as string)
        } else {
          throw new CoSignerApiError(500, 'Network error')
        }
      }
      // Re-throw if it's not an Axios error
      throw error
    }
  }

  /**
   * Revokes a permission from account sessions.
   *
   * @param address - CAIP-10 address format
   * @param projectId - The project identifier
   * @param revokeData - The revoke data including pci and signature
   * @returns A promise that resolves when the revocation is successful
   * @throws {CoSignerApiError} If the API request fails
   */
  async function revokePermission(
    address: string,
    projectId: string,
    revokeData: RevokePermissionRequest
  ): Promise<void> {
    const url = `${baseUrl}/${encodeURIComponent(address)}/revoke`

    try {
      await axios.post(url, revokeData, {
        params: { projectId },
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          if (axiosError.response.status === 401) {
            throw new CoSignerApiError(401, 'Unauthorized - Wrong signature')
          }
          throw new CoSignerApiError(axiosError.response.status, axiosError.response.data as string)
        } else {
          throw new CoSignerApiError(500, 'Network error')
        }
      }
      // Re-throw if it's not an Axios error
      throw error
    }
  }
  /**
   * Sends a co-signing request for a user operation.
   *
   * @param address - CAIP-10 address format
   * @param projectId - The project identifier
   * @param coSignData - The co-sign data including pci and userOp
   * @returns A promise that resolves to the user operation receipt
   * @throws {CoSignerApiError} If the API request fails
   */
  async function coSignUserOperation(
    address: string,
    projectId: string,
    coSignData: CoSignRequest
  ): Promise<CoSignResponse> {
    const url = `${baseUrl}/${encodeURIComponent(address)}/sign`

    try {
      const response = await axios.post<CoSignResponse>(url, coSignData, {
        params: { projectId },
        headers: { 'Content-Type': 'application/json' },
        transformRequest: [data => JSON.stringify(data, bigIntReplacer)]
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          if (axiosError.response.status === 401) {
            throw new CoSignerApiError(401, 'Unauthorized - Wrong signature')
          }
          throw new CoSignerApiError(axiosError.response.status, axiosError.response.data as string)
        } else {
          throw new CoSignerApiError(500, 'Network error')
        }
      }
      // Re-throw if it's not an Axios error
      throw error
    }
  }

  return {
    addPermission,
    updatePermissionsContext,
    revokePermission,
    coSignUserOperation
  }
}
