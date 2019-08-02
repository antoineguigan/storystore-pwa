import React, { FunctionComponent } from 'react'
import { gql } from 'apollo-boost'

import { useQuery } from '@apollo/react-hooks'

import DocumentMetadata from '../DocumentMetadata'
import Link from '../Link'
import AppTemplate from 'luma-storybook/dist/templates/App'

const APP_SHELL_QUERY = gql`
    query AppShellQuery {
        # flashMessage @client { 
        #     type
        #     message
        # }

        storeConfig {
            logo_alt
            default_description
            default_keywords
            default_title
            title_prefix
            title_suffix
            cms_home_page
            copyright
        }

        category(id: 2) {
            children {
                name
                url_key
            }
        }
    }
`

export const App: FunctionComponent = ({ children }) => {
    const { data } = useQuery<any>(APP_SHELL_QUERY, { fetchPolicy: 'cache-first', ssr: true })

    const {
        // flashMessage,
        storeConfig: {
            // header_logo_src,
            logo_alt,
            title_prefix,
            title_suffix,
            default_title,
            default_description,
            default_keywords,
            cms_home_page,
            copyright,
        },
        category: {
            children: categories,
        },

    } = data 
    
    return (
        <React.Fragment>
            <DocumentMetadata
                title={[title_prefix, default_title, title_suffix]}
                description={default_description}
                keywords={default_keywords}
            />

            <AppTemplate
                logo={{
                    as: Link,
                    href: '/no',
                    title: logo_alt,
                }}

                home={{
                    as: Link,
                    href: cms_home_page,
                    text: 'Home',
                    active: true,
                }}

                menu={categories.map(({
                    name,
                    url_key,
                }: any) => ({
                    text: name,
                    as: Link,
                    href: url_key + '.html',
                }))}

                help={{
                    as: 'a',
                    href: '#',
                    text: 'Help',
                }}

                myAccount={{
                    as: 'a',
                    href: '#',
                    text: 'My Account',
                }}

                search={{
                    as: 'a',
                    href: '#',
                    text: 'Search',
                }}

                cart={{
                    as: 'a',
                    count: 2,
                    href: '#',
                    text: 'My Bag',
                }}

                footer={{
                    copyright,
                    menu: [
                        { text: 'Blog', as: 'a', href: '#' },
                        { text: 'About', as: 'a', href: '#' },
                        { text: 'Orders & Returns', as: 'a', href: '#' },
                        { text: 'Customer Service', as: 'a', href: '#' },
                        { text: 'Contact', as: 'a', href: '#' },
                        { text: 'Privacy Policy', as: 'a', href: '#' },
                        { text: 'Terms of Use', as: 'a', href: '#' },
                    ],
                    social: {
                        facebook: { title: 'Facebook', as: 'a', href: 'https://facebook.com', target: 'blank' },
                        twitter: { title: 'Twitter', as: 'a', href: 'https://twitter.com', target: 'blank' },
                        pinterest: { title: 'Pinterest', as: 'a', href: 'https://pinterest.com', target: 'blank' },
                        instragram: { title: 'Instagram', as: 'a', href: 'https://instagram.com', target: 'blank' },
                    },
                }}
            >
                {children}
            </AppTemplate>
        </React.Fragment>
    )
}
