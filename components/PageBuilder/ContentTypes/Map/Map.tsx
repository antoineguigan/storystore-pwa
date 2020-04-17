import React from 'react'
import { Component } from '@pmet-public/luma-ui/src/lib'
import MapComponent from '@pmet-public/luma-ui/src/components/Map'

type Location = {
    _id: number
    name: string
    lng: number
    lat: number
    country: string
    comment: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
}

export type MapProps = {
    apiKey: string
    locations: Location[]
}

export const Map: Component<MapProps> = ({ ...props }) => {
    return <MapComponent {...props} />
}
