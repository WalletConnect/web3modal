import { Html, Head, Main, NextScript } from 'next/document'
import { ColorModeScript } from '@chakra-ui/react'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </Head>
      <body>
        <ColorModeScript initialColorMode="system" />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
