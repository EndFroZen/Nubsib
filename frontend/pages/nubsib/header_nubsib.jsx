import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import jwt_decode from "jwt-decode"
import axios from 'axios'
import config from '../../config'
const api = config.api
const HeaderNubsib = () => {
    const pathname = usePathname()

    // useEffect(() => {
    //     const token = localStorage.getItem('token-psoffice')
    //     let pathARR = pathname.split('/')
    //     // console.log(pathARR)
    //     // console.log(jwt_decode(token).username)
    //     getRole(jwt_decode(token).username, pathARR[1])
    // }, [])

    // const [role, setRole] = useState({})
    // const getRole = async (username, pathroom) => {
    //     try {
    //         const token_psoffice = localStorage.getItem("token-psoffice");
    //         let res = await axios.get(`${api}/ps_applications/check-role/${username}/${pathroom}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
    //         setRole(res.data)
    //         console.log(res.data)
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    return (
        <>
            <style jsx>{`
            .bgimg{
                background-image: url('https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdjkwNC1udW5ueS0wMTJfMi5qcGc.jpg');
            }
            .blurs{
                backdrop-filter: blur(var(--glass-blur, 30px));
            }
            .btrd{
                border-radius: 100px;
            }
            .shadowbt{
                box-shadow: rgba(0, 0, 0, 0.17) 0px -23px 25px 0px inset, rgba(0, 0, 0, 0.15) 0px -36px 30px 0px inset, rgba(0, 0, 0, 0.1) 0px -79px 40px 0px inset, rgba(0, 0, 0, 0.06) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px;
            }
        `}</style>
            <header className="bg-white shadow bgimg">
                <div className="mx-auto px-4 py-3 sm:px-6 lg:px-8 blurs">
                    <div className="flex items-baseline space-x-4">
                        <h1 className="text-2xl font-bold tracking-tight text-blue-900">NUBSIB</h1>
                        
                    </div>
                </div>
            </header>
        </>
    )
}

export default HeaderNubsib