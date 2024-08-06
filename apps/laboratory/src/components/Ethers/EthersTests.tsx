import * as React from 'react'
import { useWeb3ModalAccount } from '@web3modal/ethers/react'
import { EthersSignMessageTest } from './EthersSignMessageTest'
import { EthersSignTypedDataTest } from './EthersSignTypedDataTest'
import { StackDivider, Card, CardHeader, Heading, CardBody, Box, Stack } from '@chakra-ui/react'
import { EthersTransactionTest } from './EthersTransactionTest'
import { EthersWriteContractTest } from './EthersWriteContractTest'
import { EthersSendCallsTest } from './EthersSendCallsTest'
import { EthersGetCallsStatusTest } from './EthersGetCallsStatusTest'
import { EthersSendCallsWithPaymasterServiceTest } from './EthersSendCallsWithPaymasterServiceTest'

export function EthersTests() {
  const [ready, setReady] = React.useState(false)
  const [callsHash, setCallsHash] = React.useState<string>('')
  const { isConnected } = useWeb3ModalAccount()

  const onCallsHash = React.useCallback((hash: string) => {
    setCallsHash(hash)
  }, [])

  React.useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return null
  }

  return isConnected ? (
    <Card marginTop={10} marginBottom={10}>
      <CardHeader>
        <Heading size="md">Test Interactions</Heading>
      </CardHeader>

      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Sign Message
            </Heading>
            <EthersSignMessageTest />
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Sign Typed Data
            </Heading>
            <EthersSignTypedDataTest />
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Sign Transaction
            </Heading>
            <EthersTransactionTest />
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Contract Write
            </Heading>
            <EthersWriteContractTest />
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Send Calls (Atomic Batch)
            </Heading>
            <EthersSendCallsTest onCallsHash={onCallsHash} />
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Get Calls Status
            </Heading>
            <EthersGetCallsStatusTest callsHash={callsHash} />
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Send Calls (Paymaster Service)
            </Heading>
            <EthersSendCallsWithPaymasterServiceTest />
          </Box>
        </Stack>
      </CardBody>
    </Card>
  ) : null
}
