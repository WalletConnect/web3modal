import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { Web3ModalButtons } from '../../components/Web3ModalButtons'
import { WagmiTests } from '../../components/Wagmi/WagmiTests'
import { ThemeStore } from '../../utils/StoreUtil'
import { getWagmiConfig } from '../../utils/WagmiConstants'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { WagmiModalInfo } from '../../components/Wagmi/WagmiModalInfo'
import { AppKitAuthInfo } from '../../components/AppKitAuthInfo'
import {
  deleteProfile,
  getProfile,
  siweProfilesConfig,
  unlinkAccountFromProfile,
  updateMainAccount
} from '../../utils/ProfilesUtil'
import { useProxy } from 'valtio/utils'
import { ProfileStore } from '../../utils/ProfileStoreUtil'
import { Button, Card, CardBody, CardHeader, Flex, Heading, Text } from '@chakra-ui/react'
import { IoRefresh } from 'react-icons/io5'

const queryClient = new QueryClient()

const wagmiConfig = getWagmiConfig('default')

const modal = createWeb3Modal({
  wagmiConfig,
  projectId: ConstantsUtil.ProjectId,
  enableAnalytics: true,
  metadata: ConstantsUtil.Metadata,
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy',
  customWallets: ConstantsUtil.CustomWallets,
  siweConfig: siweProfilesConfig(wagmiConfig)
})

ThemeStore.setModal(modal)

export default function WagmiProfiles() {
  const { profile } = useProxy(ProfileStore.state)

  async function fetchProfile() {
    const profileRes = await getProfile()
    ProfileStore.setProfile(profileRes)
  }

  async function handleUnlinkAccount(accountUuid: string) {
    const { success } = await unlinkAccountFromProfile(accountUuid)
    if (success) {
      const updatedProfile = profile?.filter(({ uuid }) => uuid !== accountUuid)
      ProfileStore.setProfile(updatedProfile)
    }
  }

  async function handleUpdateMainAccount(accountUuid: string) {
    const { success } = await updateMainAccount(accountUuid)
    if (success) {
      const updatedProfile = profile?.map(({ uuid, ...rest }) => ({
        ...rest,
        uuid,
        is_main_account: uuid === accountUuid
      }))
      ProfileStore.setProfile(updatedProfile)
    }
  }

  async function handleDeleteProfile() {
    const { success } = await deleteProfile()
    if (success) {
      ProfileStore.setProfile(null)
    }
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3ModalButtons />
        <WagmiModalInfo />
        <AppKitAuthInfo />
        <Card>
          <CardHeader as={Flex} justifyContent="space-between">
            <Heading size="md">Profile</Heading>
            <Button leftIcon={<IoRefresh />} onClick={fetchProfile}>
              Get Profile
            </Button>
          </CardHeader>
          <CardBody as={Flex} flexDir="column" gap={4}>
            {profile?.map(({ account, is_main_account, uuid }) => {
              const [, chainId, address] = account.split(':')

              return (
                <Flex
                  flexDir="column"
                  key={account}
                  justifyContent="flex-start"
                  border="solid 2px white"
                  rounded="md"
                  padding="5px"
                >
                  <Text>
                    <strong>Chain ID:</strong> {chainId}
                  </Text>
                  <Text>
                    <strong>Address:</strong> {address}
                  </Text>
                  <Text>
                    <strong>Main account:</strong> {is_main_account.toString()}
                  </Text>
                  <Flex flexDir="column" gap={4}>
                    <Button onClick={() => handleUnlinkAccount(uuid)}>Unlink</Button>
                    <Button onClick={() => handleUpdateMainAccount(uuid)}>Set as main</Button>
                    <Button colorScheme="red" onClick={() => handleDeleteProfile()}>
                      Delete profile
                    </Button>
                  </Flex>
                </Flex>
              )
            })}
          </CardBody>
        </Card>

        <WagmiTests />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
