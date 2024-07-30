import type { PackedUserOperation } from 'permissionless/types'
import { publicActions, type Address, type Client, type Hex } from 'viem'

export type UserOpBuilderGetDummySignatureArguments = {
  sender: Address
  userOpBuilderAddress: Address
  actions: Execution[]
  permissionsContext: `0x${string}`
}
export type UserOpBuilderGetSignatureArguments = {
  sender: Address
  userOpBuilderAddress: Address
  userOperation: PackedUserOperation
  permissionsContext: `0x${string}`
}
export type UserOpBuilderGetNonceArguments = {
  sender: Address
  userOpBuilderAddress: Address
  permissionsContext: `0x${string}`
}
export type UserOpBuilderGetCallDataArguments = {
  sender: Address
  userOpBuilderAddress: Address
  permissionsContext: `0x${string}`
  actions: Execution[]
}

export type Execution = {
  target: Hex
  value: bigint
  callData: Hex
}
export const getNonceAbi = [
  {
    type: 'function',
    name: 'getNonce',
    inputs: [
      {
        name: 'smartAccount',
        type: 'address',
        internalType: 'address'
      },
      {
        name: 'permissionsContext',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    outputs: [
      {
        name: 'nonce',
        type: 'uint256',
        internalType: 'uint256'
      }
    ],
    stateMutability: 'view'
  }
] as const

export const getCallDataAbi = [
  {
    type: 'function',
    name: 'getCallData',
    inputs: [
      {
        name: 'smartAccount',
        type: 'address',
        internalType: 'address'
      },
      {
        name: 'executions',
        type: 'tuple[]',
        internalType: 'struct Execution[]',
        components: [
          {
            name: 'target',
            type: 'address',
            internalType: 'address'
          },
          {
            name: 'value',
            type: 'uint256',
            internalType: 'uint256'
          },
          {
            name: 'callData',
            type: 'bytes',
            internalType: 'bytes'
          }
        ]
      },
      {
        name: 'permissionsContext',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    outputs: [
      {
        name: 'callData',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    stateMutability: 'view'
  }
] as const

export const getSignatureAbi = [
  {
    type: 'function',
    name: 'getSignature',
    inputs: [
      {
        name: 'smartAccount',
        type: 'address',
        internalType: 'address'
      },
      {
        name: 'userOp',
        type: 'tuple',
        internalType: 'struct PackedUserOperation',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address'
          },
          {
            name: 'nonce',
            type: 'uint256',
            internalType: 'uint256'
          },
          {
            name: 'initCode',
            type: 'bytes',
            internalType: 'bytes'
          },
          {
            name: 'callData',
            type: 'bytes',
            internalType: 'bytes'
          },
          {
            name: 'accountGasLimits',
            type: 'bytes32',
            internalType: 'bytes32'
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
            internalType: 'uint256'
          },
          {
            name: 'gasFees',
            type: 'bytes32',
            internalType: 'bytes32'
          },
          {
            name: 'paymasterAndData',
            type: 'bytes',
            internalType: 'bytes'
          },
          {
            name: 'signature',
            type: 'bytes',
            internalType: 'bytes'
          }
        ]
      },
      {
        name: 'permissionsContext',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    outputs: [
      {
        name: 'signature',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    stateMutability: 'view'
  }
] as const
export const getDummySignatureAbi = [
  {
    type: 'function',
    name: 'getDummySignature',
    inputs: [
      {
        name: 'smartAccount',
        type: 'address',
        internalType: 'address'
      },
      {
        name: 'executions',
        type: 'tuple[]',
        internalType: 'struct Execution[]',
        components: [
          {
            name: 'target',
            type: 'address',
            internalType: 'address'
          },
          {
            name: 'value',
            type: 'uint256',
            internalType: 'uint256'
          },
          {
            name: 'callData',
            type: 'bytes',
            internalType: 'bytes'
          }
        ]
      },
      {
        name: 'permissionsContext',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    outputs: [
      {
        name: 'signature',
        type: 'bytes',
        internalType: 'bytes'
      }
    ],
    stateMutability: 'view'
  }
] as const

export function useUserOpBuilder() {
  async function getNonceWithContext(client: Client, args: UserOpBuilderGetNonceArguments) {
    const { sender, permissionsContext, userOpBuilderAddress } = args
    const publicClient = client.extend(publicActions)
    if (!userOpBuilderAddress) {
      throw new Error('no userOpBuilder address provided.')
    }

    return await publicClient.readContract({
      address: userOpBuilderAddress,
      abi: getNonceAbi,
      functionName: 'getNonce',
      args: [sender, permissionsContext]
    })
  }

  async function getCallDataWithContext(client: Client, args: UserOpBuilderGetCallDataArguments) {
    const { sender, actions, permissionsContext, userOpBuilderAddress } = args
    const publicClient = client.extend(publicActions)
    if (!userOpBuilderAddress) {
      throw new Error('no userOpBuilder address provided.')
    }

    const callDataFromUserOpBuilder = await publicClient.readContract({
      address: userOpBuilderAddress,
      abi: getCallDataAbi,
      functionName: 'getCallData',
      args: [sender, actions, permissionsContext]
    })

    return callDataFromUserOpBuilder
  }

  async function getSignatureWithContext(client: Client, args: UserOpBuilderGetSignatureArguments) {
    const { sender, permissionsContext, userOpBuilderAddress, userOperation } = args
    const publicClient = client.extend(publicActions)
    if (!userOpBuilderAddress) {
      throw new Error('no userOpBuilder address provided.')
    }

    const sig = await publicClient.readContract({
      address: userOpBuilderAddress,
      abi: getSignatureAbi,
      functionName: 'getSignature',
      args: [sender, userOperation, permissionsContext]
    })

    return sig
  }

  async function getDummySignatureWithContext(
    client: Client,
    args: UserOpBuilderGetDummySignatureArguments
  ) {
    const { sender, permissionsContext, userOpBuilderAddress, actions } = args
    const publicClient = client.extend(publicActions)
    if (!userOpBuilderAddress) {
      throw new Error('no userOpBuilder address provided.')
    }

    const sig = await publicClient.readContract({
      address: userOpBuilderAddress,
      abi: getDummySignatureAbi,
      functionName: 'getDummySignature',
      args: [sender, actions, permissionsContext]
    })

    return sig
  }

  return {
    getNonceWithContext,
    getCallDataWithContext,
    getSignatureWithContext,
    getDummySignatureWithContext
  }
}
