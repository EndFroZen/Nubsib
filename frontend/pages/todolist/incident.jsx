import React, { useEffect, useState } from 'react'
import Layout from '../../component/layout'
import HeaderTodolist from './header_todolist'
import { Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Input, Tabs, Tab, Card, CardBody, CardFooter, Image } from "@heroui/react";
import Head from 'next/head'
import jwt_decode from "jwt-decode"
import { Icon } from '@iconify/react';
import axios from 'axios'
import * as moment from 'moment'
import 'moment/locale/th'
moment.locale('th')
import config from '../../config'
const api = config.api
const Swal = require('sweetalert2')
import { delay, statusIncident } from '../../myFunctions'
import { ConfigProvider, TimePicker, DatePicker } from 'antd';
import dayjs from 'dayjs';
import "dayjs/locale/th";
import locale from "antd/locale/th_TH";
const dateFormat = 'YYYY-MM-DD';
const format = 'HH:mm';
// let serverOffset = 0;

// export async function syncServerTime() {
//     try {
//         const response = await axios.get(`${api}/api/server-time`); // เรียก Fastify API
//         const serverTime = dayjs(response.data.serverTime).valueOf();
//         const clientTime = dayjs().valueOf();
//         serverOffset = serverTime - clientTime;
//     } catch (err) {
//         console.error('Error syncing server time:', err);
//     }
// }

// export function getServerTimeOnClient() {
//     return dayjs().add(serverOffset, 'millisecond');
// }

// const serverNow = getServerTimeOnClient(); // ใช้เวลา server

const Incident = () => {

    const [serverOffset, setServerOffset] = useState(0) // ใช้เก็บเวลาที่ต่างกันระหว่าง server และ client
    const [tabNumber, setTabNumber] = useState('in_progress') // in_progress, successful
    const [searchValue, setSearchValue] = useState('') // ค่าที่ใช้ในการค้นหา

    useEffect(() => {
        getDevTeamICT()
        syncServerTime()
        if (localStorage.getItem("token-psoffice")) {
            getIncidentByUsername(tabNumber, jwt_decode(localStorage.getItem("token-psoffice")).username, searchValue)
        }
    }, [])

    const syncServerTime = async () => {
        try {
            const response = await axios.get(`${api}/api/server-time`); // เรียก Fastify API
            const serverTime = dayjs(response.data.serverTime).valueOf();
            const clientTime = dayjs().valueOf();
            setServerOffset(serverTime - clientTime)
        } catch (err) {
            console.error('Error syncing server time:', err);

        }
    }

    const getServerTimeOnClient = () => {
        return dayjs().add(serverOffset, 'millisecond');
    }

    const serverNow = getServerTimeOnClient(); // ใช้เวลา server



    // ฟอร์แมตเวลาที่ใช้
    function formatDiffDynamic(diffMs) {
        const sec = 1000;
        const min = sec * 60;
        const hour = min * 60;
        const day = hour * 24;

        const parts = [];

        const days = Math.floor(diffMs / day);
        const hours = Math.floor((diffMs % day) / hour);
        const minutes = Math.floor((diffMs % hour) / min);
        const seconds = Math.floor((diffMs % min) / sec);

        if (days) parts.push(`${days} วัน`);
        if (hours) parts.push(`${hours} ชม.`);
        if (minutes) parts.push(`${minutes} นาที`);
        if (seconds) parts.push(`${seconds} วินาที`);

        return parts.join(" ");
    }

    // คำนวณเวลาที่ใช้
    const [dateTimeDiffText, setDateTimeDiffText] = useState('') // ข้อความเวลาที่ใช้
    const [dateTimeDiffColor, setDateTimeDiffColor] = useState('green') // สีของเวลาที่ใช้
    function calculateDiff(ins_dt, date, time, sla_time) {
        // เวลาอ้างอิง (วันที่-เวลา จาก incident เดิม)
        const refDateTime = dayjs(ins_dt);

        // รวม date + time
        const selectedDateTime = dayjs(
            `${date} ${time}`,
            `${dateFormat} ${format}`
        );


        // console.log('sla_time : ' + sla_time)
        // คำนวณความต่าง (ms)
        const diffMs = selectedDateTime.diff(refDateTime);
        const diffMinutes = +(diffMs / (1000 * 60)).toFixed(2);

        // กำหนดสี / flag
        let color = 'green'; // default = ผ่าน (เขียว)
        if (sla_time !== null) {
            const slaMinutes = Number(sla_time);
            if (diffMinutes > slaMinutes) {
                color = 'red'; // เกิน SLA → แดง
            }
        }
        setDateTimeDiffColor(color)
        // console.log('diffMinutes : ' + diffMinutes)
        setDateTimeDiffText(formatDiffDynamic(diffMs))
    }


    //-------------------------------------------------------------------------------------- START FUNCTIONS ค้นหา
    const searchDataUserALL = async (value) => {
        setSearchValue(value)
        getIncidentByUsername(tabNumber, jwt_decode(localStorage.getItem("token-psoffice")).username, value)
    }
    //-------------------------------------------------------------------------------------- STOP FUNCTIONS ค้นหา

    //-------------------------------------------------------------------------------------- START GET INCIDENT BY USERNAME
    const [incidentByUsernameARR, setIncidentByUsernameARR] = useState([])
    const getIncidentByUsername = async (tabNumber, username, searchValue) => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-incident-by-username/${tabNumber}/${username}/${searchValue}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setIncidentByUsernameARR(res.data)
            // console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    //-------------------------------------------------------------------------------------- STOP GET INCIDENT BY USERNAME

    //------------------------------------------------------------------- START ตรงนี้ทำ Pagination
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [page, setPage] = React.useState(1);
    const pages = Math.ceil(incidentByUsernameARR.length / rowsPerPage);
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const onRowsPerPageChange = React.useCallback((e) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);
    //------------------------------------------------------------------- END ตรงนี้ทำ Pagination

    //============================================================== START ยืนยันการรับเรื่อง
    const onConfirmReceipt = async (id_logs, id_head) => {
        const token_psoffice = localStorage.getItem("token-psoffice");

        let data = {
            incident_logs_id: id_logs,
            incident_id: id_head,
            confirm_status: '1',
            confirm_comment: 'ยืนยันการรับงาน'
        }

        Swal.fire({
            title: "ยืนยันการรับเรื่อง!",
            text: "คุณต้องการรับเรื่องนี้หรือไม่",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "ใช่, ฉันต้องการรับเรื่องนี้",
            cancelButtonText: "ไม่, ฉันกดผิด"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token_psoffice = localStorage.getItem("token-psoffice");
                    let res = await axios.put(`${api}/incident/confirm-receipt`, data, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                    // console.log(res.data)
                    if (res.data.ok === true) {
                        Swal.fire({
                            position: "top-end",
                            icon: "success",
                            title: "รับเรื่องเองสำเร็จ",
                            showConfirmButton: false,
                            timer: 2000
                        });
                    }
                } catch (error) {
                    console.log(error)
                    Swal.fire({
                        position: "top-end",
                        icon: "error",
                        title: "รับเรื่องเองล้มเหลว",
                        showConfirmButton: false,
                        timer: 2000
                    });
                } finally {
                    getIncidentByUsername(tabNumber, jwt_decode(token_psoffice).username, searchValue)
                }
            }
        })
    }
    //============================================================== STOP ยืนยันการรับเรื่อง

    //============================================================== START ไม่ยืนยันการรับเรื่อง
    const onNotConfirmReceipt = async (id_logs, id_head) => {
        const token_psoffice = localStorage.getItem("token-psoffice");
        Swal.fire({
            title: 'ไม่ยืนยัน การรับเรื่อง !',
            text: 'ไม่รับเรื่อง กรุณากรอกหมายเหตุ',
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
            // console.log(result.value)
            if (result.isConfirmed) {

                let data = {
                    incident_logs_id: id_logs,
                    incident_id: id_head,
                    confirm_status: '9',
                    confirm_comment: result.value
                }
                // console.log(data)
                try {
                    let res = await axios.put(`${api}/incident/not-confirm-receipt`, data, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                    // console.log(res.data)
                    if (res.data.ok = true) {
                        Swal.fire({
                            position: "top-end",
                            icon: "success",
                            title: 'ไม่ยืนยันไม่รับเรื่องสำเร็จ',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    } else {
                        Swal.fire({
                            position: "top-end",
                            icon: "error",
                            title: 'ไม่ยืนยันไม่รับเรื่องล้มเหลว',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    }
                } catch (error) {
                    console.log(error)
                } finally {
                    getIncidentByUsername(tabNumber, jwt_decode(token_psoffice).username, searchValue)
                }
            }
        })
    }
    //============================================================== STOP ไม่ยืนยันการรับเรื่อง



    //============================================================== START FORM ACTIONS SUBMIT
    const [formActions, setFormActions] = useState({ action_detail: '', device: '', date: '', time: '', primary_cause: '', co_operators: [], permission: 0 })

    // เช็คว่าฟอร์มว่างไหม
    const [showErrors, setShowErrors] = useState(false);
    // function เช็คว่าฟอร์มว่างไหม
    const validateForm = () => {
        const isEmpty = !formActions.action_detail || !formActions.date || !formActions.time;
        setShowErrors(isEmpty);
        // console.log(isEmpty)
        return !isEmpty;
    };


    // บันทึกข้อมูล
    const handleOnSubmit = async () => {
        const token_psoffice = localStorage.getItem("token-psoffice");
        let data = {
            incident_head_id: idIncident.id_head,
            incident_logs_id: idIncident.id_logs,
            action_detail: formActions.action_detail,
            primary_cause: formActions.primary_cause,
            device: formActions.device,
            date: formActions.date,
            time: formActions.time,
            co_operators: formActions.co_operators
        }

        if (!validateForm()) {
            Swal.fire({
                position: "top-end",
                icon: "error",
                title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        // console.log(data)
        try {
            let res = await axios.put(`${api}/incident/update-action-detail`, data, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            // console.log(res.data)
            if (res.data.ok === true) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: 'บันทึกข้อมูลสำเร็จ',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: res.data.detail,
                    showConfirmButton: false,
                    timer: 4000
                });
            }
            handleCancelActionDetail()
        } catch (error) {
            console.log(error)
        } finally {
            getIncidentByUsername(tabNumber, jwt_decode(token_psoffice).username, searchValue)
        }
    }
    //============================================================== STOP FORM ACTIONS SUBMIT


    // ตรวจสอบสิทธิ์การแก้ไข (ถ้าเป็น ผู้ร่วมปฏิบัติงาน จะไม่มีสิทธิ์แก้ไข)
    function checkEditPermission(usersArr) {
        const loginUser = jwt_decode(localStorage.getItem("token-psoffice")).username;
        const found = usersArr.find(item => item.username === loginUser);
        if (found && found.confirm_comment === "ผู้ร่วมปฏิบัติงาน") {
            return 0; // ไม่มีสิทธิ์แก้ไข
        }
        return 1; // มีสิทธิ์แก้ไข
    }

    //--------------------------------------------------------------------- START MODAL DETAIL AND ACTIONS คีย์รายละเอียดวิธีการแก้ไขปัญหา
    const [openActionDetail, setOpenActionDetail] = useState(false)
    const [idIncident, setIdIncident] = useState({ id_logs: '', id_head: '' }) // id_logs = incident_logs_id, id_head = incident_id
    const [detailIncident, setDetailIncident] = useState({ number: '', fullname: '', ins_dt: '', dept_name: '', tel: '', urgency_level: '', sla_title: '', sla_time: '', sla_condition: '', detail: '', incident_status: '' }) // รายละเอียดของ incident ที่เลือก
    const handleOpenActionDetail = async (id_logs, id_head) => {
        // console.log(id)
        syncServerTime()

        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-incident-logs-by-id${id_logs}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            let coOperators = await axios.get(`${api}/incident/get-co-operators/${id_head}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })

            // console.log(coOperators.data)
            // สิทธิการแก้ไข 0=ไม่มีสิทธิ์แก้ไข, 1=มีสิทธิ์แก้ไข
            const permission = checkEditPermission(coOperators.data);
            // console.log(permission); // 0 หรือ 1

            //  กรองเอาชื่อ user ที่ login ออก
            const resultUserCo = filterUser(coOperators.data, jwt_decode(localStorage.getItem("token-psoffice")).username).map(item => item.username);
            // console.log(resultUserCo)

            // setDetailIncident(res.data)
            res.data.map((item, i) => {
                // console.log(item)
                setDetailIncident({
                    ...detailIncident,
                    number: item.incident_year + '/' + item.incident_no,
                    fullname: item.fullname_ins_by,
                    ins_dt: item.haed_ins_dt,
                    dept_name: item.dept_name,
                    tel: item.tel,
                    urgency_level: item.urgency_level,
                    sla_title: item.sla_title,
                    sla_time: item.sla_time,
                    sla_condition: item.sla_condition,
                    detail: item.detail,
                    incident_status: item.incident_status
                })

                setFormActions({
                    ...formActions,
                    device: item.device === null ? '' : item.device,
                    action_detail: item.action_detail === null ? '' : item.action_detail,
                    primary_cause: item.primary_cause === null ? '' : item.primary_cause,
                    co_operators: resultUserCo,  // เซ็ตค่าเข้า formActions
                    permission: permission,  // สิทธิการแก้ไข 0=ไม่มีสิทธิ์แก้ไข, 1=มีสิทธิ์แก้ไข
                    date: item.close_dt === null ? serverNow.format('YYYY-MM-DD') : dayjs(item.close_dt).format('YYYY-MM-DD'),
                    time: item.close_dt === null ? serverNow.format('HH:mm') : dayjs(item.close_dt).format('HH:mm')
                });

                calculateDiff(item.haed_ins_dt, item.close_dt === null ? serverNow.format('YYYY-MM-DD') : dayjs(item.close_dt).format('YYYY-MM-DD'), item.close_dt === null ? serverNow.format('HH:mm') : dayjs(item.close_dt).format('HH:mm'), item.sla_time)
            })
        } catch (error) {
            console.log(error)
        }

        setIdIncident({ id_logs: id_logs, id_head: id_head })
        setOpenActionDetail(true)
    }

    const handleCancelActionDetail = () => {
        setShowTextErrorTime('')
        setOpenActionDetail(false)
        setFormActions({ ...formActions, co_operators: [] })
    }
    //--------------------------------------------------------------------- STOP MODAL DETAIL AND ACTIONS คีย์รายละเอียดวิธีการแก้ไขปัญหา



    //============================================================== START VALIDATE TIME
    const [showErrorTime, setShowErrorTime] = useState(false);
    const [showTextErrorTime, setShowTextErrorTime] = useState('')
    const validateTime = async (date, time) => {
        if (moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss') < moment(detailIncident.ins_dt).format('YYYY-MM-DD HH:mm:ss')) {
            setShowErrorTime(true);
            setShowTextErrorTime('ไม่อนุญาตให้ใช้เวลาย้อนหลัง')
        } else {
            setShowErrorTime(false);
            setShowTextErrorTime('')
        }
    };
    //=============================================================== STOP VALIDATE TIME

    //========================================================================================== START TABS 
    let tabs = [
        {
            id: "in_progress",
            label: "งานค้าง"
        },
        {
            id: "successful",
            label: "งานที่เสร็จสิ้น"
        }
    ];
    //========================================================================================== STOP TABS

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

    // =============================== START  เลือกผู้ร่วมงาน
    const toggleSelect = (username) => {
        setFormActions((prev) => ({
            ...prev,
            co_operators: prev.co_operators.includes(username)
                ? prev.co_operators.filter((u) => u !== username) // ถ้ามีอยู่แล้ว → ลบออก
                : [...prev.co_operators, username] // ถ้ายังไม่มี → เพิ่มเข้าไป
        }));
    };
    // =============================== STOP เลือกผู้ร่วมงาน




    return (
        <>
            <Head>
                <title>บันทึกอุบัติการณ์</title>
            </Head>
            <Layout>
                <HeaderTodolist />
                <div className="py-6 px-4 md:px-6 lg:px-8">
                    <Tabs
                        aria-label="tabs_work"
                        size='lg'
                        radius='lg'
                        color={tabNumber === 'in_progress' ? 'warning' : 'success'}
                        variant='bordered'
                        className='flex justify-center'
                        defaultSelectedKey={tabNumber}
                        onSelectionChange={(select_page) => {
                            setTabNumber(select_page)
                            getIncidentByUsername(select_page, jwt_decode(localStorage.getItem("token-psoffice")).username, searchValue)
                        }}
                        items={tabs}
                    >
                        {(item) => (
                            <Tab
                                key={item.id}
                                title={
                                    <div className={`flex items-center space-x-2 ${tabNumber === item.id ? 'text-white font-bold' : 'text-gray-700'}`}>
                                        <Icon className='h-6 w-6' icon={item.id === 'in_progress' ? "lets-icons:time-progress" : "ix:certificate-success"} />
                                        <span>{item.label}</span>
                                    </div>
                                }
                            >

                                <Table
                                    aria-label="Table manage incident"
                                    className="text-gray-700"
                                    topContent={
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-default-900 text-xl font-bold">ทั้งหมด {incidentByUsernameARR.length} รายการ</span>
                                                {/* <Button color="secondary" variant="flat" startContent={<Icon className='h-6 w-6' icon="mynaui:plus-waves" />} onClick={handleOpenRequest} >เพิ่มคำขอพัฒนาซอฟต์แวร์</Button> */}
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
                                                        showControls
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
                                        <TableColumn>สถานที่แจ้ง : เบอร์โทร</TableColumn>
                                        <TableColumn>ปัญหาที่แจ้ง</TableColumn>
                                        <TableColumn>ระบุอุปกรณ์</TableColumn>
                                        <TableColumn>เวลาแจ้ง</TableColumn>
                                        <TableColumn>วิธีแก้ไขปัญหา</TableColumn>
                                        <TableColumn>สาเหตุหลักของปัญหา</TableColumn>
                                        <TableColumn>เวลาเสร็จ</TableColumn>
                                        <TableColumn>เวลาที่ใช้</TableColumn>
                                        <TableColumn>สถานะดำเนินการ</TableColumn>
                                        <TableColumn>action</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {incidentByUsernameARR.slice(start, end).map((item, i) => {
                                            // console.log(item)
                                            return <TableRow key={i}>
                                                <TableCell>{start + i + 1}</TableCell>
                                                <TableCell>{item.incident_year + '/' + item.incident_no}</TableCell>
                                                <TableCell><Chip color={item.urgency_level === 'ด่วน' ? 'danger' : 'success'} variant="flat">{item.urgency_level}</Chip></TableCell>
                                                <TableCell className="w-[8%]">{item.fullname_ins_by}</TableCell>
                                                <TableCell className="w-[8%]">
                                                    <div className="flex flex-col">
                                                        <p>{item.dept_name}</p>
                                                        <p className="text-blue-700">{item.tel}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="w-[14%]">
                                                    <div className="flex flex-col">
                                                        <p>{item.sla_title} <span className='text-yellow-700'>[{item.sla_id < 6 ? `รับประกัน ${item.sla_time} นาที` : item.sla_condition}]</span></p>
                                                        <p className="text-red-500">{item.detail !== '' ? item.detail : '-'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.device && item.device.trim() !== '' ? item.device : '-'}</TableCell>
                                                <TableCell className="w-[7%]">
                                                    <div className="flex flex-col">
                                                        <p>{moment(item.haed_ins_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                        <p>เวลา {moment(item.haed_ins_dt).add(543, 'year').format('HH:mm น.')}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="w-[20%]"><p className="text-green-700">{item.action_detail !== null ? item.action_detail : '-'}</p></TableCell>
                                                <TableCell className="w-[20%]"><p className="text-green-700">{item.primary_cause !== null ? item.primary_cause : '-'}</p></TableCell>
                                                <TableCell className="w-[7%]">
                                                    {
                                                        item.close_dt !== null ?
                                                            <div className="flex flex-col">
                                                                <p>{moment(item.close_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                                <p>เวลา {moment(item.close_dt).add(543, 'year').format('HH:mm น.')}</p>
                                                            </div>
                                                            : '-'
                                                    }
                                                </TableCell>
                                                <TableCell className="w-[8%]">{item.duration_minutes !== null ? item.duration_minutes : '-'}</TableCell>
                                                <TableCell>
                                                    <div className='flex flex-col gap-1'>
                                                        {/* <Chip color={statusIncident[item.incident_status].color} variant="flat">{statusIncident[item.incident_status].label}</Chip> */}
                                                        {item.incident_status === '5' ? <Chip color={item.haed_confirm_status === '0' ? 'danger' : 'success'} variant="flat">{statusIncident[item.incident_status].label + ' : ' + item.haed_confirm_note}</Chip> : <Chip color={statusIncident[item.incident_status].color} variant="flat">{statusIncident[item.incident_status].label}</Chip>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        item.confirm_status === null ?
                                                            <div className='flex gap-2'>
                                                                <Button className='w-full' color="success" variant="flat" onPress={() => onConfirmReceipt(item.id, item.incident_id)} >รับเรื่อง</Button>
                                                                <Button className='w-full' color="danger" variant="flat" onPress={() => onNotConfirmReceipt(item.id, item.incident_id)}>ไม่รับเรื่อง</Button>
                                                            </div>
                                                            : <Button className='w-full' color='warning' variant="flat" onPress={() => handleOpenActionDetail(item.id, item.incident_id)} >แก้ไข</Button>

                                                    }
                                                </TableCell>
                                            </TableRow>
                                        })}
                                    </TableBody>
                                </Table>
                            </Tab>
                        )}
                    </Tabs>

                </div>
            </Layout >

            {/* //========================================================================================== START MODAL DETAIL AND ACTIONS */}
            <Modal isOpen={openActionDetail} onClose={handleCancelActionDetail} placement='center' size='5xl' scrollBehavior='outside' isDismissable={false} >
                <ModalContent>
                    <ModalHeader className="flex text-yellow-700"><span><Icon icon="uil:edit" className='w-7 h-7 mr-2' /></span><span>วิธีการแก้ไขปัญหา</span></ModalHeader>
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
                        <div className="grid grid-cols-12 gap-4">
                            <div className='col-span-6'>
                                <label className='font-semibold'>วิธีแก้ไขปัญหา <span className='text-red-600'>*</span></label>
                                <Textarea
                                    isClearable
                                    variant='bordered'
                                    className="w-full mt-2"
                                    aria-label='วิธีแก้ไขปัญหา'
                                    placeholder="วิธีแก้ไขปัญหา"
                                    value={formActions.action_detail}
                                    onChange={(e) => setFormActions({ ...formActions, action_detail: e.target.value })}
                                    onClear={() => setFormActions({ ...formActions, action_detail: '' })} // clear
                                    isInvalid={showErrors === true ? formActions.action_detail !== '' ? false : true : false} // show error when empty
                                />
                            </div>
                            <div className='col-span-6'>
                                <label className='font-semibold'>สาเหตุหลักของปัญหา</label>
                                <Textarea
                                    isClearable
                                    variant='bordered'
                                    className="w-full mt-2"
                                    aria-label='สาเหตุหลักของปัญหา'
                                    placeholder="สาเหตุหลักของปัญหา"
                                    value={formActions.primary_cause}
                                    isDisabled={formActions.permission !== 1 ? true : false}
                                    // isDisabled={formActions.permission !== 1 || detailIncident.incident_status === '5' ? true : false}
                                    onChange={(e) => setFormActions({ ...formActions, primary_cause: e.target.value })}
                                    onClear={() => setFormActions({ ...formActions, primary_cause: '' })} // clear
                                />
                            </div>
                            <div className='col-span-4'>
                                <div className='flex flex-col'>
                                    <label className='font-semibold'>ระบุอุปกรณ์ (เช่น IP, SWP, ศว.)</label>
                                    <Input
                                        type="text"
                                        placeholder="ระบุอุปกรณ์ (เช่น IP, SWP, ศว.)"
                                        variant="bordered"
                                        className='mt-2'
                                        value={formActions.device}
                                        onChange={(e) => setFormActions({ ...formActions, device: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className='col-span-4'>
                                <div className='flex flex-col'>
                                    <label className='font-semibold'>เลือกวันที่ <span className='text-red-600'>*</span></label>
                                    <ConfigProvider locale={locale}>
                                        <DatePicker
                                            allowClear={false}
                                            className="mt-2"
                                            style={{ borderRadius: 13 }}
                                            size="large"
                                            // ใช้เวลา server เป็น default
                                            defaultValue={getServerTimeOnClient()} // 👈 เวลา default ใช้เวลาจาก server
                                            value={dayjs(formActions.date, dateFormat)} // ค่าที่เก็บไว้ใน formActions
                                            onChange={(date, dateString) => {
                                                calculateDiff(detailIncident.ins_dt, dateString, formActions.time, detailIncident.sla_time)
                                                dateString === ''
                                                    ? setFormActions({
                                                        ...formActions,
                                                        date: getServerTimeOnClient().format(dateFormat) // 👈 ใช้เวลาจาก server หากไม่เลือกวันที่
                                                    })
                                                    : setFormActions({
                                                        ...formActions,
                                                        date: dateString
                                                    })
                                                validateTime(dateString, formActions.time) // validate วันที่และเวลา
                                            }}
                                            disabledDate={(current) =>
                                                current < dayjs(detailIncident.ins_dt, dateFormat) ? true : false // ล็อกวันที่ที่น้อยกว่าที่ insert
                                            }
                                            disabled={detailIncident.incident_status === '5' ? true : false}
                                        />
                                    </ConfigProvider>
                                </div>
                            </div>
                            <div className='col-span-4'>
                                <div className='flex flex-col'>
                                    <div className='flex justify-between'> <label className='font-semibold'>เลือกเวลา <span className='text-red-600'>*</span></label>  {dateTimeDiffText !== '' ? <span className={`text-${dateTimeDiffColor}-600 text-sm font-bold`}>{dateTimeDiffText}</span> : ''}</div>
                                    <ConfigProvider locale={locale}>
                                        <TimePicker
                                            allowClear={false}
                                            className="mt-2"
                                            style={{ borderRadius: 13 }}
                                            size="large"
                                            defaultValue={getServerTimeOnClient()}
                                            format={format}
                                            value={dayjs(formActions.time, format)}
                                            disabled={detailIncident.incident_status === '5'}
                                            status={showErrorTime ? 'error' : ''}
                                            onChange={(time, timeString) => {
                                                calculateDiff(detailIncident.ins_dt, formActions.date, timeString, detailIncident.sla_time)
                                                timeString === ''
                                                    ? setFormActions({
                                                        ...formActions,
                                                        time: getServerTimeOnClient().format(format)
                                                    })
                                                    : setFormActions({
                                                        ...formActions,
                                                        time: timeString
                                                    })
                                                validateTime(formActions.date, timeString) // validate วันที่และเวลา
                                            }}
                                            disabledTime={() => {
                                                const selectedDate = dayjs(formActions.date || getServerTimeOnClient().format('YYYY-MM-DD'), 'YYYY-MM-DD');
                                                const insertDate = dayjs(detailIncident.ins_dt).add(1, 'minute');

                                                // ถ้าเลือกวัน > วันเพิ่มข้อมูล => ไม่ต้องล็อก
                                                if (selectedDate.isAfter(insertDate, 'day')) {
                                                    return {}; // ไม่บล็อกเวลาใด ๆ
                                                }

                                                // ถ้าเลือกวันเดียวกัน => บล็อกเวลาน้อยกว่าเวลาที่เพิ่ม
                                                if (selectedDate.isSame(insertDate, 'day')) {
                                                    const minHour = insertDate.hour();
                                                    const minMinute = insertDate.minute();

                                                    return {
                                                        disabledHours: () =>
                                                            Array.from({ length: 24 }, (_, i) => i).filter((h) => h < minHour),
                                                        disabledMinutes: (selectedHour) => {
                                                            if (selectedHour === minHour) {
                                                                return Array.from({ length: 60 }, (_, i) => i).filter((m) => m < minMinute);
                                                            }
                                                            return [];
                                                        }
                                                    };
                                                }

                                                // ถ้าเลือกวันก่อนหน้า (ซึ่งไม่น่าเกิดขึ้นเพราะ datePicker ล็อกอยู่แล้ว)
                                                return {
                                                    disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
                                                    disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i)
                                                };
                                            }}
                                        />
                                    </ConfigProvider>
                                    <span className='text-red-600 text-sm'>{showTextErrorTime}</span>
                                </div>
                            </div>
                            <div className="col-span-12">
                                <label className='font-semibold'>ผู้ร่วมปฏิบัติงาน</label>
                                <div className="gap-4 grid grid-cols-8 mt-2">
                                    {ictAllARR.map((item, index) => {
                                        const isActive = formActions.co_operators.includes(item.username); // เช็คว่าคนนี้ถูกเลือกอยู่ไหม
                                        return (
                                            <Card
                                                key={index}
                                                isPressable={formActions.permission === 1 && detailIncident.incident_status !== '5'}
                                                shadow="sm"
                                                onPress={() => toggleSelect(item.username)}
                                                className={`${isActive ? " bg-yellow-200" : ""} ${formActions.permission !== 1 || detailIncident.incident_status === '5' ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color={showErrorTime ? 'warning' : 'success'} variant="flat" onPress={handleOnSubmit} isDisabled={showErrorTime} isLoading={showErrorTime} >
                            {showErrorTime ? 'กรุณาเลือกเวลาใหม่' : 'บันทึกข้อมูล'}
                        </Button>
                        <Button color="danger" variant="flat" onPress={handleCancelActionDetail}>
                            ปิด
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal >
            {/* //========================================================================================== STOP MODAL DETAIL AND ACTIONS */}
        </>
    )
}

export default Incident