import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import jwt_decode from "jwt-decode"
import axios from 'axios'
import config from '../../config'
const api = config.api
const HeaderTodolist = () => {
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
                        <h1 className="text-2xl font-bold tracking-tight text-blue-900">TODOLIST</h1>
                        <Link href={{ pathname: '/todolist' }}>
                            <p className={`${pathname === '/todolist' ? 'bg-blue-600 text-white shadow-lg shadowbt' : 'text-gray-500 hover:bg-blue-400 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium flex btrd `}><Icon className='h-5 w-5 mr-1' icon='solar:home-add-broken' />หน้าแรก</p>
                        </Link>
                        <Link href={{ pathname: '/todolist/manage_work_online' }}>
                            <p className={`${pathname === '/todolist/manage_work_online' ? 'bg-blue-600 text-white shadow-lg shadowbt' : 'text-gray-500 hover:bg-blue-400 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium flex btrd `}><Icon className='h-5 w-5 mr-1' icon='fluent-mdl2:join-online-meeting' />จัดการคำขอออนไลน์</p>
                        </Link>
                        <Link href={{ pathname: '/todolist/incident' }}>
                            <p className={`${pathname === '/todolist/incident' ? 'bg-blue-600 text-white shadow-lg shadowbt' : 'text-gray-500 hover:bg-blue-400 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium flex btrd `}><Icon className='h-5 w-5 mr-1' icon='carbon:event-incident' />จัดการอุบัติการณ์</p>
                        </Link>
                        <Link href={{ pathname: '/todolist/activity' }}>
                            <p className={`${pathname === '/todolist/activity' ? 'bg-blue-600 text-white shadow-lg shadowbt' : 'text-gray-500 hover:bg-blue-400 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium flex btrd `}><Icon className='h-5 w-5 mr-1' icon='hugeicons:date-time' />บันทึกกิจกรรม</p>
                        </Link>
                        {/* <Link href={{ pathname: '/todolist/activity' }}>
                            <p className={`${pathname === '/todolist/activity' ? 'bg-blue-600 text-white shadow-lg shadowbt' : 'text-gray-500 hover:bg-blue-400 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium flex btrd `}><Icon className='h-5 w-5 mr-1' icon='hugeicons:date-time' />บันทึกอยู่เวร</p>
                        </Link> */}

                    </div>
                </div>
            </header>
        </>
    )
}

export default HeaderTodolist