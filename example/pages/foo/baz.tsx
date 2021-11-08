import Head from 'next/head'
import Image from 'next/image'
import { FC } from 'react'
import { cookieReset, cookieSet } from '../../utils/cookie-control'
import { useRouter } from 'next/router'
import { Button, Text, Grid, Page, Link, Spacer } from '@geist-ui/react'
import NextLink from 'next/link'

const FooBar: FC = () => {
  const router = useRouter()
  return (
    <Page width="800px" padding={0}>
      <Head>
        <title>original | next-with-split</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Page.Content padding={1}>
        <Text h1 font="32px">
          This is Original Page BAZ
        </Text>
        <Grid.Container gap={1}>
          <Grid>
            <Button
              ghost
              auto
              type="secondary"
              scale={0.8}
              onClick={() => {
                cookieSet('test1', 'original')
                router.reload()
              }}
            >
              Original
            </Button>
          </Grid>
          <Grid>
            <Button
              ghost
              auto
              type="error"
              scale={0.8}
              onClick={() => {
                cookieSet('test1', 'challenger1')
                router.reload()
              }}
            >
              Challenger
            </Button>
          </Grid>
          <Grid>
            <Button
              auto
              type="secondary"
              scale={0.8}
              onClick={() => {
                cookieReset('test1')
                router.reload()
              }}
            >
              Reset Sticky
            </Button>
          </Grid>
        </Grid.Container>
        <Spacer />

        <NextLink href="/foo/bar">
          <Link color block>
            Go /foo/bar
          </Link>
        </NextLink>
      </Page.Content>

      <Page.Footer>
        <Grid.Container justify="center">
          <Grid xs={24} height="50px">
            <div style={{ textAlign: 'center', width: '100%' }}>
              <a
                href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'black' }}
              >
                Powered by{' '}
                <Image
                  src="/vercel.svg"
                  alt="Vercel Logo"
                  width={72}
                  height={16}
                />
              </a>
            </div>
          </Grid>
        </Grid.Container>
      </Page.Footer>
    </Page>
  )
}

export default FooBar
