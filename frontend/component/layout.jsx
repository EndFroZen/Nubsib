import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Icon } from '@iconify/react';
import Link from 'next/link'
import axios from 'axios'
import config from '../config'
import jwt_decode from "jwt-decode"
import { useRouter } from 'next/router'
import { Avatar } from "@heroui/react";
const api = config.api

const Layout = ({ children }) => {
    const router = useRouter()
    const pathname = usePathname()
    const Swal = require('sweetalert2')
    const currentDate = new Date();
    const YearNow = currentDate.getFullYear() + 543

    // console.log(YearNow)
    const userNavigation = [
        { name: 'โปรไฟล์', href: 'profile' },
        { name: 'ออกจากระบบ', href: 'signout' },
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const navigationControl = (value) => {
        if (value === 'signout') {
            localStorage.removeItem('token-psoffice')
            router.push('/login')
        }
    }

    const [userProfile, setUserProfile] = useState({ name: '', email: '', imageUrl: '' })
    // useEffect(() => {
    //     let pathARR = pathname.split('/')
    //     const token_psoffice = localStorage.getItem('token-psoffice')
    //     if (token_psoffice !== null) {
    //         let decodeToken = jwt_decode(token_psoffice)
    //         // console.log(decodeToken)

    //         //============= START spit token = dept_roles ============== ถ้าจะเอาค่า แผนกกับตำแหน่ง ออกไปใช้ในระบบ มาดูตรงนี้ๆ
    //         // const deptRolesArray = decodeToken.dept_roles.split(',').map(item => {
    //         //     const [dept_id, role_id] = item.split('|');
    //         //     return { dept_id, role_id };
    //         // });

    //         // console.log(deptRolesArray);
    //         //============= STOP spit token = dept_roles ============== ถ้าจะเอาค่า แผนกกับตำแหน่ง ออกไปใช้ในระบบ มาดูตรงนี้ๆ

    //         const timestampInSeconds = decodeToken.exp;
    //         const timestampInMilliseconds = timestampInSeconds * 1000;

    //         const cur_date = new Date();
    //         const date = new Date(timestampInMilliseconds);

    //         if (cur_date > date) {
    //             Swal.fire({
    //                 title: "แจ้งเตือน !",
    //                 text: "Token หมดอายุการใช้งาน กรุณาเข้าสู่ระบบใหม่",
    //                 icon: "error"
    //             }).then((result) => {
    //                 if (result.isConfirmed) {
    //                     navigationControl('signout')
    //                     // console.log('logout')
    //                 }
    //             });
    //         }

    //         setUserProfile({ ...userProfile, name: decodeToken.tname, email: decodeToken.username + '@srisangworn.co.th', imageUrl: decodeToken.picture_profile })
    //         getCheckRoom(decodeToken.username, pathARR[1])
    //     } else {
    //         router.push('/login')
    //     }
    // }, [])

    // console.log(userProfile)

    const getCheckRoom = async (username, pathroom) => {
        try {
            if (pathroom !== '') {
                const token_psoffice = localStorage.getItem('token-psoffice')
                let res = await axios.get(`${api}/ps_applications/check-accessible-rooms/${username}/${pathroom}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                // console.log(res.data)
                if (res.data.length !== 1) {
                    router.push('/')
                    Swal.fire({
                        title: "แจ้งเตือน !!!",
                        text: "คุณไม่มีสิทธิเข้าหน้านี้ กรุณาติดต่อเจ้าหน้าที่ โทร 2143,2145",
                        icon: "error",
                        confirmButtonText: "รับทราบ",

                    });
                }
            }
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <>
            <style jsx>{`
                    .penguin {
            width: 25px;
            height: 45px;
            bottom: 5%;
            position: fixed;
            animation: walk 25s linear infinite;
            }

            @keyframes walk {
            0%, 100% { 
                left: 0;    
                transform: translatex(-50%) scalex(-1); 
            }
            49% { 
                left: 100%; 
                transform: translatex(-50%) scalex(-1); 
            }
                50% { 
                left: 100%; 
                transform: translatex(-50%) scalex(1);  
            }
                99% { 
                left: 0;   
                transform: translatex(-50%) scalex(1);      }
            }
      `}</style>
            <div className="h-full">
                <Disclosure as="nav" className="bg-gray-800">
                    {({ open }) => (
                        <>
                            {/* max-w-7xl  // กรณีต้องการบีบ ใส่ class นี้ */}
                            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex h-16 items-center justify-between">
                                    <Link href={{ pathname: '/' }}>
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <img
                                                    className="h-12 w-12"
                                                    src="../img/ssw_logo.png"
                                                    alt="ssw_logo"
                                                />
                                            </div>
                                            <h1 className="ml-3 bg-gradient-to-r text-3xl from-blue-500 font-bold via-green-400 to-indigo-300 inline-block text-transparent bg-clip-text">PS OFFICE<span className="text-sm text-gray-100 hidden md:block tracking-wide">โรงพยาบาลศรีสังวรสุโขทัย</span></h1>
                                        </div>
                                    </Link>
                                    <div className="hidden md:block">
                                        <div className="ml-4 flex items-center md:ml-6">
                                            <span className='text-white'>ผู้ใช้งาน : {userProfile.name}</span>
                                            <button
                                                type="button"
                                                className="ml-3 relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                            >
                                                <span className="absolute -inset-1.5" />
                                                <span className="sr-only">View notifications</span>
                                                <Icon className="h-6 w-6" aria-hidden="true" icon="akar-icons:bell" />
                                            </button>
                                            {/* Profile dropdown */}
                                            <Menu as="div" className="relative ml-3">
                                                <div>
                                                    <Menu.Button className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                                                        <span className="absolute -inset-1.5" />
                                                        <span className="sr-only">Open user menu</span>
                                                        {/* <img className="h-8 w-8 rounded-full" src={`../img/${userProfile.imageUrl}`} alt={userProfile.imageUrl} /> */}
                                                        <Avatar src={`https://psoffice.diligentsoftinter.com/img/${userProfile.imageUrl !== '' ? userProfile.imageUrl : 'default.jpg'}`} />
                                                    </Menu.Button>
                                                </div>
                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        {userNavigation.map((item) => (
                                                            <Menu.Item key={item.name}>
                                                                {({ active }) => (
                                                                    <a
                                                                        onClick={() => navigationControl(item.href)}
                                                                        className={classNames(
                                                                            active ? 'bg-gray-100' : '',
                                                                            'block px-4 py-2 text-sm text-gray-700'
                                                                        )}
                                                                    >
                                                                        {item.name}
                                                                    </a>
                                                                )}
                                                            </Menu.Item>
                                                        ))}
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </div>
                                    <div className="-mr-2 flex md:hidden">
                                        {/* Mobile menu button */}
                                        <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                                            <span className="absolute -inset-0.5" />
                                            <span className="sr-only">Open main menu</span>
                                            {open ? (
                                                <Icon className="h-6 w-6" aria-hidden="true" icon="fa6-solid:xmark" />
                                            ) : (
                                                <Icon className="h-6 w-6" aria-hidden="true" icon="uim:bars" />
                                            )}
                                        </Disclosure.Button>
                                    </div>
                                </div>
                            </div>

                            <Disclosure.Panel className="md:hidden">
                                {/* <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                                    {navigation.map((item) => (
                                        <Link
                                            href={{ pathname: `${item.href}` }}
                                            key={item.name}
                                        >
                                            <p className={`${pathname === `/${item.href}` ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium flex`}><Icon className='h-5 w-5 mr-1' icon={item.icons} />{item.name}</p>

                                        </Link>
                                    ))}
                                </div> */}
                                <div className="border-t border-gray-700 pb-3 pt-4">
                                    <div className="flex items-center px-5">
                                        <div className="flex-shrink-0">
                                            <img className="h-10 w-10 rounded-full" src={`../img/${userProfile.imageUrl}`} alt={userProfile.imageUrl} />
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium leading-none text-white">{userProfile.name}</div>
                                            <div className="text-sm font-medium leading-none text-gray-400">{userProfile.email}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="relative ml-auto flex-shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                        >
                                            <span className="absolute -inset-1.5" />
                                            <span className="sr-only">View notifications</span>
                                            <Icon className="h-6 w-6" aria-hidden="true" icon="akar-icons:bell" />
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-1 px-2">
                                        {userNavigation.map((item) => (
                                            <Disclosure.Button
                                                onClick={() => navigationControl(item.href)}
                                                key={item.name}
                                                as="a"
                                                className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                                            >
                                                {item.name}
                                            </Disclosure.Button>
                                        ))}
                                    </div>
                                </div>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>
                <main className='mb-14'>
                    {children}
                </main>
                <footer className="hidden fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-center dark:bg-gray-800 dark:border-gray-600 text-sm gap-2">
                    <span className="text-gray-500 sm:text-center dark:text-gray-400">สงวนลิขสิทธิ์ © 2567 - {YearNow}</span><span className='text-emerald-600'>กลุ่มงานสุขภาพดิจิทัล</span><span className='text-gray-500 sm:text-center dark:text-gray-400'>version 1.0</span>
                    {/* <div className="penguin" >
                        <img src="https://nervin.net/img/ping.gif" />
                    </div> */}
                </footer>
            </div >
        </>
    )
}

export default Layout