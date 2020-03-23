import React, { FunctionComponent, useCallback } from 'react'
import { resolveImage } from '../../lib/resolveImage'
import dynamic from 'next/dynamic'

import { useCart } from './useCart'
import useNetworkStatus from '../../hooks/useNetworkStatus'

import { useRouter } from 'next/router'
import Link from '../Link'
import Button from '@pmet-public/luma-ui/dist/components/Button'
import CartTemplate from '@pmet-public/luma-ui/dist/templates/Cart'
import Head from '../Head'

const CartLanding = dynamic(() => import('@pmet-public/luma-ui/dist/templates/CartLanding'))
const Error = dynamic(() => import('../Error'))

type CartProps = {}

export const Cart: FunctionComponent<CartProps> = () => {
    const history = useRouter()

    const { loading, updating, removing, data, api, applyingCoupon, removingCoupon, couponError } = useCart()

    const handleGoToCheckout = useCallback(async () => {
        history.push('/checkout')
    }, [history])

    const online = useNetworkStatus()

    if (!online && !data) return <Error type="Offline" />

    if (!loading && !data) return <Error type="500" />

    const { store, cart } = data

    const { items = [], appliedCoupons } = cart || {}

    const productUrlSuffix = store?.productUrlSuffix ?? ''

    if (!cart?.totalQuantity) {
        return (
            <CartLanding
                title={{ text: 'Shopping Bag' }}
                children={
                    <div>
                        <Button as={Link} href="/" style={{ marginTop: '2rem' }}>
                            Get Shopping
                        </Button>
                    </div>
                }
            />
        )
    }

    return (
        <React.Fragment>
            <Head title="Shopping Bag" />

            <CartTemplate
                loading={loading && !cart}
                breadcrumbs={{
                    loading: false,
                    prefix: '#',
                    items: [{ text: 'Shopping Bag', as: Link, href: '/cart' }],
                }}
                list={{
                    loading: loading && !cart?.totalQuantity,
                    items: items.map(({ id, quantity, price, product, options }: any, index: number) => ({
                        _id: id || index,
                        title: {
                            as: Link,
                            urlResolver: {
                                type: 'PRODUCT',
                                urlKey: product.urlKey,
                            },
                            href: `/${product.urlKey}${productUrlSuffix}`,
                            text: product.name,
                        },
                        sku: `SKU. ${product.sku}`,
                        thumbnail: {
                            as: Link,
                            urlResolver: {
                                type: 'PRODUCT',
                                urlKey: product.urlKey,
                            },
                            href: `/${product.urlKey}${productUrlSuffix}`,
                            alt: product.thumbnail.label,
                            src: resolveImage(product.thumbnail.url, { width: 300 }),
                        },
                        quantity: {
                            value: quantity,
                            addLabel: `Add another ${product.name} from shopping bag`,
                            substractLabel: `Remove one ${product.name} from shopping bag`,
                            removeLabel: `Remove all ${product.name} from shopping bag`,
                            onUpdate: (quantity: number) => api.updateCartItem({ productId: id, quantity }),
                            onRemove: () => api.removeCartItem({ productId: id }),
                        },
                        price: {
                            currency: price.amount.currency,
                            regular: price.amount.value,
                        },
                        options: options?.map(({ id, label, value }: any) => ({
                            _id: id,
                            label,
                            value,
                        })),
                    })),
                }}
                summary={{
                    title: {
                        text: 'Bag Summary',
                    },
                    coupons: {
                        label: 'Apply Coupons',
                        open: !!appliedCoupons,
                        items: [
                            {
                                field: {
                                    label: 'Coupon Code',
                                    name: 'couponCode',
                                    error: couponError,
                                    disabled: !!appliedCoupons,
                                    defaultValue: appliedCoupons ? appliedCoupons[0].code : undefined,
                                },
                                submitButton: {
                                    text: appliedCoupons ? 'Remove' : 'Apply',
                                    type: appliedCoupons ? 'reset' : 'submit',
                                },
                                submitting: applyingCoupon || removingCoupon,
                                onReset: () => {
                                    api.removeCoupon()
                                },
                                onSubmit: (values: any) => {
                                    const { couponCode } = values
                                    api.applyCoupon({ couponCode })
                                },
                            },
                        ],
                    },
                    prices: [
                        // Sub-total
                        {
                            label: 'Subtotal',
                            price: cart?.prices?.subTotal && {
                                currency: cart.prices.subTotal.currency,
                                regular: cart.prices.subTotal.value,
                            },
                        },

                        // Discounts
                        ...(cart?.prices?.discounts?.map((discount: any) => ({
                            label: discount.label,
                            price: {
                                currency: discount.amount.currency,
                                regular: -discount.amount.value,
                            },
                        })) || []),

                        // Shipping
                        ...(cart?.shippingAddresses
                            ?.filter(({ selectedShippingMethod }: any) => !!selectedShippingMethod)
                            .map(({ selectedShippingMethod }: any) => ({
                                label: `${selectedShippingMethod.carrierTitle} (${selectedShippingMethod.methodTitle})`,
                                price: {
                                    currency: selectedShippingMethod.amount.currency,
                                    regular: selectedShippingMethod.amount.value,
                                },
                            })) || []),

                        // Taxes
                        {
                            label: 'Estimated Taxes',
                            price: cart?.prices?.taxes[0] && {
                                currency: cart.prices.taxes[0] && cart.prices.taxes[0].currency,
                                regular: cart.prices.taxes.reduce(
                                    (accum: number, tax: { value: number }) => accum + tax.value,
                                    0
                                ),
                            },
                        },

                        // Total
                        {
                            appearance: 'bold',
                            label: 'Total',
                            price: cart?.prices?.total && {
                                currency: cart.prices.total.currency,
                                regular: cart.prices.total.value,
                            },
                        },
                    ],
                }}
                button={{
                    linkTagAs: 'button',
                    onClick: handleGoToCheckout,
                    disabled: items.length === 0,
                    text: 'Checkout',
                    loading: updating || removing,
                }}
            />
        </React.Fragment>
    )
}
