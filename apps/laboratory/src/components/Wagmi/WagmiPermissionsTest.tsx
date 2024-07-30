import { Box, Card, CardBody, CardHeader, Heading, Stack, StackDivider } from '@chakra-ui/react'
import { WagmiRequestPermissionsTest } from './WagmiRequestPermissionsTest'
import { WagmiPurchaseDonutWithPermissionsTest } from './WagmiPurchaseDonutPermissionsTest'
import { WagmiCreatePasskeySignerTest } from './WagmiCreatePasskeySignerTest'

export function WagmiPermissionsTest() {
  return (
    <Card marginTop={10} marginBottom={10}>
      <CardHeader>
        <Heading size="md">Test Interactions</Heading>
      </CardHeader>
      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              New Passkey
            </Heading>
            <WagmiCreatePasskeySignerTest />
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Request Permissions
            </Heading>
            <WagmiRequestPermissionsTest />
          </Box>
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Purchase Donut With Permissions
            </Heading>
            <WagmiPurchaseDonutWithPermissionsTest />
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
