import React, { useEffect, useState } from 'react'
import axios from 'axios'
import config from '../config'
import { useRouter } from 'next/router'
import Head from 'next/head'

const api = config.api

const Login_Service_Desk = () => {
    const Swal = require('sweetalert2')
    const router = useRouter()
    const [dataLogin, setDataLogin] = useState({ username: '', password: '', source: 'servicedesk' })

    useEffect(() => {
        const token_servicedesk = localStorage.getItem('token-service-desk')


        if (token_servicedesk !== null) {
            router.push('/service_desk')
        }
    }, [])


    const Sign = async () => {
        try {
            // console.log(dataLogin)
            let res = await axios.post(`${api}/login`, dataLogin)
            // console.log(res.data.token_psoffice)
            if (res.data.token_psoffice !== undefined) {
                localStorage.setItem('token-service-desk', res.data.token_psoffice)
                router.push('/service_desk')
            }
        } catch (error) {
            console.log(error)
            if (error.response.data.message === "login-failed") {
                Swal.fire({
                    position: 'top',
                    icon: 'error',
                    title: 'เข้าสู่ระบบล้มเหลว กรุณาตรวจสอบ Username หรือ Password',
                    showConfirmButton: false,
                    timer: 3000
                })
            }

            if (error.response.data.message === "status-failed") {
                Swal.fire({
                    position: 'top',
                    icon: 'error',
                    title: 'ยังไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาติดต่อเจ้าหน้าที่',
                    showConfirmButton: false,
                    timer: 5000
                })
            }
        }
    }

    return (
        <>
            <Head>
                <title>เข้าสู่ระบบ SERVICE DESK</title>
            </Head>
            <style jsx>{`
                .background{
                    width: 430px;
                    height: 520px;
                    position: absolute;
                    transform: translate(-50%,-50%);
                    left: 50%;
                    top: 50%;
                }
                .background .shape{
                    height: 200px;
                    width: 200px;
                    position: absolute;
                    border-radius: 50%;
                }
                .shape:first-child{
                    background: linear-gradient(
                        #8f3000,
                        #FF8C42
                    );
                    left: -80px;
                    top: -80px;
                }
                .shape:last-child{
                    background: linear-gradient(
                        to right,
                        #cba286,
                        #f4c9ac
                    );
                    right: -30px;
                    bottom: -80px;
                }
                form{
                    height: 480px;
                    width: 400px;
                    background-color: rgba(141, 0, 0, 0.7);
                    position: absolute;
                    transform: translate(-50%,-50%);
                    top: 50%;
                    left: 50%;
                    border-radius: 25px;
                    backdrop-filter: blur(15px);
                    box-shadow: 0 0 40px rgba(8,7,16,1);
                    padding: 50px 35px;
                }
                form *{
                    color: #ffffff;
                    letter-spacing: 0.5px;
                    outline: none;
                    border: none;
                }
                form h3{
                    font-size: 32px;
                    font-weight: 500;
                    line-height: 42px;
                    text-align: center;
                }
                
                label{
                    display: block;
                    margin-top: 30px;
                    font-size: 16px;
                    font-weight: 500;
                }
                
                input{
                    display: block;
                    height: 50px;
                    width: 100%;
                    background-color: rgba(255,255,255,0.07);
                    border-radius: 50px;
                    padding: 0 10px;
                    margin-top: 8px;
                    font-size: 14px;
                    font-weight: 300;
                }
                ::placeholder{
                    color: #e5e5e5;
                }
                button{
                    margin-top: 50px;
                    width: 100%;
                    background-color: #8d0000;
                    padding: 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                    border-radius: 50px;
                    cursor: pointer;
                }
            `}</style>
            <div className="background">
                <div className="shape" />
                <div className="shape" />
            </div>
            <form>
                <h3><b>SERVICE DESK</b></h3>
                <label htmlFor="username">Username</label>
                <input type="text" placeholder="Username" id="username" value={dataLogin.username} onChange={e => { setDataLogin({ ...dataLogin, username: e.target.value }) }} />
                <label htmlFor="password">Password</label>
                <input type="password" placeholder="Password" id="password" value={dataLogin.password} onChange={e => { setDataLogin({ ...dataLogin, password: e.target.value }) }} />
                <button
                    onClick={e => {
                        e.preventDefault()
                        Sign()
                    }}
                >เข้าสู่ระบบ</button>
            </form>

        </>
    )
}

export default Login_Service_Desk