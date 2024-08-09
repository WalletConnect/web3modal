import {
  CoreHelperUtil,
  AccountController,
  ConstantsUtil,
  OnRampController,
  type OnRampProvider,
  RouterController,
  NetworkController,
  BlockchainApiController,
  EventsController,
  ChainController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import type { CoinbasePaySDKChainNameValues } from '@web3modal/core/src/utils/ConstantsUtil'
import { W3mFrameRpcConstants } from '@web3modal/wallet'

@customElement('w3m-onramp-providers-view')
export class W3mOnRampProvidersView extends LitElement {
  private unsubscribe: (() => void)[] = []

  @state() private providers: OnRampProvider[] = OnRampController.state.providers

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        OnRampController.subscribeKey('providers', val => {
          this.providers = val
        })
      ]
    )
  }

  public override firstUpdated(): void {
    const urlPromises = this.providers.map(async provider => {
      if (provider.name === 'coinbase') {
        return await this.getCoinbaseOnRampURL()
      }

      return Promise.resolve(provider?.url)
    })

    Promise.all(urlPromises).then(urls => {
      this.providers = this.providers.map((provider, index) => ({
        ...provider,
        url: urls[index] || ''
      }))
    })
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" .padding=${['0', 's', 's', 's']} gap="xs">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
      <w3m-onramp-providers-footer></w3m-onramp-providers-footer>
    `
  }

  // -- Private ------------------------------------------- //
  private onRampProvidersTemplate() {
    return this.providers
      .filter(provider =>
        provider.supportedChains.includes(ChainController.state.activeChain ?? 'evm')
      )
      .map(
        provider => html`
          <w3m-onramp-provider-item
            label=${provider.label}
            name=${provider.name}
            feeRange=${provider.feeRange}
            @click=${() => {
              this.onClickProvider(provider)
            }}
            ?disabled=${!provider.url}
          ></w3m-onramp-provider-item>
        `
      )
  }

  private onClickProvider(provider: OnRampProvider) {
    OnRampController.setSelectedProvider(provider)
    RouterController.push('BuyInProgress')
    CoreHelperUtil.openHref(provider.url, 'popupWindow', 'width=600,height=800,scrollbars=yes')
    EventsController.sendEvent({
      type: 'track',
      event: 'SELECT_BUY_PROVIDER',
      properties: {
        provider: provider.name,
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
  }

  private async getCoinbaseOnRampURL() {
    const address = AccountController.state.address
    const network = NetworkController.state.caipNetwork

    if (!address) {
      throw new Error('No address found')
    }

    if (!network?.name) {
      throw new Error('No network found')
    }

    const defaultNetwork =
      ConstantsUtil.WC_COINBASE_PAY_SDK_CHAIN_NAME_MAP[
        network.name as CoinbasePaySDKChainNameValues
      ] ?? ConstantsUtil.WC_COINBASE_PAY_SDK_FALLBACK_CHAIN

    const purchaseCurrency = OnRampController.state.purchaseCurrency
    const assets = purchaseCurrency
      ? [purchaseCurrency.symbol]
      : OnRampController.state.purchaseCurrencies.map(currency => currency.symbol)

    return await BlockchainApiController.generateOnRampURL({
      defaultNetwork,
      destinationWallets: [
        { address, blockchains: ConstantsUtil.WC_COINBASE_PAY_SDK_CHAINS, assets }
      ],
      partnerUserId: address,
      purchaseAmount: OnRampController.state.purchaseAmount
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-onramp-providers-view': W3mOnRampProvidersView
  }
}
