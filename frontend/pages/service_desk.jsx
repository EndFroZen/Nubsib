import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { Icon } from '@iconify/react';
import { Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, Textarea, Button, Card, CardFooter, Image, CardBody, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Autocomplete, AutocompleteItem } from "@heroui/react";
import { useRouter } from 'next/router';
import jwt_decode from "jwt-decode"
import config from '../config'
import { statusIncident } from '../myFunctions'
import axios from 'axios'
import * as moment from 'moment'
import 'moment/locale/th'
moment.locale('th')
const api = config.api
const Swal = require('sweetalert2')
const Service_desk = () => {

    const currentDate = new Date();
    const YearNow = currentDate.getFullYear() + 543
    const router = useRouter();
    const [userProfile, setUserProfile] = useState({})

    useEffect(() => {
        const token_servicedesk = localStorage.getItem('token-service-desk')
        // console.log(token_servicedesk)
        if (token_servicedesk !== null) {
            let decodeToken = jwt_decode(token_servicedesk)
            // console.log(decodeToken)
            setUserProfile(decodeToken)
            getIncident(decodeToken.username) // ดึงข้อมูล INCIDENT
        } else {
            router.push('/login_service_desk')
        }
        getAllDept() // ดึงข้อมูล DEPT ทั้งหมด
        chkDeptByUsername() // ดึงข้อมูล DEPT จาก username
        getSla() // ดึงข้อมูล SLA

    }, [])


    //-------------------------------------------------------------------------------------- START ดึงข้อมูล INCIDENT
    const [incidentARR, setIncidentARR] = useState([])
    const [incidentCountNotConfirm, setIncidentCountNotConfirm] = useState(0);
    const getIncident = async (username) => {
        try {
            const token_servicedesk = localStorage.getItem('token-service-desk')
            let res = await axios.get(`${api}/incident/get-incident-all/${username}/all`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
            setIncidentARR(res.data)
            let count = 0;
            res.data.map((item) => {
                if (item.incident_status === '4') {
                    count++
                }
            })
            setIncidentCountNotConfirm(count)
        } catch (error) {
            console.log(error)
        }
    }
    //-------------------------------------------------------------------------------------- STOP ดึงข้อมูล INCIDENT


    //-------------------------------------------------------------------------------------- START FUNCTIONS ค้นหา
    const [searchValue, setSearchValue] = useState('')
    const searchDataUserALL = async (value) => {
        setSearchValue(value)
        // console.log(value)
        const token_servicedesk = localStorage.getItem('token-service-desk')
        if (value) {
            try {
                let res = await axios.get(`${api}/incident/get-incident-all/${jwt_decode(token_servicedesk).username}/${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
                // console.log(res.data)
                setIncidentARR(res.data)
            } catch (error) {
                console.log(error)
            }
        } else {
            getIncident(jwt_decode(token_servicedesk).username)
        }
    }
    //-------------------------------------------------------------------------------------- STOP FUNCTIONS ค้นหา
    //------------------------------------------------------------------- START ตรงนี้ทำ Pagination
    const [rowsPerPage, setRowsPerPage] = React.useState(10)
    const [page, setPage] = React.useState(1)
    const pages = Math.ceil(incidentARR.length / rowsPerPage)
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    const onRowsPerPageChange = React.useCallback((e) => {
        setRowsPerPage(Number(e.target.value))
        setPage(1)
    }, [])
    //------------------------------------------------------------------- END ตรงนี้ทำ Pagination


    //--------------------------------------------------------------------- START ข้อมูล SLA
    const [slaARR, setSlaARR] = useState([])
    const getSla = async () => {
        try {
            const token_servicedesk = localStorage.getItem('token-service-desk')
            let res = await axios.get(`${api}/incident/get-sla-all`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
            setSlaARR(res.data)
            // console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    //--------------------------------------------------------------------- STOP ข้อมูล SLA

    //--------------------------------------------------------------------- START ข้อมูลผู้แจ้ง
    const [informant, setInformant] = useState({ sla_id: '', sla_title: '', sla_time: '', sla_condition: '', dept_id: '', dept_name: '', tel: '', urgency_level: '', detail: '' })
    //--------------------------------------------------------------------- STOP ข้อมูลผู้แจ้ง

    //--------------------------------------------------------------------- START เลือก SLA
    const selectSLA = (sla_id, sla_title, sla_time, sla_condition) => {
        setInformant({ ...informant, sla_id: sla_id, sla_title: sla_title, sla_time: sla_time, sla_condition: sla_condition, urgency_level: sla_id < 6 ? 'ด่วน' : 'ไม่ด่วน' })
    }
    //--------------------------------------------------------------------- STOP เลือก SLA

    //--------------------------------------------------------------------- START ดึงข้อมูล DEPT ทั้งหมด
    const [deptARR, setDeptARR] = useState([])
    const getAllDept = async () => {
        try {
            const token_servicedesk = localStorage.getItem('token-service-desk')
            let res = await axios.get(`${api}/incident/get-dept-all`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
            setDeptARR(res.data)
            // console.log(res.data[0])
        } catch (error) {
            console.log(error)
        }
    }
    //--------------------------------------------------------------------- STOP ดึงข้อมูล DEPT ทั้งหมด

    //--------------------------------------------------------------------- START ดึงข้อมูล DEPT จาก username
    const chkDeptByUsername = async () => {
        try {
            const token_servicedesk = localStorage.getItem('token-service-desk')
            let decodeToken = jwt_decode(token_servicedesk)
            let res = await axios.get(`${api}/incident/chk-dept-by-username/${decodeToken.username}`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
            // console.log(res.data[0])
            setInformant({ ...informant, dept_id: res.data[0].dept_id.toString(), dept_name: res.data[0].name, tel: res.data[0].tel })
        } catch (error) {
            console.log(error)
        }
    }
    //--------------------------------------------------------------------- STOP ดึงข้อมูล DEPT จาก username

    //--------------------------------------------------------------------- START ฟังก์ชันเปลี่ยนแผนก
    const changeDept = async (value) => {
        // console.log(value)
        if (value) {
            try {
                const token_servicedesk = localStorage.getItem('token-service-desk')
                let res = await axios.get(`${api}/incident/chk-tel-by-deptid/${value}`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
                setInformant({ ...informant, dept_id: value, dept_name: res.data[0].name, tel: res.data[0].tel })
                // console.log(res.data[0])
            } catch (error) {
                console.log(error)
            }
        } else {
            setInformant({ ...informant, dept_id: '', dept_name: '', tel: '' })
        }
    }
    //--------------------------------------------------------------------- STOP ฟังก์ชันเปลี่ยนแผนก

    //====================================================================== START ฟังก์ชันส่งข้อมูลผู้แจ้ง
    const [detailMessOrther, setDetailMessOrther] = useState(false)
    const submitInformant = async () => {
        // console.log(informant)
        if (informant.sla_id === '') {
            Swal.fire({
                position: "top-end",
                icon: 'error',
                title: 'กรุณาเลือกประเภทปัญหา',
                showConfirmButton: false,
                timer: 3000
            })
        } else if (informant.dept_id === '') {
            Swal.fire({
                position: "top-end",
                icon: 'error',
                title: 'กรุณาเลือกแผนก',
                showConfirmButton: false,
                timer: 3000
            })
        } else if (informant.sla_id > 5 && (informant.detail === '' || informant.detail === null)) {
            Swal.fire({
                position: "top-end",
                icon: 'error',
                title: 'กรุณาคีย์รายละเอียด',
                showConfirmButton: false,
                timer: 3000
            })
            setDetailMessOrther(true)
        } else {
            // console.log(informant)
            try {
                const token_servicedesk = localStorage.getItem('token-service-desk')
                let res = await axios.post(`${api}/incident/insert-informant-online`, informant, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
                // console.log(res.data)
                if (res.data.ok === true) {
                    Swal.fire({
                        position: "top-end",
                        icon: 'success',
                        title: 'ส่งข้อมูลสำเร็จ',
                        showConfirmButton: false,
                        timer: 3000
                    })
                    setInformant({ ...informant, sla_id: '', sla_condition: '', urgency_level: '', detail: '' })
                    // getSla()
                } else {
                    Swal.fire({
                        position: "top-end",
                        icon: 'error',
                        title: 'ส่งข้อมูลล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                        showConfirmButton: false,
                        timer: 3000
                    })
                }
            } catch (error) {
                console.log(error)
                Swal.fire({
                    position: "top-end",
                    icon: 'error',
                    title: 'ส่งข้อมูลล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                    showConfirmButton: false,
                    timer: 3000
                })
            } finally {
                getIncident(userProfile.username)
            }
        }
    }
    //====================================================================== START ฟังก์ชันส่งข้อมูลผู้แจ้ง

    //====================================================================== START ฟังก์ชันแก้ไขข้อมูลผู้แจ้ง

    //--------------------------------------------------------------------- START ข้อมูลผู้แจ้ง
    const [idEditInformant, setIdEditInformant] = useState('')
    //--------------------------------------------------------------------- STOP ข้อมูลผู้แจ้ง
    //== ดึงข้อมูลมา แล้วแก้ไข
    const geteditInformant = async (id_head) => {
        // console.log(id_head)
        setIdEditInformant(id_head)
        //  ---- START กดแล้วเลื่อนขึ้นไปด้านบน
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // ลื่นไหล
        });
        //  ---- STOP กดแล้วเลื่อนขึ้นไปด้านบน

        const token_servicedesk = localStorage.getItem('token-service-desk')
        let res = await axios.get(`${api}/incident/get-incident-online-by-id/${id_head}`, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
        // console.log(res.data[0])
        setInformant({ ...informant, sla_id: res.data[0].sla_id, sla_title: res.data[0].sla_title, sla_time: res.data[0].sla_time, sla_condition: res.data[0].sla_condition, dept_id: res.data[0].dept_id.toString(), dept_name: res.data[0].dept_name, tel: res.data[0].tel, urgency_level: res.data[0].urgency_level, detail: res.data[0].detail })
    }

    // ==== บันทึกข้อมูล
    const submitEditInformant = async () => {
        if (informant.sla_id === '') {
            Swal.fire({
                position: "top-end",
                icon: 'error',
                title: 'กรุณาเลือกประเภทปัญหา',
                showConfirmButton: false,
                timer: 3000
            })
        } else if (informant.dept_id === '') {
            Swal.fire({
                position: "top-end",
                icon: 'error',
                title: 'กรุณาเลือกแผนก',
                showConfirmButton: false,
                timer: 3000
            })
        } else {
            let data = {
                incident_head_id: idEditInformant,
                sla_id: informant.sla_id,
                dept_id: informant.dept_id,
                tel: informant.tel,
                urgency_level: informant.urgency_level,
                detail: informant.detail
            }
            // console.log(data)
            try {
                const token_servicedesk = localStorage.getItem('token-service-desk')
                let res = await axios.put(`${api}/incident/update-informant-online`, data, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
                // console.log(res.data)
                if (res.data.ok === true) {
                    Swal.fire({
                        position: "top-end",
                        icon: 'success',
                        title: 'แก้ไขข้อมูลสำเร็จ',
                        showConfirmButton: false,
                        timer: 3000
                    })
                    // getSla()
                } else {
                    Swal.fire({
                        position: "top-end",
                        icon: 'error',
                        title: 'แก้ไขข้อมูลล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                        showConfirmButton: false,
                        timer: 3000
                    })
                }
            } catch (error) {
                console.log(error)
                Swal.fire({
                    position: "top-end",
                    icon: 'error',
                    title: 'แก้ไขข้อมูลล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                    showConfirmButton: false,
                    timer: 3000
                })
            } finally {
                setInformant({ ...informant, sla_id: '', sla_condition: '', urgency_level: '', detail: '' })
                getIncident(userProfile.username)
                setIdEditInformant('')
            }
        }
    }

    //====================================================================== STOP ฟังก์ชันแก้ไขข้อมูลผู้แจ้ง







    // ====================================================  START ฟังก์ชันออกจากระบบ
    const handleLogout = () => {
        // ลบ token ออกจาก localStorage
        localStorage.removeItem('token-service-desk');

        // นำทางไปยังหน้า login หรือหน้าอื่นๆ
        router.push('/login_service_desk');
    };
    // ====================================================  STOP ฟังก์ชันออกจากระบบ


    //============================================================== START ยืนยันการรับเรื่อง
    const onConfirm = async (id_head) => {
        const token_servicedesk = localStorage.getItem('token-service-desk')
        Swal.fire({
            title: "แจ้งเตือน!",
            text: "คุณยอมรับเวลาในการแก้ไขปัญหานี้หรือไม่",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "ใช่, ฉันยอมรับเวลาในการแก้ไขปัญหา",
            cancelButtonText: "ไม่, ฉันกดผิด"
        }).then(async (result) => {
            if (result.isConfirmed) {
                // console.log('ยอมรับ : ' + id_head)

                let data = {
                    incident_head_id: id_head,
                    confirm_status: '1',
                    confirm_note: 'ยอมรับ',
                }
                try {
                    let res = await axios.put(`${api}/incident/confirm-incident`, data, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
                    // console.log(res.data)
                    if (res.data.ok === true) {
                        Swal.fire({
                            position: "top-end",
                            icon: 'success',
                            title: 'ยอมรับเวลาในการแก้ไขปัญหาสำเร็จ',
                            showConfirmButton: false,
                            timer: 3000
                        })

                    } else {
                        Swal.fire({
                            position: "top-end",
                            icon: 'error',
                            title: 'ยอมรับเวลาในการแก้ไขปัญหาล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                            showConfirmButton: false,
                            timer: 3000
                        })
                    }
                } catch (error) {
                    console.log(error)
                    Swal.fire({
                        position: "top-end",
                        icon: 'error',
                        title: 'ยอมรับเวลาในการแก้ไขปัญหาล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                        showConfirmButton: false,
                        timer: 3000
                    })
                } finally {
                    getIncident(userProfile.username)
                }
            }
        })
    }
    //============================================================== STOP ยืนยันการรับเรื่อง

    //============================================================== START ไม่ยอมรับ เวลาในการแก้ไขปัญหา
    const onNotConfirm = async (id_head) => {
        const token_servicedesk = localStorage.getItem('token-service-desk')
        Swal.fire({
            title: 'แจ้งเตือน!',
            text: 'ไม่ยอมรับเวลาในการแก้ไขปัญหา กรุณากรอกหมายเหตุ',
            input: 'textarea',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            showLoaderOnConfirm: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#3EC70B',
            cancelButtonColor: '#d33',
            preConfirm: (value) => {
                if (value === '') {
                    Swal.showValidationMessage(`กรุณากรอกหมายเหตุ`)
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                let data = {
                    incident_head_id: id_head,
                    confirm_status: '0',
                    confirm_note: result.value,
                }
                try {
                    let res = await axios.put(`${api}/incident/confirm-incident`, data, { headers: { Authorization: `Bearer ${token_servicedesk}` } })
                    // console.log(res.data)
                    if (res.data.ok === true) {
                        Swal.fire({
                            position: "top-end",
                            icon: 'success',
                            title: 'ไม่ยอมรับเวลาในการแก้ไขปัญหาสำเร็จ',
                            showConfirmButton: false,
                            timer: 3000
                        })
                    } else {
                        Swal.fire({
                            position: "top-end",
                            icon: 'error',
                            title: 'ไม่ยอมรับเวลาในการแก้ไขปัญหาล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                            showConfirmButton: false,
                            timer: 3000
                        })
                    }
                }
                catch (error) {
                    console.log(error)
                    Swal.fire({
                        position: "top-end",
                        icon: 'error',
                        title: 'ไม่ยอมรับเวลาในการแก้ไขปัญหาล้มเหลว กรุณาติดต่อเจ้าหน้าที่',
                        showConfirmButton: false,
                        timer: 3000
                    })
                }
                finally {
                    getIncident(userProfile.username)
                }
            }
        })
    }
    //============================================================== STOP ไม่ยอมรับ เวลาในการแก้ไขปัญหา

    return (
        <>
            <Head>
                <title>SERVICE DESK</title>
            </Head>
            <style jsx>{`
                .bgimg{
                    background-image: url('https://cdn.photoroom.com/v2/image-cache?path=gs://background-7ef44.appspot.com/backgrounds_v3/red/13_-_red.jpg');
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
            <header className="bg-white shadow bgimg fixed w-full z-40">
                <div className="mx-auto px-4 py-3 sm:px-6 lg:px-8 blurs">
                    <div className="flex items-baseline justify-between space-x-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Service Desk (ICT)</h1>
                        </div>
                        <div className='flex gap-3 text-white items-center'>
                            <span>ผู้ใช้งาน : {userProfile.tname}</span>
                            <Dropdown>
                                <DropdownTrigger>
                                    <img className="h-8 w-8 rounded-full cursor-pointer" src={`../img/default2.jpg`} alt='default2.jpg' />
                                </DropdownTrigger>
                                <DropdownMenu aria-label="logout">
                                    <DropdownItem onPress={handleLogout} key="logout" className="text-danger" color="danger" startContent={<Icon className="h-6 w-6" aria-hidden="true" icon="codicon:sign-out" />}>
                                        ออกจากระบบ
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </header>

            <div className="py-10 px-4 md:px-6 lg:px-10">
                <div className='mt-8 lg:mt-12'>
                    <div>
                        <Card style={{ backgroundColor: idEditInformant !== '' ? 'rgba(255, 235, 200,0.5)' : 'white' }}>
                            <CardBody>
                                <div className="gap-6 grid grid-cols-12">
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-8 2xl:col-span-8">
                                        <div className="gap-3 grid grid-cols-12">
                                            <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                                <label className="block text-xl font-bold text-gray-800 dark:text-white">เลือกประเภทปัญหา (มีรับประกันเวลา) <span className='text-danger'>*</span></label>
                                            </div>
                                            {
                                                slaARR.slice(0, 4).map((item, i) => {
                                                    return <div key={i} style={{ animationDelay: `${i * 0.3}s` }} className="col-span-6 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3 animate__animated animate__flipInX" onClick={() => selectSLA(item.sla_id, item.sla_title, item.sla_time, item.sla_condition)}>
                                                        <Card isFooterBlurred className="border-none" radius="lg"
                                                            style={{
                                                                background: informant.sla_id === item.sla_id
                                                                    ? 'radial-gradient(circle, rgba(255,173,173,1) 9%, rgba(153,0,0,1) 99%)'
                                                                    : ''
                                                            }}>
                                                            <Image
                                                                alt={`${item.sla_image}`}
                                                                className="object-cover mx-auto rounded-lg"
                                                                src={`../img/servicedesk/${item.sla_image}`}
                                                                height={150}
                                                                width='100%'
                                                            />
                                                            <CardFooter className="before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                                                                <p className={`${informant.sla_id === item.sla_id ? 'text-white font-bold' : 'text-gray-8'}`}>{item.sla_title} [รับประกัน {item.sla_time} นาที]</p>
                                                            </CardFooter>
                                                        </Card>
                                                    </div>
                                                })
                                            }
                                            <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                                <label className="block text-xl font-bold text-gray-800 dark:text-white">ประเภทปัญหาที่ไม่รับประกันเวลา</label>
                                            </div>
                                            {
                                                slaARR.slice(4, 10).map((item, i) => {
                                                    return (
                                                        <div
                                                            key={i}
                                                            style={{ animationDelay: `${i * 0.3}s` }}
                                                            className="col-span-6 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4 animate__animated animate__flipInX"

                                                        >
                                                            <Button
                                                                className="w-full h-16"
                                                                color={informant.sla_id === item.sla_id ? "danger" : "default"}
                                                                variant={informant.sla_id === item.sla_id ? "solid" : "bordered"}
                                                                onPress={() => selectSLA(item.sla_id, item.sla_title, item.sla_time, item.sla_condition)}
                                                            >
                                                                <div className="overflow-hidden">
                                                                    <p className="text-lg font-bold">{item.sla_title}</p>
                                                                    {/* <p className={`truncate ${informant.sla_id === item.sla_id ? 'text-gray-100' : 'text-gray-700'}`}>{item.sla_condition}</p> */}
                                                                </div>
                                                            </Button>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                        {/* <label className="block mt-2 font-bold text-red-700 dark:text-white">{informant.sla_condition !== '' && '*' + informant.sla_condition}</label> */}
                                        <label className="block mt-2 font-bold text-red-700 dark:text-white">
                                            {informant.sla_condition !== '' &&
                                                informant.sla_condition.split('**').map((line, index) => (
                                                    <div key={index}>
                                                        {index === 1 ? <i>- <u>{line}</u></i> : `- ${line}`}
                                                    </div>
                                                ))
                                            }
                                        </label>
                                    </div>
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-4 2xl:col-span-4">
                                        <div className="gap-3 grid grid-cols-12">
                                            <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                                <label className="block text-xl font-bold text-gray-800 dark:text-white">ข้อมูลผู้แจ้ง<span className='text-danger'>*</span></label>
                                            </div>
                                            <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3 xl:col-span-6 2xl:col-span-6">
                                                <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-white">ชื่อผู้แจ้งเหตุ<span className='text-danger'>*</span></label>
                                                <Input
                                                    type="text"
                                                    value={userProfile.tname}
                                                    isDisabled
                                                />
                                            </div>
                                            <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3 xl:col-span-6 2xl:col-span-6">
                                                <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-white">แผนก<span className='text-danger'>*</span></label>
                                                <Autocomplete
                                                    aria-label="select-Dept"
                                                    placeholder="แผนก"
                                                    size='md'
                                                    onSelectionChange={changeDept}
                                                    selectedKey={informant.dept_id}
                                                >
                                                    {deptARR.map((item) => {
                                                        return (
                                                            <AutocompleteItem key={item.dept_id}>
                                                                {item.dept_name}
                                                            </AutocompleteItem>
                                                        );
                                                    })}
                                                </Autocomplete>
                                            </div>
                                            <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3 xl:col-span-6 2xl:col-span-6">
                                                <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-white">เบอร์โทร</label>
                                                <Input
                                                    type="text"
                                                    value={informant.tel}
                                                    onChange={(e) => setInformant({ ...informant, tel: e.target.value })}
                                                    placeholder="เบอร์โทร"
                                                />
                                            </div>
                                            <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3 xl:col-span-6 2xl:col-span-6">
                                                <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-white">ระดับความด่วน</label>
                                                <Autocomplete

                                                    aria-label="select-provinces"
                                                    placeholder="ระดับความด่วน"
                                                    size='md'
                                                    color={informant.urgency_level !== '' && informant.urgency_level !== null ? informant.urgency_level === 'ด่วน' ? 'danger' : 'success' : 'default'}
                                                    onSelectionChange={(value) => setInformant({ ...informant, urgency_level: value === null ? 'ไม่ด่วน' : value })}
                                                    selectedKey={informant.urgency_level}
                                                >
                                                    <AutocompleteItem key={'ด่วน'}>ด่วน</AutocompleteItem>
                                                    <AutocompleteItem key={'ไม่ด่วน'}>ไม่ด่วน</AutocompleteItem>
                                                </Autocomplete>
                                            </div>
                                            <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                                <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-white">รายละเอียดเพิ่มเติม</label>
                                                <Textarea
                                                    isClearable
                                                    className="w-full"
                                                    placeholder="รายละเอียดเพิ่มเติม"
                                                    onChange={(e) => (setInformant({ ...informant, detail: e.target.value }), setDetailMessOrther(false))}
                                                    onClear={() => setInformant({ ...informant, detail: '' })} // clear
                                                    value={informant.detail}
                                                    isInvalid={detailMessOrther}
                                                    errorMessage={informant.sla_id === 6 && !informant.detail ? 'กรุณาคีย์รายละเอียด' : ''}
                                                />
                                            </div>
                                            <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12 flex justify-end">

                                                {
                                                    idEditInformant === '' ?
                                                        <Button color="success" variant="flat" onPress={submitInformant}>ส่งข้อมูล</Button>
                                                        :
                                                        <div className='flex gap-3'>
                                                            <Button color="danger" variant="flat" onPress={() => {
                                                                setInformant({ ...informant, sla_id: '', sla_condition: '', urgency_level: '', detail: '' })
                                                                setIdEditInformant('')
                                                            }}>
                                                                ยกเลิก
                                                            </Button>
                                                            <Button color="success" variant="flat" onPress={submitEditInformant}>บันทึกข้อมูล</Button>
                                                        </div>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className='mt-3 mb-5'>
                        <Table
                            className="text-gray-700"
                            aria-label="Teble manage user"
                            topContent={
                                <>
                                    <div className="flex items-center gap-3">
                                        <span className="flex-1 text-default-900 text-xl font-bold">ทั้งหมด {incidentARR.length} รายการ <span className='text-sm text-red-600'>[ค้างการยืนยัน {incidentCountNotConfirm} รายการ]</span></span>

                                        <Input
                                            isClearable
                                            classNames={{
                                                base: "max-w-[20%] flex-1",
                                                inputWrapper: "border-1",
                                            }}
                                            placeholder="ค้นหา"
                                            size='xs'
                                            startContent={<Icon icon="iconamoon:search-fill" className="text-default-300" />}
                                            variant="bordered"
                                            value={searchValue}
                                            onClear={() => ("")}
                                            onValueChange={searchDataUserALL}
                                        />
                                    </div>
                                </>
                            }
                            bottomContent={
                                <div className="py-2 px-2 flex justify-between items-center">
                                    {
                                        pages > 0 ?
                                            <Pagination
                                                loop
                                                // showControls
                                                classNames={{
                                                    cursor: "bg-foreground text-background",
                                                }}
                                                color="default"
                                                page={page}
                                                total={pages}
                                                variant="light"
                                                onChange={setPage}
                                                initialPage={1}
                                            />
                                            : ''
                                    }
                                    <label className="flex items-center text-default-400 text-small">
                                        Rows per page:
                                        <select
                                            className="bg-transparent outline-none text-default-400 text-small"
                                            onChange={onRowsPerPageChange}
                                        >
                                            <option value="10">10</option>
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                    </label>
                                </div>
                            }
                        >
                            <TableHeader>
                                <TableColumn>#</TableColumn>
                                <TableColumn>หมายเลข</TableColumn>
                                <TableColumn>ระดับความด่วน</TableColumn>
                                <TableColumn>สถานที่แจ้ง : เบอร์โทร</TableColumn>
                                <TableColumn>เวลาแจ้ง</TableColumn>
                                <TableColumn>ปัญหาที่แจ้ง</TableColumn>
                                <TableColumn>สถานะ</TableColumn>
                                <TableColumn>ผู้ดำเนินการ : วิธีแก้ไขปัญหา</TableColumn>
                                <TableColumn>สาเหตุหลักของปัญหา</TableColumn>
                                <TableColumn>เวลาเสร็จ</TableColumn>
                                <TableColumn>เวลาที่ใช้</TableColumn>
                                <TableColumn>action</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {incidentARR.slice(start, end).map((item, i) => {
                                    // console.log(item)
                                    return <TableRow key={i}>
                                        <TableCell>{start + i + 1}</TableCell>
                                        <TableCell>{item.incident_year + '/' + item.incident_no}</TableCell>
                                        <TableCell><Chip color={item.urgency_level === 'ด่วน' ? 'danger' : 'success'} variant="flat">{item.urgency_level}</Chip></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p>{item.dept_name}</p>
                                                <p className="text-blue-700">{item.tel}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[7%]">
                                            <div className="flex flex-col">
                                                <p>{moment(item.ins_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                <p>เวลา {moment(item.ins_dt).add(543, 'year').format('HH:mm น.')}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[20%]">
                                            <div className="flex flex-col">
                                                <p>{item.sla_title} <span className='text-yellow-700'>[{item.sla_id < 6 ? `รับประกัน ${item.sla_time} นาที` : item.sla_condition}]</span></p>
                                                <p className="text-red-500">{item.detail !== '' ? item.detail : '-'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell><Chip color={statusIncident[item.incident_status].color} variant="flat">{statusIncident[item.incident_status].label}</Chip></TableCell>
                                        <TableCell className="w-[20%]">
                                            <div className="flex flex-col">
                                                {
                                                    item.incident_logs_arr !== null ? item.incident_logs_arr.map((logItem, i) => {
                                                        return (
                                                            <p key={i} className="text-green-700">
                                                                {logItem.confirm_fullname} : {logItem.action_detail !== null && logItem.action_detail !== '' ? logItem.action_detail : '-'}
                                                            </p>
                                                        )
                                                    }) : '-'
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[10%]"><p className="text-green-700">{item.primary_cause !== null ? item.primary_cause : '-'}</p></TableCell>
                                        <TableCell className="w-[7%]">
                                            {item.close_dt !== null ?
                                                <div className="flex flex-col">
                                                    <p>{moment(item.close_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                    <p>เวลา {moment(item.close_dt).add(543, 'year').format('HH:mm น.')}</p>
                                                </div>
                                                : '-'}
                                        </TableCell>
                                        <TableCell>{item.duration_minutes !== null ? item.duration_minutes : '-'}</TableCell>
                                        <TableCell>{item.incident_status === '4' ?
                                            <div className='flex gap-2'>
                                                <Button color="success" variant="flat" onPress={() => onConfirm(item.id)} >ยอมรับ</Button>
                                                <Button color="danger" variant="flat" onPress={() => onNotConfirm(item.id)} >ไม่ยอมรับ</Button>
                                            </div>
                                            : item.confirm_status === null ? <Button color="warning" variant="flat" onPress={() => geteditInformant(item.id)} >แก้ไข</Button> : item.confirm_status === '1' ? <Chip color="success" variant="flat">{item.confirm_note}</Chip> : <Chip color="danger" variant="flat">{item.confirm_note}</Chip>}
                                        </TableCell>
                                    </TableRow>
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div >
            <footer className="hidden fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-center dark:bg-gray-800 dark:border-gray-600">
                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">สงวนลิขสิทธิ์ © 2568 - {YearNow} <span className='text-emerald-600'>กลุ่มภารกิจสุขภาพดิจิทัล</span></span>
            </footer>
        </>
    )
}

export default Service_desk