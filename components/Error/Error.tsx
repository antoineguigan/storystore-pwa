import React from 'react'
import dynamic from 'next/dynamic'

import ErrorTemplate, { ErrorTypes } from '@pmet-public/storystore-ui/components/Error'
import { ButtonProps } from '@pmet-public/storystore-ui/components/Button'
import { Component } from '@pmet-public/storystore-ui/lib'

const Button = dynamic(() => import('@pmet-public/storystore-ui/components/Button'))

type ErrorProps = {
    type?: ErrorTypes
    button?: ButtonProps
    fullScreen?: boolean
}

const messages = {
    Offline: `You're offline. Check your connection and try again.`,
    '500': `Internal Error`,
    '401': `Authorization Required.`,
    '404': `Oops! The page you landed on doesn't exist.`,
}

export const Error: Component<ErrorProps> = ({ type = '500', fullScreen = false, button, children = messages[type], ...props }) => {
    return (
        <ErrorTemplate type={type} style={fullScreen ? { width: '100vw', height: '100vh' } : {}} {...props}>
            <div>{children}</div>
            {button && <Button {...button} style={{ marginTop: '2rem' }} />}
        </ErrorTemplate>
    )
}
