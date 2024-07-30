import { Stack, Card, CardHeader, Heading, CardBody, Box, StackDivider } from '@chakra-ui/react'

export default function MultiChainNoAdapters() {
  return (
    <Card marginTop={10} marginBottom={10}>
      <CardHeader>
        <Heading size="md">AppKit Basic version</Heading>
      </CardHeader>

      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading size="xs" textTransform="uppercase" pb="2">
              ⚠️ In progress
            </Heading>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
