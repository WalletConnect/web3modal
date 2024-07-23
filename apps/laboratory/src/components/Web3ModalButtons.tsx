import { Stack, Card, CardHeader, Heading, CardBody, Box, StackDivider } from '@chakra-ui/react'

export function Web3ModalButtons() {
  return (
    <Card marginTop={20}>
      <CardHeader>
        <Heading size="md">Web3Modal Interactions</Heading>
      </CardHeader>

      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Select / Paymaster Token
            </Heading>
            <w3m-payment-token-button />
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Connect / Account Button
            </Heading>
            <w3m-button />
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Network Button
            </Heading>
            <w3m-network-button />
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
