import React, { FunctionComponent, useCallback, ChangeEvent, useState, useEffect } from 'react'
import { useCheckout } from './useCheckout'
import CheckoutTemplate from 'luma-ui/dist/templates/Checkout'
import ViewLoader from 'luma-ui/dist/components/ViewLoader'
import Error from 'next/error'
import DocumentMetadata from '../DocumentMetadata'
import { useRouter } from 'next/router'

type CheckoutProps = {}

export const Checkout: FunctionComponent<CheckoutProps> = ({}) => {
    const { loading, error, data, api } = useCheckout()

    const router = useRouter()

    const [step, setStep] = useState<1 | 2 | 3>(1)

    /**
     * Redirect to Shopping Cart if empty
     */
    useEffect(() => {
        if (data && data.cart && data.cart.items.length === 0) router.push('/cart')
    }, [data && data.cart])

    /**
     * Get Available Regiouns per country selected
     */
    const handleSelectedCountry = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            const { options } = event.currentTarget
            const { value } = options[options.selectedIndex]
            api.getAvailableRegions({ countryCode: value })
        },
        [api.getAvailableRegions]
    )

    /**
     * Contact Information
     */

    const handleSetContactInformation = useCallback(
        async formData => {
            const {
                email,
                city,
                company,
                country,
                firstName,
                lastName,
                postalCode,
                region,
                street,
                phone,
                saveInAddressBook = false,
            } = formData

            await api.setContactInfo({
                email,
                city,
                company,
                country,
                firstName,
                lastName,
                postalCode,
                region,
                street,
                phone,
                saveInAddressBook,
            })

            setStep(2)
        },
        [api.setContactInfo]
    )

    /**
     * Shipping Method
     */
    const handleSetShippingMethod = useCallback(
        async formData => {
            const { shippingMethod: methodCode } = formData

            await api.setShippingMethod({ methodCode })

            setStep(3)
        },
        [api.setShippingMethod]
    )

    const handleSetPaymentMethodAndOrder = useCallback(
        async formData => {
            const { nonce } = formData
            const { data } = await api.setPaymentMethodAndOrder({ nonce })

            router.push(`/checkout/confirmation?order=${data.payment.order.id}`)
        },
        [api.setPaymentMethodAndOrder]
    )

    if (loading) {
        return <ViewLoader />
    }

    if (error) {
        console.error(error.message)
        return <Error statusCode={500} />
    }

    const { cart, countries, availableRegions } = data
    const { email, shippingAddresses, braintreeToken } = cart
    const [shippingAddress] = shippingAddresses

    // TODO: Regions
    console.log({ availableRegions })

    return (
        <React.Fragment>
            <DocumentMetadata title="Checkout" />
            <CheckoutTemplate
                step={step}
                contactInfo={{
                    edit: step < 2,
                    fields: {
                        email: {
                            label: 'Email',
                            defaultValue: email,
                        },
                        firstName: {
                            label: 'First Name',
                            defaultValue: shippingAddress.firstName,
                        },
                        lastName: {
                            label: 'Last Name',
                            defaultValue: shippingAddress.lastName,
                        },
                        company: {
                            label: 'Company (optional)',
                            defaultValue: shippingAddress.company,
                        },
                        address1: {
                            label: 'Address',
                            defaultValue: shippingAddress.street[0],
                        },
                        address2: {
                            label: 'Apt, Suite, Unit, etc (optional)',
                            defaultValue: shippingAddress.street[1],
                        },
                        city: {
                            label: 'City',
                            defaultValue: shippingAddress.city,
                        },
                        country: {
                            label: 'Country',
                            defaultValue: shippingAddress.country.code || 'US',
                            onChange: handleSelectedCountry,
                            items: countries.map((country: { name: string; code: string }) => ({
                                text: country.name,
                                value: country.code,
                            })),
                        },
                        region: {
                            label: 'State',
                            defaultValue: shippingAddress.region.code,
                        },
                        postalCode: {
                            label: 'Postal Code',
                            defaultValue: shippingAddress.postalCode,
                        },
                        phone: {
                            label: 'Phone Number',
                            defaultValue: shippingAddress.phone,
                        },
                    },
                    editButton: {
                        text: 'Edit',
                    },
                    submitButton: {
                        text: 'Continue to Shipping',
                    },
                    onEdit: () => setStep(1),
                    onSubmit: handleSetContactInformation,
                }}
                shippingMethod={{
                    edit: step < 3,
                    items: shippingAddress.availableShippingMethods.map(
                        ({ methodTitle, methodCode, available, amount }: any) => ({
                            text: `${methodTitle} ${amount.value.toLocaleString('en-US', {
                                style: 'currency',
                                currency: amount.currency,
                            })}`,
                            value: methodCode,
                            defaultChecked: methodCode === shippingAddress.selectedShippingMethod.methodCode,
                            disabled: !available,
                        })
                    ),
                    editButton: {
                        text: 'Edit',
                    },
                    submitButton: {
                        text: 'Continue to Payment',
                    },
                    onEdit: () => setStep(2),
                    onSubmit: handleSetShippingMethod,
                }}
                paymentMethod={{
                    braintree: {
                        authorization: braintreeToken,
                        vaultManager: true,
                        preselectVaultedPaymentMethod: true,
                        card: {
                            overrides: {
                                fields: {
                                    number: {
                                        maskInput: {
                                            showLastFour: true, // Only show last four digits on blur.
                                        },
                                    },
                                },
                            },
                        },
                    },
                    submitButton: {
                        text: 'Place Order',
                    },
                    onSubmit: handleSetPaymentMethodAndOrder,
                }}
                list={{
                    items:
                        cart.items &&
                        cart.items.map(({ id, quantity, product, options }: any, index: number) => ({
                            _id: id || index,
                            title: {
                                text: product.name,
                            },
                            sku: `SKU. ${product.sku}`,
                            thumbnail: {
                                alt: product.thumbnail.label,
                                src: product.thumbnail.url,
                            },
                            quantity: {
                                value: quantity,
                                addLabel: `Add another ${product.name} from shopping bag`,
                                substractLabel: `Remove one ${product.name} from shopping bag`,
                                removeLabel: `Remove all ${product.name} from shopping bag`,
                                // onUpdate: (quantity: number) => api.updateCartItem({ productId: id, quantity }),
                                // onRemove: () => api.removeCartItem({ productId: id }),
                            },
                            price: {
                                currency: product.price.regular.amount.currency,
                                regular: product.price.regular.amount.value,
                            },
                            options:
                                options &&
                                options.map(({ id, label, value }: any) => ({
                                    _id: id,
                                    label,
                                    value,
                                })),
                        })),
                }}
                summary={{
                    title: {
                        text: 'Shopping Bag',
                    },
                    prices: cart.prices && [
                        {
                            label: 'Subtotal',
                            price: cart.prices.subTotal && {
                                currency: cart.prices.subTotal.currency,
                                regular: cart.prices.subTotal.value,
                            },
                        },
                        {
                            label: 'Shipping',
                            price: shippingAddress.selectedShippingMethod.amount && {
                                currency: shippingAddress.selectedShippingMethod.amount.currency,
                                regular: shippingAddress.selectedShippingMethod.amount.value,
                            },
                        },
                        {
                            label: 'Taxes',
                            price: cart.prices.taxes[0] && {
                                currency: cart.prices.taxes[0] && cart.prices.taxes[0].currency,
                                regular: cart.prices.taxes.reduce(
                                    (accum: number, tax: { value: number }) => accum + tax.value,
                                    0
                                ),
                            },
                        },
                        {
                            appearance: 'bold',
                            label: 'Total',
                            price: cart.prices.total && {
                                currency: cart.prices.total.currency,
                                regular: cart.prices.total.value,
                            },
                        },
                    ],
                }}
            />
        </React.Fragment>
    )
}
