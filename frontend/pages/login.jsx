import React, { useEffect, useState } from 'react'
import axios from 'axios'
import crypto from 'crypto'
import config from '../config'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Button, Image } from "@heroui/react";
const api = config.api

const Login = () => {
    const Swal = require('sweetalert2')
    const router = useRouter()
    const [dataLogin, setDataLogin] = useState({ username: '', password: '', source: 'psoffice' })
    const [loadingLogin, setLoadingLogin] = useState(false)
    useEffect(() => {
        // ================================================================================ START CHECK TOKEN PSOFFICE ================================================================================
        const token_psoffice = localStorage.getItem('token-psoffice')
        // console.log(token)

        if (token_psoffice !== null) {
            router.push('/')
        }
        // ================================================================================ STOP CHECK TOKEN PSOFFICE ================================================================================

        // ================================================================================ START CHECK CODE TOKEN PROVIDER ID ================================================================================
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            // Handle the authorization code here
            // console.log(code);
            // You can now exchange this code for an access token using your backend server
            getAuthrnHealID(code)
        }
        // ================================================================================ START CHECK CODE TOKEN PROVIDER ID ================================================================================
    }, [])


    const Sign = async () => {
        try {
            // console.log(dataLogin)
            let res = await axios.post(`${api}/login`, dataLogin)
            setLoadingLogin(true)
            // console.log(res.data.token_psoffice)
            if (res.data.token_psoffice != undefined) {
                localStorage.setItem('token-psoffice', res.data.token_psoffice)
                router.push('/')
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
        } finally {
            setLoadingLogin(false)
        }
    }





    // ================================================================================ START LOGIN PROVIDER ID ================================================================================

    // Health ID
    let Health_HEALTH_CLIENT_ID = '9ccf0817-0ec8-44ba-9ab6-505a914bb45f'
    let Health_REDIRECT_URI = 'https://psoffice.diligentsoftinter.com/login'  // เสร็จแล้วให้ไปลิงก์ไหน
    let Health_API = 'https://moph.id.th'
    let Health_CLIENT_SRECET = 'xsc4TG7DmMTseudP72ZFJT28NpvfaPouLvVyN9bs'

    // Provider ID
    let Provider_CLIENT_ID = 'bc7a8c05-eaa6-437d-b6a4-0f64b0194ee6'
    let Provider_REDIRECT_URI = 'https://psoffice.diligentsoftinter.com/login'   // เสร็จแล้วให้ไปลิงก์ไหน
    let Provider_API = 'https://provider.id.th'
    let Provider_CLIENT_SRECET = '8BABC9F7C6586E79CF8ACB63D6EED'


    const handleLoginProvider = () => {
        const loginUrl = `${Health_API}/oauth/redirect?client_id=${Health_HEALTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(Health_REDIRECT_URI)}&response_type=code`;
        window.location.href = loginUrl;
    }


    // useEffect(() => {

    // }, []);

    //ทำกสารยืนยัน Health ID
    const getAuthrnHealID = async (token) => {

        const data = new URLSearchParams({
            grant_type: 'authorization_code',
            code: token,
            redirect_uri: Health_REDIRECT_URI,
            client_id: Health_HEALTH_CLIENT_ID,
            client_secret: Health_CLIENT_SRECET

        });

        try {
            setLoadingLogin(true)
            // console.log('Request Data:', data.toString());
            const res = await axios.post(
                `${Health_API}/api/v1/token`,
                data.toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            // console.log('Access Token Response:', res.data);
            getAuthenPorviderID(res.data.data)
        } catch (error) {
            console.error('Error fetching profile:', error.response?.data || error.message);
        }

    }


    //การเชื่อมต่อกับ Provider ID

    const getAuthenPorviderID = async (token) => {

        // console.log(token)


        const data = {
            client_id: Provider_CLIENT_ID,
            secret_key: Provider_CLIENT_SRECET,
            redirect_uri: Provider_REDIRECT_URI,
            token_by: 'Health ID',
            token: token.access_token

        };

        try {
            // ขอ Provider Token
            const providerToken = await axios.post(`${Provider_API}/api/v1/services/token`, data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            const providerAccessToken = providerToken.data.data.access_token;

            //ดึงข้อมูล Provider
            const profile = await axios.get(`${Provider_API}/api/v1/services/profile`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerAccessToken}`,
                    'client-id': Provider_CLIENT_ID,
                    'secret-key': Provider_CLIENT_SRECET,
                }
            });

            // { provider_hash_cid: '', source: 'providerid' }
            // setDataLoginProviderID({ ...dataLoginProviderID, provider_hash_cid: profile.data.data.hash_cid })
            // const cid_ = '1100702529301'; // ตัวอย่างเลขบัตร
            // const hash = crypto.createHash('sha256').update(cid_).digest('hex');
            // console.log(hash);
            // console.log(profile.data.data.hash_cid)
            // console.log(profile.data);

            let dataLoginProviderID = {
                provider_hash_cid: profile.data.data.hash_cid,
                source: 'providerid'
            }

            // console.log(dataLoginProviderID)
            try {
                // console.log(dataLogin)

                let res = await axios.post(`${api}/login/providerid`, dataLoginProviderID)
                // console.log(res.data.token_psoffice)
                if (res.data.token_psoffice != undefined) {
                    localStorage.setItem('token-psoffice', res.data.token_psoffice)
                    router.push('/')
                }
            } catch (error) {
                console.log(error)
                if (error.response.data.message === "login-failed") {
                    Swal.fire({
                        position: 'top',
                        icon: 'error',
                        title: 'เข้าสู่ระบบล้มเหลว ไม่พบการยืนยันตัวตน',
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
            } finally {
                setLoadingLogin(false)
            }

        } catch (error) {
            console.error('Error fetching profile:', error.response?.data || error.message);
        }

    }
    // ================================================================================ STOP LOGIN PROVIDER ID =================================================================================

    return (
        <>
            <Head>
                <title>เข้าสู่ระบบ</title>
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
                        #1845ad,
                        #23a2f6
                    );
                    left: -80px;
                    top: -80px;
                }
                .shape:last-child{
                    background: linear-gradient(
                        to right,
                        #ff512f,
                        #f09819
                    );
                    right: -30px;
                    bottom: -80px;
                }
                form{
                    height: 480px;
                    width: 400px;
                    background-color: rgba(0, 33, 110,0.55);
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
                    margin-top: 20px;
                    font-size: 16px;
                    font-weight: 600;
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
                    margin-top: 30px;
                     margin-bottom: 10px;
                    width: 100%;
                    background-color: #00216E;
                    padding: 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                    border-radius: 50px;
                    cursor: pointer;
                }

                @keyframes wave {
                0%, 60%, 100% {
                    transform: translateY(0);
                }
                30% {
                    transform: translateY(-5px);
                }
                }

                .wave {
                    animation: wave 1.5s infinite ease-in-out;
                }
            `}</style>
            {
                loadingLogin && (
                    <div className='fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-50'>
                        <Image src='/img/digital_not_bg.png' alt='loading' width={100} className='animate-bounce' />
                        <p className="text-white text-lg font-bold flex space-x-1 mt-2">
                            {["ก", "รุ", "ณ", "า", "ร", "อ", "สั", "ก", "ค", "รู่", ".", ".", "."].map((word, index) => (
                                <span
                                    key={index}
                                    className="wave inline-block"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {word}
                                </span>
                            ))}
                        </p>
                    </div>
                )
            }
            <div className="background">
                <div className="shape" />
                <div className="shape" />
            </div>
            <form>
                <h3><b>PS OFFICE SSW</b></h3>
                <label htmlFor="username" >Username</label>
                <input type="text" placeholder="Username" id="username" value={dataLogin.username} onChange={e => { setDataLogin({ ...dataLogin, username: e.target.value }) }} />
                <label htmlFor="password">Password</label>
                <input type="password" placeholder="Password" id="password" value={dataLogin.password} onChange={e => { setDataLogin({ ...dataLogin, password: e.target.value }) }} />
                <button
                    onClick={e => {
                        e.preventDefault()
                        Sign()
                    }}
                >เข้าสู่ระบบ</button>
                <Button radius='full' variant="flat" className='flex justify-center w-full bg-green-900' size='lg' onPress={handleLoginProvider}>
                    <img width={75} src='../../img/provider.png' />
                    <span className='text-green-900'>ลงชื่อเข้าใช้งานด้วย Provider ID</span>
                </Button>
            </form>


        </>
    )
}

export default Login