/* eslint-disable no-console */
import { Button, Stack, Text } from '@chakra-ui/react'
import { useAccount } from 'wagmi'
import { walletActionsErc7715, type GrantPermissionsParameters } from 'viem/experimental'
import { useCallback, useState } from 'react'
import { useChakraToast } from '../Toast'
import { createPublicClient, custom, parseEther } from 'viem'
import { EIP_7715_RPC_METHODS } from '../../utils/EIP5792Utils'
import {
  bigIntReplacer,
  decodeUncompressedPublicKey,
  encodePublicKeyToDID,
  hexStringToBase64
} from '../../utils/CommonUtils'
import { useWagmiPermissions } from '../../context/WagmiPermissionsContext'
import { serializePublicKey, type P256Credential } from 'webauthn-p256'
import { CoSignerApiError, useWalletConnectCosigner } from '../../hooks/useWalletConnectCosigner'
import { useWagmiAvailableCapabilities } from '../../hooks/useWagmiActiveCapabilities'

export function WagmiRequestPermissionsTest() {
  const { isMethodSupported: isGrantPermissionsSupported, ethereumProvider } =
    useWagmiAvailableCapabilities({
      method: EIP_7715_RPC_METHODS.WALLET_GRANT_PERMISSIONS
    })
  const { chain, address, isConnected } = useAccount()
  const {
    passkey,
    grantedPermissions,
    clearGrantedPermissions,
    setGrantedPermissions,
    setWCCosignerData,
    setPermissionConsumedCount
  } = useWagmiPermissions()
  const [isRequestPermissionLoading, setRequestPermissionLoading] = useState<boolean>(false)
  const { addPermission, updatePermissionsContext } = useWalletConnectCosigner()
  const toast = useChakraToast()

  function getSamplePermissions(
    secp256k1DID: string,
    passkeyDID: string
  ): GrantPermissionsParameters {
    return {
      expiry: Date.now() + 24 * 60 * 60,
      permissions: [
        {
          type: 'native-token-transfer',
          data: {
            ticker: 'ETH'
          },
          policies: [
            {
              type: 'token-allowance',
              data: {
                allowance: parseEther('1')
              }
            }
          ]
        }
      ],
      signer: {
        type: 'keys',
        data: {
          ids: [secp256k1DID, passkeyDID]
        }
      }
    }
  }

  const onRequestPermissions = useCallback(async () => {
    setRequestPermissionLoading(true)
    const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
    }
    if (!passkey) {
      throw new Error('Passkey not available')
    }
    const caip10Address = `eip155:${chain?.id}:${address}`
    try {
      const addPermissionResponse = await addPermission(caip10Address, projectId, {
        permissionType: 'native-token-transfer',
        data: '',
        onChainValidated: false,
        required: true
      })
      console.info({ addPermissionResponse })
      setWCCosignerData(addPermissionResponse)
      const cosignerPublicKey = decodeUncompressedPublicKey(addPermissionResponse.key)
      let p = passkey as P256Credential
      p = {
        ...p,
        publicKey: {
          prefix: p.publicKey.prefix,
          x: BigInt(p.publicKey.x),
          y: BigInt(p.publicKey.y)
        }
      }
      const passkeyPublicKey = serializePublicKey(p.publicKey, { to: 'hex' })
      const passkeyDID = encodePublicKeyToDID(passkeyPublicKey, 'secp256r1')
      const secp256k1DID = encodePublicKeyToDID(cosignerPublicKey, 'secp256k1')

      const publicClient = createPublicClient({
        chain,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transport: custom(ethereumProvider!)
      }).extend(walletActionsErc7715())
      const samplePermissions = getSamplePermissions(secp256k1DID, passkeyDID)
      const approvedPermissions = await publicClient.grantPermissions(samplePermissions)
      if (approvedPermissions) {
        await updatePermissionsContext(caip10Address, projectId, {
          pci: addPermissionResponse.pci,
          context: {
            expiry: approvedPermissions.expiry,
            signer: {
              type: 'native-token-transfer',
              data: {
                ids: [addPermissionResponse.key, hexStringToBase64(passkeyPublicKey)]
              }
            },
            signerData: {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
              userOpBuilder: approvedPermissions.signerData?.userOpBuilder!
            },
            permissionsContext: approvedPermissions.permissionsContext,
            factory: approvedPermissions.factory || '',
            factoryData: approvedPermissions.factoryData || ''
          }
        })
        console.info('Updated the context on co-signer')
        setPermissionConsumedCount('0')
        setGrantedPermissions(approvedPermissions)
        setRequestPermissionLoading(false)
        toast({
          type: 'success',
          title: 'Permissions Granted',
          description: JSON.stringify(approvedPermissions, bigIntReplacer)
        })

        return
      }
      toast({ title: 'Error', description: 'Failed to obtain permissions' })
    } catch (error) {
      if (error instanceof CoSignerApiError) {
        console.error(`API Error ${error.status}: ${error.message}`)
      }
      console.error('Unexpected error:', error)
      toast({
        type: 'error',
        title: 'Permissions Erros',
        description: error instanceof Error ? error.message : 'Some error occurred'
      })
    }
    setRequestPermissionLoading(false)
  }, [passkey])

  if (!isConnected || !ethereumProvider || !address) {
    return (
      <Text fontSize="md" color="yellow">
        Wallet not connected
      </Text>
    )
  }
  if (!isGrantPermissionsSupported()) {
    return (
      <Text fontSize="md" color="yellow">
        Wallet does not support wallet_grantPermissions rpc method
      </Text>
    )
  }

  return (
    <Stack direction={['column', 'column', 'row']}>
      <Button
        data-test-id="request-permissions-button"
        onClick={onRequestPermissions}
        isDisabled={Boolean(
          isRequestPermissionLoading || Boolean(grantedPermissions) || !isConnected
        )}
        isLoading={isRequestPermissionLoading}
      >
        Request Permissions
      </Button>
      <Button
        data-test-id="clear-permissions-button"
        onClick={clearGrantedPermissions}
        isDisabled={!grantedPermissions}
      >
        Clear Permissions
      </Button>
    </Stack>
  )
}
