import {
  Image,
  Stack,
  HStack,
  Button,
  Spacer,
  Link as CLink,
  useDisclosure
} from '@chakra-ui/react'
import Link from 'next/link'
import { IoSettingsOutline } from 'react-icons/io5'
import { OptionsDrawer } from './OptionsDrawer'
import { CustomWallet } from './CustomWallet'
import { DownloadIcon } from '@chakra-ui/icons'
import { useChakraToast } from '../components/Toast'

type WindowWithLogs = typeof Window & {
  downloadLogsBlobInBrowser?: () => void
  downloadAppKitLogsBlob: Record<string, () => void>
}

export function LayoutHeader() {
  const controls = useDisclosure()
  const controlsCW = useDisclosure({ id: 'customWallet' })
  const toast = useChakraToast()

  return (
    <>
      <Stack direction={['column', 'column', 'row']} marginBlockStart={10} justifyContent="center">
        <Link href="/">
          <Image src="/logo.png" width={200} />
        </Link>

        <Spacer />

        <HStack spacing={5} marginRight={[0, 0, 5]} marginTop={[3, 3, 0]} marginBottom={[3, 3, 0]}>
          <CLink isExternal href="https://github.com/WalletConnect/web3modal">
            GitHub
          </CLink>
          <CLink isExternal href="https://gallery.web3modal.com">
            Gallery
          </CLink>
          <CLink isExternal href="https://docs.walletconnect.com/web3modal/about">
            Docs
          </CLink>
        </HStack>

        <Button rightIcon={<IoSettingsOutline />} onClick={controlsCW.onOpen}>
          Custom Wallet
        </Button>
        <Button rightIcon={<IoSettingsOutline />} onClick={controls.onOpen}>
          Options
        </Button>
        <Button
          rightIcon={<DownloadIcon />}
          onClick={() => {
            const logWindow = window as unknown as WindowWithLogs
            logWindow.downloadLogsBlobInBrowser?.()
            logWindow.downloadAppKitLogsBlob?.['sdk']?.()
            toast({
              title: 'Logs downloaded',
              description:
                'To get logs for secure site too, switch to it in developer console and run `window.downloadLogsBlobInBrowser()`',
              type: 'success'
            })
          }}
        >
          Logs
        </Button>
      </Stack>

      <OptionsDrawer controls={controls} />
      <CustomWallet controls={controlsCW} />
    </>
  )
}
