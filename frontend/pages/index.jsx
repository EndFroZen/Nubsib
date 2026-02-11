
import React, { useEffect, useState } from 'react'
import { CardHeader, Button, Card, CardFooter, Image, CardBody, Spinner, Skeleton } from "@nextui-org/react";
import Head from 'next/head'
import { Icon } from '@iconify/react'
import axios from 'axios'
import config from '../config'
import Link from 'next/link'
import jwt_decode from "jwt-decode"
import Layout from '../component/layout';

const api = config.api
const Index = () => {
    const [isLoading, setIsloading] = useState(false)

    useEffect(() => {

        const token_psoffice = localStorage.getItem('token-psoffice')
        if (token_psoffice !== null) {
            let decodeToken = jwt_decode(token_psoffice)
            // console.log(decodeToken)
            getApplicationsFront(decodeToken.username, 'front')
            getApplicationsBack(decodeToken.username, 'back')
        }

        const currentDate = new Date();
        const startSnowfallDate = new Date(currentDate.getFullYear(), 10, 1); // November 1
        const endSnowfallDate = new Date(currentDate.getFullYear() + 1, 0, 6); // January 6

        if (currentDate >= startSnowfallDate && currentDate <= endSnowfallDate) {
            const maxFlakes = 60;
            const flakes = [];
            const snowflakeCharacters = ["❅", "❄", "❆", "⛇"];

            const interval = setInterval(() => {
                if (flakes.length < maxFlakes) {
                    createSnowflake();
                }
            }, 300);

            function createSnowflake() {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.innerHTML = snowflakeCharacters[Math.floor(Math.random() * snowflakeCharacters.length)];

                // Style
                const startPos = Math.random() * window.innerWidth;
                const size = Math.random() * 30 + 10;
                snowflake.style.position = 'fixed';
                snowflake.style.top = '0';
                snowflake.style.left = `${startPos}px`;
                snowflake.style.fontSize = `${size}px`;
                snowflake.style.opacity = Math.random();
                snowflake.style.color = '#81BFDA';  // Set snowflake color to white

                document.body.appendChild(snowflake);
                flakes.push(snowflake);

                const rotationDirection = Math.random() > 0.5 ? 1 : -1;
                snowflake.animate(
                    [
                        { transform: `translate(0, 0) rotate(0deg)` },
                        { transform: `translate(0, 350vh) rotate(${rotationDirection * 360}deg)` },
                    ],
                    {
                        duration: (Math.random() * 3 + 5) * 15000,
                        easing: 'linear',
                        iterations: Infinity,
                    }
                );

                // Remove snowflake when animation completes
                setTimeout(() => {
                    snowflake.remove();
                    flakes.splice(flakes.indexOf(snowflake), 1);
                }, 20000);
            }

            return () => clearInterval(interval); // Cleanup interval on unmount
        }
    }, [])

    const [applicationsByPersonFront, setApplicationsByPersonFront] = useState([])
    const getApplicationsFront = async (username, type) => {
        setIsloading(true)
        try {
            const token_psoffice = localStorage.getItem('token-psoffice')
            let res = await axios.get(`${api}/ps_applications/${username}/${type}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setApplicationsByPersonFront(res.data)
            setIsloading(false)
            setApplicationsByPersonFront((prev) => [...prev, {
        app_img :"http://192.168.0.35:11110/govdoc/show/image/file-1764659122890-323325947.jpg",
        app_href : "/govdoc" ,
        app_name:"Gov doc"
    }])
        } catch (error) {
            console.log(error)
        }
    }
    
    const [applicationsByPersonBack, setApplicationsByPersonBack] = useState([])
    const getApplicationsBack = async (username, type) => {
        setIsloading(true)
        try {
            const token_psoffice = localStorage.getItem('token-psoffice')
            let res = await axios.get(`${api}/ps_applications/${username}/${type}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setApplicationsByPersonBack(res.data)
            setIsloading(false)
        } catch (error) {
            console.log(error)
        }
    }
   
    return (
        <>
            <Head>
                <title>หน้าแรก</title>
            </Head>
            <Layout>
                <div className="p-6">
                    {/* max-w-7xl  // กรณีต้องการบีบ ใส่ class นี้ */}
                    {
                        isLoading && <div className='flex justify-center'><Spinner size='lg' label="กำลังโหลด..." color='current' /></div>
                    }
                    {applicationsByPersonBack.length > 0 && <h2 className="text-2xl font-extrabold text-gray-700 mb-3">ระบบ Back Office</h2>}
                    <div className="grid sm:grid-cols-12 md:grid-cols-12 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-8">
                        {
                            applicationsByPersonBack.map((item, i) => {
                                // console.log(item)
                                return <Card
                                    key={i}
                                    isFooterBlurred
                                    className="sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-2  2xl:col-span-1 animate__animated animate__swing sm:mr-8 mb-8"
                                >
                                    <Link href={{ pathname: `/${item.app_href}` }}>
                                        <Image
                                            alt={item.app_img}
                                            className="object-cover"
                                            src={`../logo/${item.app_img}`}
                                            radius='lg'
                                        />
                                        <CardFooter className="justify-center before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                                            <p className="flex items-center text-center text-white text-sm"><Icon className='h-5 w-5 mr-1' icon={item.app_icons} />{item.app_name}</p>
                                        </CardFooter>
                                    </Link>
                                </Card>
                            })
                        }
                    </div>

                    {applicationsByPersonFront.length > 0 && <h2 className="text-2xl font-extrabold text-gray-700 mb-3">ระบบเกี่ยวกับผู้ป่วย</h2>}
                    <div className="grid sm:grid-cols-12 md:grid-cols-12 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-8">
                        {
                            applicationsByPersonFront.map((item, i) => {
                                // console.log(item)
                                return <Card
                                    key={i}
                                    isFooterBlurred
                                    className="sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-2  2xl:col-span-1 animate__animated animate__swing sm:mr-8 mb-8"
                                >
                                    <Link href={{ pathname: `/${item.app_href}` }}>
                                        <Image
                                            alt={item.app_img}
                                            className="object-cover"
                                            src={`../logo/${item.app_img}`}
                                            radius='lg'
                                        />
                                        <CardFooter className="justify-center before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                                            <p className="flex items-center text-center text-white text-sm"><Icon className='h-5 w-5 mr-1' icon={item.app_icons} />{item.app_name}</p>
                                        </CardFooter>
                                    </Link>
                                </Card>
                            })
                        }
                    </div>
                </div>
            </Layout >
        </>
    )
}

export default Index