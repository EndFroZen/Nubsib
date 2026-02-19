import '../styles/globals.css'
import { NextUIProvider } from "@nextui-org/react";
import 'github-markdown-css/github-markdown.css'
export default function App({ Component, pageProps }) {
  return (
    <NextUIProvider>
      <Component {...pageProps} />
    </NextUIProvider>
  )
}
