import * as React from 'react'
import {
  StackDivider,
  Card,
  CardHeader,
  Heading,
  CardBody,
  Box,
  Stack,
  Text
} from '@chakra-ui/react'

type AppKitInfoProps = {
  caipAddress?: string
  address?: string
  chainId?: number | string
  clientId?: string | null
  heading?: string
}

export function AppKitInfo({
  caipAddress,
  address,
  chainId,
  clientId,
  heading = 'Account Information'
}: AppKitInfoProps) {
  return (
    <Card marginTop={10} marginBottom={10}>
      <CardHeader>
        <Heading size="md">{heading}</Heading>
      </CardHeader>

      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              CAIP Address
            </Heading>
            <Text data-testid="appkit-caip-address">{caipAddress}</Text>
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Address
            </Heading>
            <Text data-testid="w3m-address">{address}</Text>
          </Box>

          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              Chain Id
            </Heading>
            <Text data-testid="w3m-chain-id">{chainId}</Text>
          </Box>

          {clientId && (
            <Box>
              <Heading size="xs" textTransform="uppercase" pb="2">
                Relay Client ID
              </Heading>
              <Text data-testid="w3m-chain-id">{clientId}</Text>
            </Box>
          )}
        </Stack>
      </CardBody>
    </Card>
  )
}
