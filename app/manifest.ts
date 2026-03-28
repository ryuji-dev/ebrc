import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'EBRC : 에스라성경통독사경회',
        short_name: 'EBRC',
        description: '총신대학교 성경통독 동아리 EBRC를 위한 성경통독 관리 앱',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7c3aed',
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/icon-192',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            }
        ],
    }
}
