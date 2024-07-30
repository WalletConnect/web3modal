/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import { type GrantPermissionsReturnType } from 'viem/experimental'
import {
  ENTRYPOINT_ADDRESS_V07,
  getPackedUserOperation,
  getUserOperationHash
} from 'permissionless'
import { type UserOperation } from 'permissionless/types'
import { encodeAbiParameters, hashMessage, type PublicClient } from 'viem'
import { serializePublicKey, sign as signWithPasskey, type P256Credential } from 'webauthn-p256'
import { type Chain } from 'wagmi/chains'
import { useUserOpBuilder, type Execution } from './useUserOpBuilder'
import { bigIntReplacer, hexStringToBase64 } from '../utils/CommonUtils'
import { createClients } from '../utils/PermissionsUtils'
import { useWalletConnectCosigner } from './useWalletConnectCosigner'
import { useWagmiPermissions } from '../context/WagmiPermissionsContext'

export function usePermissions() {
  const { getCallDataWithContext, getNonceWithContext } = useUserOpBuilder()
  const { coSignUserOperation, updatePermissionsContext } = useWalletConnectCosigner()
  const {
    grantedPermissions,
    wcCosignerData,
    permissionConsumedCount,
    setPermissionConsumedCount,
    passkeyId,
    passkey
  } = useWagmiPermissions()

  async function prepareUserOperationWithPermissions(
    publicClient: PublicClient,
    args: {
      actions: Execution[]
      permissions: GrantPermissionsReturnType
    }
  ): Promise<UserOperation<'v0.7'>> {
    const { permissions, actions } = args
    const { factory, factoryData, signerData, permissionsContext } = permissions

    if (!signerData?.userOpBuilder || !signerData.submitToAddress || !permissionsContext) {
      throw new Error(`Invalid permissions ${JSON.stringify(permissions, bigIntReplacer)}`)
    }

    const nonce = await getNonceWithContext(publicClient, {
      userOpBuilderAddress: signerData.userOpBuilder,
      sender: signerData.submitToAddress,
      permissionsContext: permissionsContext as `0x${string}`
    })

    const callData = await getCallDataWithContext(publicClient, {
      userOpBuilderAddress: signerData.userOpBuilder,
      sender: signerData.submitToAddress,
      permissionsContext: permissionsContext as `0x${string}`,
      actions
    })

    /*
     * Comment
     * const dummySignature = await getDummySignatureWithContext(publicClient, {
     *   userOpBuilderAddress: signerData.userOpBuilder,
     *   sender: signerData.submitToAddress,
     *   permissionsContext: permissionsContext as `0x${string}`,
     *   actions
     * })
     * console.log({ dummySignature })
     */
    const userOp: UserOperation<'v0.7'> = {
      sender: signerData.submitToAddress,
      factory,
      factoryData: factoryData ? (factoryData as `0x${string}`) : undefined,
      nonce,
      callData,
      callGasLimit: BigInt(2000000),
      verificationGasLimit: BigInt(2000000),
      preVerificationGas: BigInt(2000000),
      maxFeePerGas: BigInt(0),
      maxPriorityFeePerGas: BigInt(0),
      signature: '0x'
    }

    return userOp
  }

  async function signUserOperationWithPasskeyAndCosigner(args: {
    userOp: UserOperation<'v0.7'>
    permissions: GrantPermissionsReturnType
    chain: Chain
  }): Promise<`0x${string}`> {
    const { userOp, chain, permissions } = args

    const { signerData, permissionsContext } = permissions

    if (!signerData?.userOpBuilder || !signerData.submitToAddress || !permissionsContext) {
      throw new Error(`Invalid permissions ${JSON.stringify(permissions, bigIntReplacer)}`)
    }
    const packedForEntryPoint = getPackedUserOperation(userOp)
    console.log({ packedForEntryPoint })
    const userOpHash = getUserOperationHash({
      userOperation: {
        ...userOp
      },
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      chainId: chain.id
    })
    const ethMessageUserOpHash = hashMessage({ raw: userOpHash })
    const usersPasskeySignature = await signWithPasskey({
      credentialId: passkeyId,
      hash: ethMessageUserOpHash
    })

    const authenticatorData = usersPasskeySignature.webauthn.authenticatorData
    const clientDataJSON = usersPasskeySignature.webauthn.clientDataJSON
    const responseTypeLocation = usersPasskeySignature.webauthn.typeIndex
    // Const userVerificationRequired = usersPasskeySignature.webauthn.userVerificationRequired
    const r = usersPasskeySignature.signature.r
    const s = usersPasskeySignature.signature.s

    const passkeySignature = encodeAbiParameters(
      [
        { type: 'bytes' },
        { type: 'string' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'bool' }
      ],
      [authenticatorData, clientDataJSON, responseTypeLocation, r, s, false]
    )

    return passkeySignature
  }

  async function buildAndSendTransactionsWithCosignerAndPermissions(args: {
    permissions: GrantPermissionsReturnType
    actions: Execution[]
    chain: Chain
    accountAddress: `0x${string}`
  }): Promise<`0x${string}`> {
    const { permissions, actions, chain, accountAddress } = args

    const { publicClient, bundlerClient } = createClients(chain)
    const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
    }
    if (!wcCosignerData) {
      throw new Error('No WC_COSIGNER data available')
    }

    const caip10Address = `eip155:${chain?.id}:${accountAddress}`
    const userOp = await prepareUserOperationWithPermissions(publicClient, {
      actions,
      permissions
    })

    const gasPrice = await bundlerClient.getUserOperationGasPrice()
    userOp.maxFeePerGas = gasPrice.fast.maxFeePerGas
    userOp.maxPriorityFeePerGas = gasPrice.fast.maxPriorityFeePerGas

    /**
     * Comment
     * const pimlicoPaymasterClient = createPimlicoPaymasterClient({
     *   transport: http(getPaymasterUrl()),
     *  entryPoint: ENTRYPOINT_ADDRESS_V07,
     *   chain: sepolia
     *  })
     * const paymasterResponse = pimlicoPaymasterClient.sponsorUserOperation({
     *   userOperation: userOp
     * })
     * userOp = { ...userOp, ...paymasterResponse }
     * console.log({ userOp })
     */
    const signature = await signUserOperationWithPasskeyAndCosigner({
      permissions,
      userOp,
      chain
    })

    userOp.signature = signature
    const txHash = await coSignUserOperation(caip10Address, projectId, {
      pci: wcCosignerData.pci,
      userOp
    })

    const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
      hash: txHash.userOperationTxHash as `0x${string}`
    })

    if (userOpReceipt) {
      const consumedCount = parseInt(permissionConsumedCount || '0', 10) + 1
      console.log({ consumedCount })
      setPermissionConsumedCount(consumedCount.toString())
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      let pc = grantedPermissions?.permissionsContext!
      pc = `${pc.slice(0, 42)}00${pc.slice(44)}`
      await updatePermissionsContext(caip10Address, projectId, {
        pci: wcCosignerData.pci,
        context: {
          expiry: permissions.expiry,
          signer: {
            type: 'native-token-transfer',
            data: {
              ids: [wcCosignerData.key, hexStringToBase64(passkeyPublicKey)]
            }
          },
          signerData: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            userOpBuilder: permissions.signerData?.userOpBuilder!
          },
          permissionsContext: pc,
          factory: permissions.factory || '',
          factoryData: permissions.factoryData || ''
        }
      })
    }

    return userOpReceipt.receipt.transactionHash
  }

  return {
    buildAndSendTransactionsWithCosignerAndPermissions
  }
}
