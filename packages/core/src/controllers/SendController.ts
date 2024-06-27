import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import { type Balance } from '@web3modal/common'
import { erc20ABI } from '@web3modal/common'
import { RouterController } from './RouterController.js'
import { AccountController } from './AccountController.js'
import { ConnectionController } from './ConnectionController.js'
import { SnackController } from './SnackController.js'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { EventsController } from './EventsController.js'
import { NetworkController } from './NetworkController.js'
import { W3mFrameRpcConstants } from '@web3modal/wallet'
import {
  getLinksFromTx,
  getRandomString,
  prepareDepositTxs,
  makeDepositGasless,
  makeGaslessDepositPayload,
  VAULT_CONTRACTS_WITH_EIP_3009,
  EIP3009Tokens,
  getLatestContractVersion
} from '@squirrel-labs/peanut-sdk'
import type { CaipNetwork } from '../utils/TypeUtil.js'

// -- Types --------------------------------------------- //

export interface TxParams {
  receiverAddress: string
  sendTokenAmount: number
  gasPrice: bigint
  decimals: string
}

export interface ContractWriteParams {
  receiverAddress: string
  tokenAddress: string
  sendTokenAmount: number
  decimals: string
}
export interface SendControllerState {
  token?: Balance
  sendTokenAmount?: number
  receiverAddress?: string
  receiverProfileName?: string
  receiverProfileImageUrl?: string
  gasPrice?: bigint
  gasPriceInUSD?: number
  loading: boolean
  type?: 'Address' | 'Link'
  createdLink?: string
}

type StateKey = keyof SendControllerState

// -- State --------------------------------------------- //
const state = proxy<SendControllerState>({
  loading: false
})

// -- Controller ---------------------------------------- //
export const SendController = {
  state,

  subscribe(callback: (newState: SendControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: SendControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setToken(token: SendControllerState['token']) {
    if (token) {
      state.token = ref(token)
    }
  },

  setTokenAmount(sendTokenAmount: SendControllerState['sendTokenAmount']) {
    state.sendTokenAmount = sendTokenAmount
  },

  setReceiverAddress(receiverAddress: SendControllerState['receiverAddress']) {
    state.receiverAddress = receiverAddress
  },

  setReceiverProfileImageUrl(
    receiverProfileImageUrl: SendControllerState['receiverProfileImageUrl']
  ) {
    state.receiverProfileImageUrl = receiverProfileImageUrl
  },

  setReceiverProfileName(receiverProfileName: SendControllerState['receiverProfileName']) {
    state.receiverProfileName = receiverProfileName
  },

  setGasPrice(gasPrice: SendControllerState['gasPrice']) {
    state.gasPrice = gasPrice
  },

  setGasPriceInUsd(gasPriceInUSD: SendControllerState['gasPriceInUSD']) {
    state.gasPriceInUSD = gasPriceInUSD
  },

  setLoading(loading: SendControllerState['loading']) {
    state.loading = loading
  },

  setType(type: SendControllerState['type']) {
    state.type = type
  },

  setCreatedLink(createdLink: SendControllerState['createdLink']) {
    state.createdLink = createdLink
  },

  sendToken() {
    if (this.state.token?.address && this.state.sendTokenAmount && this.state.receiverAddress) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_INITIATED',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token.address,
          amount: this.state.sendTokenAmount,
          network: NetworkController.state.caipNetwork?.id || ''
        }
      })
      this.sendERC20Token({
        receiverAddress: this.state.receiverAddress,
        tokenAddress: this.state.token.address,
        sendTokenAmount: this.state.sendTokenAmount,
        decimals: this.state.token.quantity.decimals
      })
    } else if (
      this.state.receiverAddress &&
      this.state.sendTokenAmount &&
      this.state.gasPrice &&
      this.state.token?.quantity.decimals
    ) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_INITIATED',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol,
          amount: this.state.sendTokenAmount,
          network: NetworkController.state.caipNetwork?.id || ''
        }
      })
      this.sendNativeToken({
        receiverAddress: this.state.receiverAddress,
        sendTokenAmount: this.state.sendTokenAmount,
        gasPrice: this.state.gasPrice,
        decimals: this.state.token.quantity.decimals
      })
    }
  },

  async sendNativeToken(params: TxParams) {
    RouterController.pushTransactionStack({
      view: 'Account',
      goBack: false
    })

    const to = params.receiverAddress as `0x${string}`
    const address = AccountController.state.address as `0x${string}`
    const value = ConnectionController.parseUnits(
      params.sendTokenAmount.toString(),
      Number(params.decimals)
    )
    const data = '0x'

    try {
      await ConnectionController.sendTransaction({
        to,
        address,
        data,
        value,
        gasPrice: params.gasPrice
      })
      SnackController.showSuccess('Transaction started')
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_SUCCESS',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol || '',
          amount: params.sendTokenAmount,
          network: NetworkController.state.caipNetwork?.id || ''
        }
      })
      this.resetSend()
    } catch (error) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SEND_ERROR',
        properties: {
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT,
          token: this.state.token?.symbol || '',
          amount: params.sendTokenAmount,
          network: NetworkController.state.caipNetwork?.id || ''
        }
      })
      SnackController.showError('Something went wrong')
    }
  },

  async sendERC20Token(params: ContractWriteParams) {
    RouterController.pushTransactionStack({
      view: 'Account',
      goBack: false
    })

    const amount = ConnectionController.parseUnits(
      params.sendTokenAmount.toString(),
      Number(params.decimals)
    )

    try {
      if (
        AccountController.state.address &&
        params.sendTokenAmount &&
        params.receiverAddress &&
        params.tokenAddress
      ) {
        await ConnectionController.writeContract({
          fromAddress: AccountController.state.address as `0x${string}`,
          tokenAddress: CoreHelperUtil.getPlainAddress(
            params.tokenAddress as `${string}:${string}:${string}`
          ) as `0x${string}`,
          receiverAddress: params.receiverAddress as `0x${string}`,
          tokenAmount: amount,
          method: 'transfer',
          abi: erc20ABI
        })
        SnackController.showSuccess('Transaction started')
        this.resetSend()
      }
    } catch (error) {
      SnackController.showError('Something went wrong')
    }
  },

  async generateLink() {
    const isGaslessDepositPossible = ({
      tokenAddress,
      latestContractVersion,
      chainId
    }: {
      tokenAddress: string
      latestContractVersion?: string
      chainId: string
    }) => {
      if (latestContractVersion == undefined) {
        latestContractVersion = getLatestContractVersion({
          chainId: chainId,
          type: 'normal'
        })
      }
      if (
        toLowerCaseKeys(EIP3009Tokens[chainId as keyof typeof EIP3009Tokens])[
          tokenAddress.toLowerCase()
        ] &&
        VAULT_CONTRACTS_WITH_EIP_3009.includes(latestContractVersion)
      ) {
        return true
      } else {
        return false
      }
    }

    const toLowerCaseKeys = (obj: any): any => {
      let newObj: any = {}
      if (obj) {
        Object.keys(obj).forEach(key => {
          // Convert only the top-level keys to lowercase
          let lowerCaseKey = key.toLowerCase()
          newObj[lowerCaseKey] = obj[key]
        })
      }

      return newObj
    }

    if (!this.state.token) return

    try {
      this.setLoading(true)

      const chainId = state.token?.chainId.split(':')[1]
      const address = AccountController.state.address
      const password = await getRandomString(16)
      const tokenAddress = this.state.token.address
        ? this.state.token.address.split(':')[2]
        : '0x0000000000000000000000000000000000000000'
      const tokenType = this.state.token.address ? 1 : 0

      const linkDetails = {
        chainId: chainId ?? '',
        tokenAmount: state.sendTokenAmount ?? 0,
        tokenAddress,
        tokenDecimals: Number(state.token?.quantity.decimals) ?? 18,
        trackId: 'walletconnect',
        tokenType: tokenType,
        baseUrl: 'https://profile.walletconnect.com/claim'
      }

      const network = NetworkController.state.caipNetwork
      if (network && network.id != state.token?.chainId) {
        const { approvedCaipNetworkIds, requestedCaipNetworks } = NetworkController.state

        const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(
          approvedCaipNetworkIds,
          requestedCaipNetworks
        )
        const requestedNetwork = sortedNetworks.find(
          (network: CaipNetwork) => network.id === (state.token?.chainId as `${string}:${string}`)
        )

        await NetworkController.switchActiveNetwork(requestedNetwork as CaipNetwork)
        await NetworkController.setCaipNetwork(requestedNetwork as CaipNetwork)
      }

      const isGaslessPossible = isGaslessDepositPossible({
        tokenAddress: tokenAddress ?? '',
        chainId: chainId ?? ''
      })

      let hash = ''

      if (isGaslessPossible) {
        const latestContractVersion = getLatestContractVersion({
          chainId: chainId ?? '',
          type: 'normal'
        })

        const makeGaslessDepositPayloadResponse = await makeGaslessDepositPayload({
          linkDetails: linkDetails,
          password: password,
          address: address ?? '',
          contractVersion: latestContractVersion
        })

        RouterController.pushTransactionStack({
          view: 'ApproveTransaction',
          goBack: true
        })
        const signature = await ConnectionController.signTypedData({
          domain: {
            ...makeGaslessDepositPayloadResponse.message.domain,
            chainId: Number(makeGaslessDepositPayloadResponse.message.domain.chainId),
            verifyingContract: makeGaslessDepositPayloadResponse.message.domain
              .verifyingContract as `0x${string}`
          },
          types: makeGaslessDepositPayloadResponse.message.types,
          primaryType: makeGaslessDepositPayloadResponse.message.primaryType,
          message: {
            ...makeGaslessDepositPayloadResponse.message.values,
            value: BigInt(makeGaslessDepositPayloadResponse.message.values.value),
            validAfter: BigInt(makeGaslessDepositPayloadResponse.message.values.validAfter),
            validBefore: BigInt(makeGaslessDepositPayloadResponse.message.values.validBefore)
          }
        })

        console.log(process.env['PEANUT_API_KEY'])

        const response = await makeDepositGasless({
          payload: makeGaslessDepositPayloadResponse.payload,
          signature: signature,
          APIKey: process.env['PEANUT_API_KEY'] ?? '' // TODO: add API key
        })
        hash = response.txHash
      } else {
        const preparedDepositTsx = await prepareDepositTxs({
          passwords: [password],
          address: address ?? '',
          linkDetails
        })

        let hashes: string[] = []
        for (const tx of preparedDepositTsx.unsignedTxs) {
          RouterController.pushTransactionStack({
            view: 'ApproveTransaction',
            goBack: true
          })

          const hash = await ConnectionController.sendTransaction({
            to: (tx.to ? tx.to : '') as `0x${string}`,
            value: tx.value ? BigInt(tx.value.toString()) : BigInt(0),
            data: tx.data ? (tx.data as `0x${string}`) : '0x',
            gasPrice: this.state.gasPrice
          })

          hashes.push(hash?.toString() ?? '')
        }

        hash = hashes[hashes.length - 1] ?? ''
      }

      const getLinksFromTxResponse = await getLinksFromTx({
        linkDetails,
        txHash: hash,
        passwords: [password]
      })

      this.setCreatedLink(getLinksFromTxResponse.links[0])
      SnackController.showSuccess('Link copied to clipboard!')
      CoreHelperUtil.copyToClopboard(getLinksFromTxResponse.links[0] ?? '')

      RouterController.push('Account')
      this.resetSend()
    } catch (error: any) {
      if (error.toString().includes('insufficient funds for gas * price + value')) {
        SnackController.showError('Insufficient funds for gas')
      } else if (error.toString().includes('EstimateGasExecutionError')) {
        SnackController.showError('Insufficient funds for gas')
      } else if (error.toString().includes('TransactionExecutionError')) {
        SnackController.showError('User rejected the request')
      } else {
        SnackController.showError('Something went wrong')
      }
      console.log('error', error)
    } finally {
      this.setLoading(false)
    }
  },

  resetSend() {
    state.token = undefined
    state.sendTokenAmount = undefined
    state.receiverAddress = undefined
    state.receiverProfileImageUrl = undefined
    state.receiverProfileName = undefined
    state.loading = false
    state.type = undefined
    state.createdLink = undefined
  }
}
