import { useAddress, useDisconnect, useMetamask, useNFTDrop } from "@thirdweb-dev/react";
import type {GetServerSideProps} from 'next'
import Link from "next/link";
import { sanityClient, urlFor } from '../../sanity'
import { Collection } from '../../typings'
import { useEffect, useState } from 'react'
import { BigNumber } from 'ethers'
import toast, { Toaster } from 'react-hot-toast'

interface Props {
    collection: Collection
}

function NFTDropPage({ collection }: Props) {
    const [claimedSupply, setClaimedSupply] = useState<number>(0)  
    const [totalSupply, setTotalSupply] = useState<BigNumber>()
    const [loading, setLoading] = useState<boolean>(true)
    const nftDrop = useNFTDrop(collection.address)
    const [priceInEth, setPriceInEth] = useState<string>()

    // Auth
    const connectWithMetamask = useMetamask()
    const address = useAddress()
    const disconnect = useDisconnect()
    // ---

    useEffect(() => {
        if (!nftDrop) return
        const fetchPrice = async () => {
            const claimConditions = await nftDrop.claimConditions.getAll()

            setPriceInEth(claimConditions?.[0].currencyMetadata.displayValue)
        }   
        fetchPrice()
    }, [nftDrop])

    useEffect(() => {
    if (!nftDrop) return

    const fetchNFTDropData = async () => {
        const claimed = await nftDrop.getAllClaimed()
        const total = await nftDrop.totalSupply()
        setLoading(true)

        setClaimedSupply(claimed.length)
        setTotalSupply(total)

        setLoading(false)
    }

    fetchNFTDropData()
    }, [nftDrop])

    const mintNft = () => {
        if (!nftDrop || !address) return

        const quantity = 1; // how many unique nfts you want to claim
        
        setLoading(true)
        const notification = toast.loading('Minting NFT...', {
            style: {
                background: 'white',
                color: 'green',
                fontWeight: 'bolder',
                fontSize: '17px',
                padding: '20px'

            }
        })

        nftDrop?.claimTo(address, quantity).then(async (tx) => {
            const receipt = tx[0].receipt // the transaction receipt
            const claimedTokenId = tx[0].id // the id of the nft claimed
            const claimedNFT = await tx[0].data() // (optional) get the claimed NFT metadata

            toast('Congratulations.. You have successfully Minted your NFT!', {
                duration: 8000,
                style: {
                    background: 'green',
                    color: 'white',
                    fontWeight: 'bolder',
                    fontSize: '17px',
                    padding: '20px'
                }
            })


        }).catch(err => {
            console.log(err)
            toast('Whoops... Something went wrong!', {
                style: {
                    background: 'red',
                    color: 'white',
                    fontWeight: 'bolder',
                    fontSize: '17px',
                    padding: '20px'
                }
            })
        }).finally(() => {
            setLoading(false)
            toast.dismiss(notification)
        })
    }

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
        <Toaster position="bottom-center"/>
        {/* Left */}
        <div className="bg-gradient-to-br from-amber-800 to-purple-500 lg:col-span-4">
            <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
                <div className="bg-gradient-to-br from-blue-600 to-red-600 p-2 rounded-xl">
                    <img className="w-44 rounded-xl object-cover lg:h-96 lg:w-72" src={urlFor(collection.previewImage).url()} alt="" />
                </div>
                <div className="text-center p-5 space-y-2">
                    <h1 className="text-4xl font-bold text-white">
                        {collection.nftCollectionName}
                    </h1>
                    <h2 className="text-xl text-gray-300">
                        {collection.description}
                    </h2>
                </div>
            </div>
        </div>
        {/* Right */}
        <div className="flex flex-1 flex-col p-12 lg:col-span-6 bg-slate-700">
            {/* Header */}
            <header className="flex items-center justify-between text-slate-400">
                <Link href={'/'}>
                    <h1 className="w-52  cursor-pointer text-xl font-extralight sm:w-80">
                        The {' '} 
                        <span className="font-extrabold underline decoration-4 decoration-purple-500/40">
                            SocialMeaps
                        </span> {' '}
                        NFT Market Place
                    </h1>
                </Link>
                
                <button onClick={() => address ? disconnect() : connectWithMetamask()} className="rounded-full bg-amber-600 text-slate-200 px-4 py-2 text-xs font-bold lg:px-5 lg:py-3 lg:text-base">
                   { address ? 'Sign Out' : 'Sign In'}
                </button>
            </header>

            <hr className="my-2"/>

            {address && (
                <p className=" text-center text-sm text-rose-400">  
                 You're Logged in with wallet {address.substring(0, 5)}...{address.substring(address.length - 5)}  
                </p>
            )}

            {/* Content */}
                <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:justify-center">
                    <img className="w-80 object-cover pb-10 lg:h-40" src={urlFor(collection.mainImage).url()} alt="" />
                    <h1 className="text-3xl font-bold lg:text-5xl font-extrabold">{collection.title} </h1>
                    {loading ? (
                         <p className="pt-2 text-xl text-green-600 animate-pulse">
                             Loading Supply Count...
                         </p>
                    ) : (
                        <p className="pt-2 text-xl text-green-600"> {claimedSupply} / {totalSupply?.toString()} NFT's claimed</p>
                    )}
                    {loading && (
                        <img className="h-80 w-80 object-contain"src=" https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif" alt="" />
                    )}
                </div>
            {/* Button */}
            <button disabled={loading || claimedSupply === totalSupply?.toNumber() || !address} 
            onClick={mintNft}
            className="mt-10 h-16 w-full rounded-full bg-amber-600 font-bold text-white disabled:bg-gray-500">
                {loading ? (
                    <>Loading</>
                ) : claimedSupply === totalSupply?.toNumber() ? (
                    <>Sold Out</>
                ) : !address ? (
                    <>Sign In to Mint</>
                ) : (
                    <span className="font-bold">Mint NFT ({priceInEth}) ETH</span>
                )}
                
            </button>
        </div>

    </div>
  )
}

export default NFTDropPage

export const getServerSideProps: GetServerSideProps = async ({params}) => {
    const query = `*[_type == "collection" && slug.current == $id][0]{
        _id,
        title,
        address,
        description,
        nftCollectionName,
        mainImage {
            asset
        },
        previewImage {
            asset
        },
        slug {
            current
        },
        creator-> {
            _id,
            name,
            address,
            slug {
                current
            },
        },
    }`

    const collection = await sanityClient.fetch(query, {
        id: params?.id 
    })

    if (!collection) {
        return {
            notFound: true
        }
    }

    return {
        props: {
            collection
        } 
    }
}