import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import StyleFinder from '../components/StyleFinder'

export default function StyleFinderPage() {
  return (
    <>
      <Head>
        <title>استایل فایندر</title>
      </Head>
      <Header />
      <main className="container py-12">
        <StyleFinder />
      </main>
      <Footer />
    </>
  )
}
