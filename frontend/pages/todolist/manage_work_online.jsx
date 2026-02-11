import React, { useEffect, useState } from 'react'
import Layout from '../../component/layout'
import HeaderTodolist from './header_todolist'
import jwt_decode from "jwt-decode"
import Head from 'next/head'
import { Icon } from '@iconify/react';
import { Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, Textarea, Button, Card, CardFooter, Image, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Autocomplete, AutocompleteItem } from "@heroui/react";
import axios from 'axios'
import { usePathname } from 'next/navigation'
import * as moment from 'moment'
import 'moment/locale/th'
moment.locale('th')
import config from '../../config'
const api = config.api
const Swal = require('sweetalert2')
const Manage_work_online = () => {
    const pathname = usePathname()

    useEffect(() => {
        const token_psoffice = localStorage.getItem('token-psoffice')
        let pathARR = pathname.split('/')
        // console.log(pathARR)
        // console.log(jwt_decode(token).username)
        if (token_psoffice) {
            getRole(jwt_decode(token_psoffice).username, pathARR[1])
        }
        getIncidentOnline()
        getDevTeamICT()


        getAllDept() // ดึงข้อมูล DEPT ทั้งหมด
        chkDeptByUsername() // ดึงข้อมูล DEPT จาก username
        getSla() // ดึงข้อมูล SLA
        getUsers() // ดึงข้อมูลผู้แจ้งทั้งหมด   
    }, [])

    // get /check-role      fastify.get('/check-role/:username/:pathroom',
    const [role, setRole] = useState('')
    const getRole = async (username, pathroom) => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/ps_applications/check-role/${username}/${pathroom}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setRole(res.data)
            // console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }

    const [getUsersAll, setGetUsersAll] = useState([]) // รายชื่อทั้งหมดโณงพยาบาล
    const getUsers = async () => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-users-all`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setGetUsersAll(res.data)

        } catch (error) {
            console.log(error)
        }
    }

    // ดึงข้อมูล incident ทั้งหมด
    const [incidentOnlineARR, setIncidentOnlineARR] = useState([])
    const getIncidentOnline = async () => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-incident-all-online`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setIncidentOnlineARR(res.data)
            // console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }

    // กรองเอาชื่อ user ที่ login ออก
    function filterUser(data, currentUser) {
        return data.filter(item => item.username !== currentUser);
    }
    //---------------------------------------------------------------------------- START GET ICT ALL
    const [ictAllARR, setIctAllARR] = useState([])
    //-------------------------------------- ดึงรายชื่อ ICT ทั้งหมด
    const getDevTeamICT = async () => {
        try {
            const token_psoffice = localStorage.getItem('token-psoffice')
            let res = await axios.get(`${api}/system_request/get-ict-all`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            // console.log(res.data)
            const result = filterUser(res.data, jwt_decode(localStorage.getItem("token-psoffice")).username);
            setIctAllARR(result)
        } catch (error) {
            console.log(error)
        }
    }

    //------------------------------------------------------------------- START ตรงนี้ทำ Pagination
    const [rowsPerPage, setRowsPerPage] = React.useState(10)
    const [page, setPage] = React.useState(1)
    const pages = Math.ceil(incidentOnlineARR.length / rowsPerPage)
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    const onRowsPerPageChange = React.useCallback((e) => {
        setRowsPerPage(Number(e.target.value))
        setPage(1)
    }, [])
    //------------------------------------------------------------------- END ตรงนี้ทำ Pagination


    //--------------------------------------------------------------------- START MODAL DETAIL AND ACTIONS
    const [openDetailOfferWork, setOpenDetailOfferWork] = useState(false)
    const [idIncident, setIdIncident] = useState('')
    const [detailIncident, setDetailIncident] = useState({ number: '', fullname: '', ins_dt: '', dept_name: '', tel: '', urgency_level: '', sla_title: '', sla_time: '', sla_condition: '', detail: '' }) // รายละเอียดของ incident ที่เลือก
    const handleOpenDetailOfferWork = async (id) => {
        // console.log(id)

        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-incident-online-by-id/${id}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            // console.log(res.data)
            // setDetailIncident(res.data)
            res.data.map((item, i) => {
                // console.log(item)
                setDetailIncident({
                    ...detailIncident,
                    number: item.incident_year + '/' + item.incident_no,
                    fullname: item.fullname,
                    ins_dt: item.ins_dt,
                    dept_name: item.dept_name,
                    tel: item.tel,
                    urgency_level: item.urgency_level,
                    sla_title: item.sla_title,
                    sla_time: item.sla_time,
                    sla_condition: item.sla_condition,
                    detail: item.detail
                })
            }
            )
        } catch (error) {
            console.log(error)
        }

        setIdIncident(id)
        setOpenDetailOfferWork(true)
    }

    const handleCancelDetailOfferWork = () => {
        setOpenDetailOfferWork(false)
        setAddTeamDevICT([])
    }
    //--------------------------------------------------------------------- STOP MODAL DETAIL AND ACTIONS


    //--------------------------------------------------------------------- START ตรงนี้เป็นการเพิ่มทีม ICT ให้กับงาน   //มอบหมายงานให้
    const [addTeamDevICT, setAddTeamDevICT] = useState([]); // รายชื่อที่ถูกมอบหมาย
    // const [selectedUsers, setSelectedUsers] = useState(null); // รายชื่อที่เลือกก่อนยืนยัน

    const selectedUsers = (username) => {
        // setAddTeamDevICT((prev) =>
        //     prev.includes(username)
        //         ? prev.filter((u) => u !== username) // ถ้ามีอยู่แล้ว → ลบออก (ยกเลิกเลือก)
        //         : [...prev, username] // ถ้ายังไม่มี → เพิ่มเข้าไป
        // );

        setAddTeamDevICT((prev) =>
            prev.includes(username) ? [] : [username] // ถ้ามีอยู่แล้ว → เคลียร์ออก, ถ้ายังไม่มี → เก็บแค่ username เดียว
        );
    };


    // เมื่อเลือกชื่อจาก Autocomplete
    /*
    const selectUser = (username) => {
        setSelectedUsers(username);
    };
    */

    // ยืนยันการเลือก → เพิ่มเข้า addTeamDevICT (ถ้าไม่มีซ้ำ)
    /*
    const confirmSelection = () => {
        if (selectedUsers && !addTeamDevICT.includes(selectedUsers)) {
            setAddTeamDevICT([...addTeamDevICT, selectedUsers]);
        } else {
            Swal.fire({
                position: "center",
                icon: "warning",
                title: "รายชื่อซ้ำ โปรดเลือกใหม่",
                showConfirmButton: false,
                timer: 3000
            });
        }
        setSelectedUsers(null); // เคลียร์ค่าที่เลือกหลังจากเพิ่ม
    };
    */

    // ลบสมาชิกที่ถูกมอบหมาย
    /*
    const removeTeamMember = (username) => {
        setAddTeamDevICT((prev) => prev.filter((user) => user !== username));
    };
    */

    // ยืนยันการมอบหมายงาน
    const onSubmitOfferWork = async () => {
        let data = {
            'incident_id': idIncident,
            'username': addTeamDevICT
        }
        // console.log(data)

        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.post(`${api}/incident/add-task-assignees`, data, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            // console.log(res.data)
            if (res.data.ok === true) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: res.data.detail,
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        } catch (error) {
            console.log(error)
            Swal.fire({
                position: "top-end",
                icon: "error",
                title: error.response.data.detail,
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            getIncidentOnline()
            handleCancelDetailOfferWork()
            setAddTeamDevICT([])
        }
    }
    //--------------------------------------------------------------------- STOP ตรงนี้เป็นการเพิ่มทีม ICT ให้กับงาน   //มอบหมายงานให้ 


    //--------------------------------------------------------------------- START ตรงนี้เป็นการรับงานเอง
    const selfAssignTask = async (incident_id) => {
        let data = {
            'incident_id': incident_id
        }

        Swal.fire({
            title: "แจ้งเตือน!",
            text: "คุณต้องการรับงานเองใช่หรือไม่",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "ใช่, ฉันต้องการรับงานเอง",
            cancelButtonText: "ไม่, ฉันกดผิด"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token_psoffice = localStorage.getItem("token-psoffice");
                    let res = await axios.post(`${api}/incident/self-assign-task`, data, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                    // console.log(res.data)
                    if (res.data.ok === true) {
                        Swal.fire({
                            position: "top-end",
                            icon: "success",
                            title: res.data.detail,
                            showConfirmButton: false,
                            timer: 3000
                        });
                    }
                } catch (error) {
                    console.log(error)
                    Swal.fire({
                        position: "top-end",
                        icon: "error",
                        title: error.response.data.detail,
                        showConfirmButton: false,
                        timer: 3000
                    });
                } finally {
                    getIncidentOnline()
                }
            }
        })
    }
    //--------------------------------------------------------------------- STOP ตรงนี้เป็นการรับงานเอง



    //================================================================================================================ START ส่วนนี้ ไอทีเป็นคนเพิ่มเอง ==========================================================================

    //--------------------------------------------------------------------- START ข้อมูลผู้แจ้ง
    const [informant, setInformant] = useState({ username: '', name_ins_by: '', sla_id: '', sla_title: '', sla_time: '', sla_condition: '', dept_id: '', dept_name: '', tel: '', urgency_level: '', detail: '', source: 'it_requert' })
    //--------------------------------------------------------------------- STOP ข้อมูลผู้แจ้ง

    //--------------------------------------------------------------------- START ข้อมูล SLA
    const [slaARR, setSlaARR] = useState([])
    const getSla = async () => {
        try {
            const token_psoffice = localStorage.getItem('token-psoffice')
            let res = await axios.get(`${api}/incident/get-sla-all`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setSlaARR(res.data)
            // console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    //--------------------------------------------------------------------- STOP ข้อมูล SLA

    //--------------------------------------------------------------------- START ดึงข้อมูล DEPT ทั้งหมด
    const [deptARR, setDeptARR] = useState([])
    const getAllDept = async () => {
        try {
            const token_psoffice = localStorage.getItem('token-psoffice')
            let res = await axios.get(`${api}/incident/get-dept-all`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setDeptARR(res.data)
            // console.log(res.data[0])
        } catch (error) {
            console.log(error)
        }
    }
    //--------------------------------------------------------------------- STOP ดึงข้อมูล DEPT ทั้งหมด
    //--------------------------------------------------------------------- START ดึงข้อมูล DEPT จาก username
    const chkDeptByUsername = async (data) => {
        // console.log(data)
        if (data !== null && data !== undefined) {
            try {
                const token_psoffice = localStorage.getItem('token-psoffice')
                let res = await axios.get(`${api}/incident/chk-dept-by-username/${data.username}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                // console.log(res.data[0])
                setInformant({ ...informant, username: data.username, name_ins_by: data.tname, dept_id: res.data[0].dept_id.toString(), dept_name: res.data[0].name, tel: res.data[0].tel })
            } catch (error) {
                console.log(error)
            }
        } else {
            setInformant({ ...informant, username: '', name_ins_by: '', dept_id: '', dept_name: '', tel: '' })
        }

    }
    //--------------------------------------------------------------------- STOP ดึงข้อมูล DEPT จาก username

    //--------------------------------------------------------------------- START ฟังก์ชันเปลี่ยนแผนก
    const changeDept = async (value) => {
        // console.log(value)
        if (value) {
            try {
                const token_psoffice = localStorage.getItem('token-psoffice')
                let res = await axios.get(`${api}/incident/chk-tel-by-deptid/${value}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
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

    //--------------------------------------------------------------------- START เลือก SLA
    const selectSLA = (sla_id, sla_title, sla_time, sla_condition) => {
        setInformant({ ...informant, sla_id: sla_id, sla_title: sla_title, sla_time: sla_time, sla_condition: sla_condition, urgency_level: sla_id < 6 ? 'ด่วน' : 'ไม่ด่วน' })
    }
    //--------------------------------------------------------------------- STOP เลือก SLA



    const [openAddServiceDesk, setOpenAddServiceDesk] = useState(false)
    const handleOpenAddServiceDesk = async () => {
        setOpenAddServiceDesk(true)
    }
    const handleCancelAddServiceDesk = () => {
        setOpenAddServiceDesk(false)
    }


    //====================================================================== START ฟังก์ชันส่งข้อมูลผู้แจ้ง
    const [detailMessOrther, setDetailMessOrther] = useState(false)
    const submitInformant = async () => {
        // console.log(informant)
        if (informant.username === '') {
            Swal.fire({
                position: "top-end",
                icon: 'error',
                title: 'กรุณาเลือกชื่อผู้แจ้ง',
                showConfirmButton: false,
                timer: 3000
            })
        } else if (informant.sla_id === '') {
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
                const token_psoffice = localStorage.getItem('token-psoffice')
                let res = await axios.post(`${api}/incident/insert-informant-online`, informant, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                // console.log(res.data)
                if (res.data.ok === true) {
                    Swal.fire({
                        position: "top-end",
                        icon: 'success',
                        title: 'ส่งข้อมูลสำเร็จ',
                        showConfirmButton: false,
                        timer: 3000
                    })
                    setInformant({ ...informant, username: '', name_ins_by: '', sla_id: '', sla_title: '', sla_time: '', sla_condition: '', dept_id: '', dept_name: '', tel: '', urgency_level: '', detail: '' })
                    setOpenAddServiceDesk(false)
                    getIncidentOnline()
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
            }
        }
    }
    //====================================================================== START ฟังก์ชันส่งข้อมูลผู้แจ้ง
    //================================================================================================================ ส่วนนี้ ไอทีเป็นคนเพิ่มเอง ==========================================================================

    return (
        <>
            <Head>
                <title>จัดการคำขอออนไลน์</title>
            </Head>
            <Layout>
                <HeaderTodolist />
                <div className="py-6 px-4 md:px-6 lg:px-8">
                    <Table
                        className="text-gray-700"
                        aria-label="Table manage requert online"
                        topContent={
                            <>
                                {/* <div className="flex items-center gap-3"> */}
                                <div className="flex justify-between items-center">
                                    <span className="text-default-700 text-xl font-bold">ทั้งหมด {incidentOnlineARR.length} รายการ</span>
                                    <Button className='w-52' radius="full" color='primary' variant="shadow" onPress={handleOpenAddServiceDesk} ><Icon className='w-6 h-6' icon="ic:round-post-add" />เพิ่มคำขอออนไลน์</Button>
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
                            <TableColumn>ชื่อผู้แจ้ง</TableColumn>
                            <TableColumn>สถานที่แจ้ง</TableColumn>
                            <TableColumn>เบอร์โทร</TableColumn>
                            <TableColumn>เวลาแจ้ง</TableColumn>
                            <TableColumn>ปัญหาที่แจ้ง</TableColumn>
                            <TableColumn>รายละเอียดเพิ่มเติม</TableColumn>
                            <TableColumn>สถานะ</TableColumn>
                            <TableColumn>action</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {
                                incidentOnlineARR.slice(start, end).map((item, i) => {
                                    // console.log(item)
                                    return <TableRow key={i}>
                                        <TableCell>{start + i + 1}</TableCell>
                                        <TableCell>{item.incident_year + '/' + item.incident_no}</TableCell>
                                        <TableCell><Chip color={item.urgency_level === 'ด่วน' ? 'danger' : 'success'} variant="flat">{item.urgency_level}</Chip></TableCell>
                                        <TableCell>{item.fullname}</TableCell>
                                        <TableCell>{item.dept_name}</TableCell>
                                        <TableCell>{item.tel}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p>{moment(item.ins_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                <p>เวลา {moment(item.ins_dt).add(543, 'year').format('HH:mm น.')}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p>{item.sla_title}</p>
                                                <p className="text-default-500">[{item.sla_id < 6 ? `รับประกัน ${item.sla_time} นาที` : item.sla_condition}]</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[20%]">{item.detail !== '' ? item.detail : '-'}</TableCell>
                                        <TableCell>
                                            <div className='flex flex-col gap-1'>
                                                <Chip variant="flat" color={item.offer_by === null ? 'success' : item.incident_status === '2' ? 'secondary' : 'warning'}>
                                                    {item.offer_by === null ? 'งานเข้าใหม่' : item.incident_status === '2' ? 'มอบงานให้' : 'เคยมอบแล้ว ถูกปฏิเสธ'}
                                                </Chip>
                                                {
                                                    item.assigned_by_name?.split(',').filter(Boolean).map((entry, index) => {
                                                        const [name, statusRaw, commentRaw] = entry.split('|');
                                                        const status = statusRaw?.toUpperCase() !== 'NULL' && statusRaw;
                                                        const comment = commentRaw?.toUpperCase() !== 'NULL' && commentRaw;
                                                        const label = `${name} : ${comment}`;
                                                        return (status === '9' && <Chip key={index} variant="flat" color='danger'>{label}</Chip>)
                                                    })
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell >
                                            {
                                                item.incident_status === '1' ?
                                                    <div className='flex gap-2'>
                                                        {role.role === 'superadmin' && <Button className='w-full' color="secondary" variant="shadow" onPress={() => handleOpenDetailOfferWork(item.id)} >มอบงาน</Button>}
                                                        <Button className='w-full' color="primary" variant="shadow" onPress={() => selfAssignTask(item.id)} >รับงานเอง</Button>
                                                    </div>
                                                    :
                                                    <div>
                                                        {/* <div className="text-sm font-semibold mb-1">มอบงานให้ :</div> */}
                                                        <div className="flex flex-col gap-2">
                                                            {
                                                                item.assigned_by_name?.split(',').filter(Boolean).map((entry, index) => {
                                                                    const [name, statusRaw, commentRaw] = entry.split('|');
                                                                    const status = statusRaw?.toUpperCase() === 'NULL' ? null : statusRaw;
                                                                    const comment = commentRaw?.toUpperCase() === 'NULL' ? null : commentRaw;
                                                                    const label = `${name} : ${comment ?? 'รอรับงาน'}`;
                                                                    let bgColor = 'bg-gray-100 text-gray-800';
                                                                    if (status === '9') {
                                                                        bgColor = 'danger';
                                                                    } else if (!status) {
                                                                        bgColor = 'secondary';
                                                                    }
                                                                    return (<Chip key={index} variant="flat" color={bgColor}>{label}</Chip>)
                                                                })
                                                            }
                                                        </div>

                                                    </div>

                                            }
                                        </TableCell>
                                    </TableRow>
                                })
                            }
                        </TableBody>
                    </Table>
                </div>
            </Layout>

            {/* //========================================================================================== START MODAL DETAIL AND ACTIONS */}
            <Modal isOpen={openDetailOfferWork} onClose={handleCancelDetailOfferWork} placement='center' size='5xl' scrollBehavior='outside' isDismissable={false}>
                <ModalContent>
                    <ModalHeader className="flex text-purple-700"><span><Icon icon="pajamas:share" className='w-7 h-7 mr-2' /></span><span>มอบหมายงาน</span></ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-12 gap-4">
                            <div className='col-span-2'>
                                <label className='font-semibold'>หมายเลข</label>
                                <p>{detailIncident.number}</p>
                            </div>
                            <div className='col-span-3'>
                                <label className='font-semibold'>วันที่แจ้ง</label>
                                <div className="flex flex-col">
                                    <p>{moment(detailIncident.ins_dt).add(543, 'year').format('LLL น.')}</p>
                                </div>
                            </div>
                            <div className='col-span-3'>
                                <label className='font-semibold'>ชื่อผู้แจ้ง</label>
                                <p>{detailIncident.fullname}</p>
                            </div>
                            <div className='col-span-4'>
                                <label className='font-semibold'>แผนก</label>
                                <p>{detailIncident.dept_name}</p>
                            </div>
                            <div className='col-span-3'>
                                <label className='font-semibold'>เบอร์โทร</label>
                                <p>{detailIncident.tel}</p>
                            </div>
                        </div>
                        <hr />
                        <div className="grid grid-cols-12 gap-4">
                            <div className='col-span-3'>
                                <label className='font-semibold'>ระดับความด่วน</label>
                                <p className={`text-${detailIncident.urgency_level === 'ด่วน' ? 'red' : 'success'}-600`}>{detailIncident.urgency_level}</p>
                            </div>
                            <div className='col-span-3'>
                                <label className='font-semibold'>ปัญหาที่แจ้ง</label>
                                <p>{detailIncident.sla_title}</p>
                            </div>

                            <div className='col-span-3'>
                                <label className='font-semibold'>เวลาที่รับประกัน</label>
                                <p>{detailIncident.sla_time !== null ? detailIncident.sla_time + ' นาที' : detailIncident.sla_condition}</p>
                            </div>
                            <div className='col-span-12'>
                                <label className='font-semibold'>รายละเอียดเพิ่มเติม</label>
                                <p>{detailIncident.detail !== '' ? detailIncident.detail : '-'}</p>
                            </div>
                        </div>
                        <hr />
                        <label className='font-semibold'>มอบหมายงานให้ <span className='text-danger'>*</span></label>
                        <div className="grid grid-cols-8 gap-4">
                            {ictAllARR.map((item, index) => {
                                const isActive = addTeamDevICT.includes(item.username); // เช็คว่าคนนี้ถูกเลือกอยู่ไหม
                                return (
                                    <Card
                                        key={index}
                                        isPressable
                                        shadow="sm"
                                        onPress={() => selectedUsers(item.username)}
                                        className={isActive ? " bg-purple-300" : ""}
                                    >
                                        <CardBody className="overflow-visible p-0">
                                            <Image
                                                alt={item.tname}
                                                className="w-full object-cover h-[125px]"
                                                radius="lg"
                                                shadow="sm"
                                                src={"../../img/team_ict/" + item.username + ".png"}
                                                width="100%"
                                            />
                                        </CardBody>
                                        <CardFooter className="p-2 justify-center">
                                            <b>{item.tname.split(" ")[0]}</b>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                            {/* Autocomplete เลือกชื่อ */}
                            {/* <div className="col-span-9 sm:col-span-9">
                                <Autocomplete
                                    aria-label="selectictall"
                                    placeholder="มอบหมายงานให้"
                                    onSelectionChange={selectUser}
                                    selectedKey={selectedUsers}
                                >
                                    {ictAllARR.map((item) => (
                                        <AutocompleteItem key={item.username} value={item.username}>
                                            {item.tname}
                                        </AutocompleteItem>
                                    ))}
                                </Autocomplete>
                            </div> */}

                            {/* ปุ่มเพิ่ม */}
                            {/* <div className="col-span-3 sm:col-span-3">
                                <Button
                                    onPress={confirmSelection}
                                    className="w-full"
                                    color='secondary'
                                    variant="flat"
                                    startContent={<Icon className="h-6 w-6" icon="mynaui:plus-waves" />}
                                    isDisabled={!selectedUsers}
                                >
                                    เพิ่ม
                                </Button>
                            </div> */}

                            {/* ตารางแสดงรายชื่อ */}
                            {/* <div className="col-span-12 sm:col-span-12">
                                <Table removeWrapper aria-label="table add team dev" className="mt-1">
                                    <TableHeader>
                                        <TableColumn>ลำดับ</TableColumn>
                                        <TableColumn>ชื่อ-สกุล</TableColumn>
                                        <TableColumn>ลบ</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {addTeamDevICT.map((username, index) => (
                                            <TableRow key={username}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{ictAllARR.find(item => item.username === username)?.tname || username}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        color="danger"
                                                        variant="flat"
                                                        startContent={<Icon className="h-6 w-6" icon="material-symbols:delete-outline" />}
                                                        onPress={() => removeTeamMember(username)}
                                                    >
                                                        ลบ
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div> */}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="success" variant="flat" onPress={onSubmitOfferWork} isDisabled={addTeamDevICT.length > 0 ? false : true} >
                            บันทึก
                        </Button>
                        <Button color="danger" variant="flat" onPress={handleCancelDetailOfferWork}>
                            ปิด
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* //========================================================================================== STOP MODAL DETAIL AND ACTIONS */}


            <Modal isOpen={openAddServiceDesk} onClose={handleCancelAddServiceDesk} placement='center' size='5xl' scrollBehavior='outside' isDismissable={false} >
                <ModalContent>
                    <ModalHeader className="flex text-primary-700"><span><Icon icon="ic:round-post-add" className='w-7 h-7 mr-2' /></span><span>เพิ่มคำขอออนไลน์</span></ModalHeader>
                    <ModalBody>
                        <div className="gap-6 grid grid-cols-12">
                            <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-8 2xl:col-span-8">
                                <div className="gap-3 grid grid-cols-12">
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                        <label className="block text-xl font-bold text-gray-800">เลือกประเภทปัญหา (มีรับประกันเวลา)<span className='text-danger'>*</span></label>
                                    </div>
                                    {/* {
                                        slaARR.map((item, i) => {
                                            return <div key={i} style={{ animationDelay: `${i * 0.3}s` }} className="col-span-6 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4 animate__animated animate__flipInX" onClick={() => selectSLA(item.sla_id, item.sla_title, item.sla_time, item.sla_condition)}>
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
                                                        height={165}
                                                        width='100%'
                                                    />
                                                    <CardFooter className="before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                                                        <p className={`${informant.sla_id === item.sla_id ? 'text-white font-bold' : 'text-gray-8'}`}>{item.sla_title} </p>
                                                    </CardFooter>
                                                </Card>
                                            </div>
                                        })
                                    } */}
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
                                                        <p className={`${informant.sla_id === item.sla_id ? 'text-white font-bold' : 'text-gray-8'}`}>{item.sla_title}</p>
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
                                                    className="col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6 animate__animated animate__flipInX"

                                                >
                                                    <Button
                                                        className="w-full h-16"
                                                        color={informant.sla_id === item.sla_id ? "danger" : "default"}
                                                        variant={informant.sla_id === item.sla_id ? "solid" : "bordered"}
                                                        onPress={() => selectSLA(item.sla_id, item.sla_title, item.sla_time, item.sla_condition)}
                                                    >
                                                        <div className="overflow-hidden">
                                                            <p className="text-base font-bold">{item.sla_title}</p>
                                                            {/* <p className={`truncate ${informant.sla_id === item.sla_id ? 'text-gray-100' : 'text-gray-700'}`}>{item.sla_condition}</p> */}
                                                        </div>
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    }

                                </div>
                                {/* <label className="block mt-2 font-bold text-red-700">{informant.sla_condition !== '' && '*' + informant.sla_condition}</label> */}
                                <label className="block mt-2 font-bold text-red-700">
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
                                        <label className="block text-xl font-bold text-gray-800">ข้อมูลผู้แจ้ง<span className='text-danger'>*</span></label>
                                    </div>
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                        <label className="block mb-2 text-sm font-medium text-gray-800">ชื่อผู้แจ้งเหตุ<span className='text-danger'>*</span></label>
                                        <Autocomplete
                                            aria-label="select-users"
                                            placeholder="ชื่อผู้แจ้ง"
                                            size='md'
                                            selectedKey={informant.username}
                                            onSelectionChange={(key) => {
                                                // console.log(key)
                                                const selected = getUsersAll.find((user) => user.username === key);
                                                // console.log(selected)
                                                chkDeptByUsername(selected)
                                            }}
                                        >
                                            {getUsersAll.map((item) => {
                                                return (
                                                    <AutocompleteItem key={item.username}>
                                                        {item.username + ' - ' + item.tname}
                                                    </AutocompleteItem>
                                                );
                                            })}
                                        </Autocomplete>
                                    </div>
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                        <label className="block mb-2 text-sm font-medium text-gray-800">แผนก<span className='text-danger'>*</span></label>
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
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                                        <label className="block mb-2 text-sm font-medium text-gray-800">เบอร์โทร</label>
                                        <Input
                                            type="text"
                                            value={informant.tel}
                                            onChange={(e) => setInformant({ ...informant, tel: e.target.value })}
                                            placeholder="เบอร์โทร"
                                        />
                                    </div>
                                    <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                                        <label className="block mb-2 text-sm font-medium text-gray-800">ระดับความด่วน</label>
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
                                        <label className="block mb-2 text-sm font-medium text-gray-800">รายละเอียดเพิ่มเติม</label>
                                        {/* <Textarea
                                            isClearable
                                            className="w-full"
                                            placeholder="รายละเอียดเพิ่มเติม"
                                            onChange={(e) => setInformant({ ...informant, detail: e.target.value })}
                                            value={informant.detail}
                                        /> */}
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

                                </div>
                            </div>

                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="success" variant="flat" onPress={submitInformant}>
                            ส่งข้อมูล
                        </Button>
                        <Button color="danger" variant="flat" onPress={handleCancelAddServiceDesk}>
                            ปิด
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

export default Manage_work_online