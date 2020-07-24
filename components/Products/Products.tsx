import React, { FunctionComponent, useState, useRef } from 'react'
import { resolveImage } from '~/lib/resolveImage'
import { Root, Wrapper, ProductListWrapper } from './Products.styled'
import Link from '~/components/Link'
import { useQuery } from '@apollo/client'
import ProductList from '@storystore/ui/dist/components/ProductList'
import { FilterVariables } from '~/components/Filters'
import { useFetchMoreOnScrolling } from '@storystore/ui/dist/hooks/useFetchMoreOnScrolling'
import { PRODUCTS_QUERY } from '.'

export type ProductsProps = {
    search?: string
    filters?: FilterVariables
}

export const Products: FunctionComponent<ProductsProps> = ({ search, filters = {} }) => {
    const [fetchingMore, setFetchingMore] = useState(false)

    const { data, loading, fetchMore } = useQuery(PRODUCTS_QUERY, {
        variables: { search, filters },
    })

    const { pagination, items } = data?.products ?? {}

    const productUrlSuffix = data?.store?.productUrlSuffix || ''

    /**
     * Infinite Scroll
     */
    const productListRef = useRef<HTMLDivElement>(null)

    useFetchMoreOnScrolling(
        () => {
            setFetchingMore(true)

            fetchMore({
                variables: {
                    currentPage: pagination.current + 1, // next page
                },
                updateQuery: (prev: any, { fetchMoreResult }) => {
                    if (!fetchMoreResult) return prev
                    return {
                        ...prev,
                        products: {
                            ...prev.products,
                            ...fetchMoreResult.products,
                            items: [...prev.products.items, ...fetchMoreResult.products.items],
                        },
                    }
                },
            })
                .catch(() => {})
                .then(() => {
                    setFetchingMore(false)
                })
        },
        {
            disabled: loading || fetchingMore || !(pagination && pagination.current < pagination.total),
            threshold: 400,
            contentRef: productListRef,
        }
    )

    return (
        <Root>
            <Wrapper>
                <ProductListWrapper $margin ref={productListRef}>
                    <ProductList
                        loadingMore={loading || fetchingMore}
                        items={items
                            ?.filter((x: any) => x !== null) // patches results returning nulls. I'm looking at you Gift Cards
                            .map(({ id, image, price, title, urlKey, options }: any, index: number) => ({
                                _id: `${id}--${index}`,
                                as: Link,
                                href: `/${urlKey + productUrlSuffix}`,
                                urlResolver: {
                                    type: 'PRODUCT',
                                    id,
                                    urlKey,
                                },
                                image: {
                                    alt: image.alt,
                                    src: {
                                        desktop: resolveImage(image.src, { width: 1260 }),
                                        mobile: resolveImage(image.src, { width: 960 }),
                                    },
                                    width: 1274,
                                    height: 1580,
                                },
                                price: {
                                    label: price.maximum.regular.value > price.minimum.regular.value ? 'Starting at' : undefined,
                                    regular: price.minimum.regular.value,
                                    special: price.minimum.discount.amountOff && price.minimum.final.value - price.minimum.discount.amountOff,
                                    currency: price.minimum.regular.currency,
                                },
                                title: {
                                    text: title,
                                },
                                colors: options
                                    ?.find(({ items }: any) => !!items.find(({ swatch }: any) => swatch?.__typename === 'ColorSwatchData'))
                                    ?.items.map(({ label, swatch }: any) => ({ label, value: swatch.value })),
                            }))}
                    />
                </ProductListWrapper>
            </Wrapper>
        </Root>
    )
}
