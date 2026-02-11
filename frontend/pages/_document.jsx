import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="th" style={{ backgroundColor: '#F3F3F3' }}>
      <title>PS OFFICE SSW</title>
      <link rel="shortcut icon" href="../img/ssw_logo.png" />
      <Head>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />

        <link href='https://fonts.googleapis.com/css?family=Kanit:400,300&subset=thai,latin' rel='stylesheet' type='text/css' />
        <link href="https://fonts.googleapis.com/css2?family=Niramit&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Niramit&family=Sarabun&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
