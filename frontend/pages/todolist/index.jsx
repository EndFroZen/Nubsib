import React, { useEffect, useState } from 'react'
import Layout from '../../component/layout'
import HeaderTodolist from './header_todolist'
import Head from 'next/head'
import { Icon } from '@iconify/react'
import { Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, Card, CardBody, CardHeader, Button } from "@heroui/react";
import jwt_decode from "jwt-decode"
import axios from 'axios'
import * as moment from 'moment'
import 'moment/locale/th'
moment.locale('th')
import config from '../../config'
import { statusIncident } from '../../myFunctions'
import { ConfigProvider, DatePicker } from 'antd';
import locale from "antd/locale/th_TH";
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import interactionPlugin from '@fullcalendar/interaction';
// import thLocale from '@fullcalendar/core/locales/th'

const api = config.api
const Index = () => {


    const [searchValue, setSearchValue] = useState('')

    useEffect(() => {
        getIncidentDashBoard(searchValue)
        getIncidentDashboardNumbersByStatus()
        // getIncidentByCondition()
    }, [])


    //----------------------------------------------------------------- START ตรงนี้ดึงข้อมูล Dashboard จำนวนตัวเลข
    const [incidentDashboardNumbersByStatus, setIncidentDashboardNumbersByStatus] = useState([])
    const getIncidentDashboardNumbersByStatus = async () => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-incident-dashboard-numbers-by-status`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setIncidentDashboardNumbersByStatus(res.data[0])
            // console.log(res.data[0])
        } catch (error) {
            console.log(error)
        }
    }
    //----------------------------------------------------------------- STOP ตรงนี้ดึงข้อมูล Dashboard จำนวนตัวเลข

    //-------------------------------------------------------------------------------------- START FUNCTIONS ค้นหา
    const searchDataUserALL = async (value) => {
        setSearchValue(value)
        getIncidentDashBoard(value)
    }
    //-------------------------------------------------------------------------------------- STOP FUNCTIONS ค้นหา

    //---------------------------------------------------------------- --- START ตรงนี้ดึงข้อมูล Dashboard
    const [incidentDashboard, setIncidentDashboard] = useState([])
    const getIncidentDashBoard = async (value) => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/incident/get-incident-dashboard/${value}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setIncidentDashboard(res.data)
            // console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    //---------------------------------------------------------------- --- STOP ตรงนี้ดึงข้อมูล Dashboard

    //------------------------------------------------------------------- START ตรงนี้ทำ Pagination
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [page, setPage] = React.useState(1);
    const pages = Math.ceil(incidentDashboard.length / rowsPerPage);
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const onRowsPerPageChange = React.useCallback((e) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);
    //------------------------------------------------------------------- END ตรงนี้ทำ Pagination


    const [events, setEvents] = useState([
        { title: 'คีย์ไม่ครบ 8 คน', date: '2025-05-15' },
        { title: 'คีย์ไม่ครบ 4 คน', date: '2025-05-16' },
        { title: 'คีย์ไม่ครบ 2 คน', date: '2025-05-19' },
        { title: 'คีย์ไม่ครบ 1 คน', date: '2025-05-20' },
    ]);

    const [listShift, setListShift] = useState([
        { title: 'เวรเช้า', date: '2025-05-18' },
        { title: 'เวรบ่าย', date: '2025-05-15' },
        { title: 'เวรดึก', date: '2025-05-16' },
    ]);

    // '/get-incident-by-condition/:start_date/:end_date',
    // getIncidentByCondition

    // const [selectdate, setSelectdate] = useState({ start_date: '', end_date: '' });
    // const [series, setSeries] = useState([]);
    // const [options, setOptions] = useState({});

    // const getIncidentByCondition = async (start_date, end_date) => {
    //     console.log('getIncidentByCondition', start_date, end_date)
    //     try {
    //         const token_psoffice = localStorage.getItem("token-psoffice");
    //         let res = await axios.get(`${api}/incident/get-incident-by-condition/${start_date === undefined ? '' : start_date}/${end_date === undefined ? '' : end_date}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })

    //         console.log(res.data)

    //         const rawData = res.data;

    //         // 🔄 แปลงข้อมูลให้เป็นรูปแบบ ApexChart
    //         const labels = rawData.map(item => item.sla_title);
    //         const dataCounts = rawData.map(item => item.sla_id_count);

    //         const seriesData = [
    //             {
    //                 name: 'จำนวนแจ้งปัญหา',
    //                 data: dataCounts,
    //             },
    //         ];

    //         const chartOptions = {
    //             chart: {
    //                 type: 'bar',
    //                 height: 400,
    //             },
    //             plotOptions: {
    //                 bar: {
    //                     borderRadius: 4,
    //                     borderRadiusApplication: 'end',
    //                     horizontal: true,
    //                 },
    //             },
    //             dataLabels: {
    //                 enabled: true,
    //                 style: {
    //                     colors: ['#000'],
    //                 },
    //                 formatter: function (val) {
    //                     return val.toLocaleString();
    //                 },
    //             },
    //             xaxis: {
    //                 categories: labels,
    //             },
    //             fill: {
    //                 type: 'gradient',
    //                 gradient: {
    //                     shade: 'light',
    //                     type: 'horizontal',
    //                     shadeIntensity: 0.4,
    //                     gradientToColors: ['#FAB1A0'], // ส้ม (ไปยัง)
    //                     inverseColors: false,
    //                     opacityFrom: 0.9,
    //                     opacityTo: 1,
    //                     stops: [0, 100],
    //                 },
    //             },
    //             colors: ['#E17055'], // แดง (เริ่มจาก)
    //         };

    //         setSeries(seriesData);
    //         setOptions(chartOptions);
    //     } catch (error) {
    //         console.log(error)
    //     }

    // }



    return (
        <>
            <Head>
                <title>หน้าแรก</title>
            </Head>
            <Layout>
                <HeaderTodolist />
                <div className="py-6 px-4 md:px-6 lg:px-8">
                    <div className="grid grid-cols-12 gap-4">
                        <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-2 text-center'>
                            <div className="grid grid-cols-3 p-3 bg-blue-200 border border-blue-200 rounded-2xl shadow-lg hover:bg-blue-100">
                                <div className='col-span-1 flex items-center justify-center'>
                                    <Icon className='w-16 h-16 text-blue-900' icon="icon-park-solid:all-application" />
                                </div>
                                <div className='col-span-2'>
                                    <h5 className="mb-2 text-lg font-bold tracking-tight text-blue-900">งานทั้งหมด</h5>
                                    <h5 className="mb-2 text-4xl font-bold tracking-tight text-blue-900">{incidentDashboardNumbersByStatus.total_count}</h5>
                                    <p className="font-normal text-blue-700">รายการ</p>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-2 text-center'>
                            <div className="grid grid-cols-3 p-3 bg-amber-200 border border-amber-200 rounded-2xl shadow-lg hover:bg-amber-100">
                                <div className='col-span-1 flex items-center justify-center'>
                                    <Icon className='w-16 h-16 text-amber-900' icon="medical-icon:i-waiting-area" />
                                </div>
                                <div className='col-span-2'>
                                    <h5 className="mb-2 text-lg font-bold tracking-tight text-amber-900">รอเจ้าหน้าที่รับงาน</h5>
                                    <h5 className="mb-2 text-4xl font-bold tracking-tight text-amber-900">{parseInt(incidentDashboardNumbersByStatus.status_1_count ?? '0', 10)}</h5>
                                    <p className="font-normal text-amber-700">รายการ</p>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-2 text-center'>
                            <div className="grid grid-cols-3 p-3 bg-sky-200 border border-sky-200 rounded-2xl shadow-lg hover:bg-sky-100">
                                <div className='col-span-1 flex items-center justify-center'>
                                    <Icon className='w-16 h-16 text-sky-900' icon="mdi:offer" />
                                </div>
                                <div className='col-span-2'>
                                    <h5 className="mb-2 text-lg font-bold tracking-tight text-sky-900">มอบหมายงานแล้ว</h5>
                                    <h5 className="mb-2 text-4xl font-bold tracking-tight text-sky-900">{parseInt(incidentDashboardNumbersByStatus.status_2_count ?? '0', 10)}</h5>
                                    <p className="font-normal text-sky-700">รายการ</p>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-2 text-center'>
                            <div className="grid grid-cols-3 p-3 bg-slate-200 border border-slate-200 rounded-2xl shadow-lg hover:bg-slate-100">
                                <div className='col-span-1 flex items-center justify-center'>
                                    <Icon className='w-16 h-16 text-slate-900' icon="healthicons:running" />
                                </div>
                                <div className='col-span-2'>
                                    <h5 className="mb-2 text-lg font-bold tracking-tight text-slate-900">งานกำลังดำเนินการ</h5>
                                    <h5 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">{parseInt(incidentDashboardNumbersByStatus.status_3_count ?? '0', 10)}</h5>
                                    <p className="font-normal text-slate-700">รายการ</p>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-2 text-center'>
                            <div className="grid grid-cols-3 p-3 bg-purple-200 border border-purple-200 rounded-2xl shadow-lg hover:bg-purple-100">
                                <div className='col-span-1 flex items-center justify-center'>
                                    <Icon className='w-16 h-16 text-purple-900' icon="material-symbols:order-approve-rounded" />
                                </div>
                                <div className='col-span-2'>
                                    <h5 className="mb-2 text-lg font-bold tracking-tight text-purple-900">งานที่รอผู้แจ้งยืนยัน</h5>
                                    <h5 className="mb-2 text-4xl font-bold tracking-tight text-purple-900">{parseInt(incidentDashboardNumbersByStatus.status_4_count ?? '0', 10)}</h5>
                                    <p className="font-normal text-purple-700">รายการ</p>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-2 text-center'>
                            <div className="grid grid-cols-3 p-3 bg-green-200 border border-green-200 rounded-2xl shadow-lg hover:bg-green-100">
                                <div className='col-span-1 flex items-center justify-center'>
                                    <Icon className='w-16 h-16 text-green-900' icon="icon-park-solid:success" />
                                </div>
                                <div className='col-span-2'>
                                    <h5 className="mb-2 text-lg font-bold tracking-tight text-green-900">งานที่ทำเสร็จแล้ว</h5>
                                    <h5 className="mb-2 text-4xl font-bold tracking-tight text-green-900">{parseInt(incidentDashboardNumbersByStatus.status_5_count ?? '0', 10)}</h5>
                                    <p className="font-normal text-green-700">รายการ</p>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12'>
                            <Table
                                className="text-gray-700"
                                aria-label="Table manage incident dashboard"
                                topContent={
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-default-900 text-xl font-bold">ข้อมูลงานทั้งหมด {incidentDashboard.length} รายการ</span>
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
                                    <TableColumn>เวลาแจ้ง</TableColumn>
                                    <TableColumn>ปัญหาที่แจ้ง</TableColumn>
                                    <TableColumn>ระบุอุปกรณ์</TableColumn>
                                    <TableColumn>สถานะ</TableColumn>
                                    <TableColumn>ผู้ดำเนินการ : วิธีแก้ไขปัญหา</TableColumn>
                                    <TableColumn>สาเหตุหลักของปัญหา</TableColumn>
                                    <TableColumn>เวลาเสร็จ</TableColumn>
                                    <TableColumn>เวลาที่ใช้</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {incidentDashboard.slice(start, end).map((item, i) => {
                                        // console.log(item)
                                        return <TableRow key={i}>
                                            <TableCell>{start + i + 1}</TableCell>
                                            <TableCell>{item.incident_year + '/' + item.incident_no}</TableCell>
                                            <TableCell><Chip color={item.urgency_level === 'ด่วน' ? 'danger' : 'success'} variant="flat">{item.urgency_level}</Chip></TableCell>
                                            <TableCell>{item.fullname_ins}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p>{item.dept_name}</p>
                                                    <p className="text-blue-700">{item.tel}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[6%]">
                                                <div className="flex flex-col">
                                                    <p>{moment(item.ins_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                    <p>เวลา {moment(item.ins_dt).add(543, 'year').format('HH:mm น.')}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[15%]">
                                                <div className="flex flex-col">
                                                    <p>{item.sla_title} <span className='text-yellow-700'>[{item.sla_id < 6 ? `รับประกัน ${item.sla_time} นาที` : item.sla_condition}]</span></p>
                                                    <p className="text-red-500">{item.detail !== '' ? item.detail : '-'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {/* {
                                                    item.incident_logs_arr !== null ?
                                                        item.incident_logs_arr.map((logItemDevice, i) => {
                                                            return (<p key={i}>{logItemDevice.device !== '' ? logItemDevice.device : 'ไม่ได้ระบุ'}</p>)
                                                        }) : '-'
                                                } */}
                                                {
                                                    item.incident_logs_arr && item.incident_logs_arr.length > 0 ? (
                                                        (() => {
                                                            // กรองค่าออกมา เอาเฉพาะที่ไม่ว่าง
                                                            const validDevices = item.incident_logs_arr
                                                                .map(log => log.device)
                                                                .filter(device => device && device.trim() !== '');

                                                            return validDevices.length > 0 ? (
                                                                validDevices.map((device, i) => <p key={i}>{device}</p>)
                                                            ) : (
                                                                <p className='text-yellow-600'>ไม่ได้ระบุ</p>
                                                            );
                                                        })()
                                                    ) : (
                                                        <p className='text-yellow-600'>ไม่ได้ระบุ</p>
                                                    )
                                                }
                                            </TableCell>
                                            <TableCell><Chip color={statusIncident[item.incident_status].color} variant="flat">{statusIncident[item.incident_status].label}</Chip></TableCell>
                                            <TableCell className="w-[15%]">
                                                <div className="flex flex-col">
                                                    {
                                                        item.incident_logs_arr !== null ? item.incident_logs_arr.map((logItem, i) => {
                                                            return (
                                                                <p key={i} className="text-green-700 flex">
                                                                    {logItem.confirm_fullname} : {logItem.action_detail !== null && logItem.action_detail !== '' ? logItem.action_detail : '-'}
                                                                </p>
                                                            )
                                                        }) : '-'
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[10%]"><p className="text-green-700">{item.primary_cause !== null ? item.primary_cause : '-'}</p></TableCell>
                                            <TableCell className="w-[6%]">
                                                {item.close_dt !== null ?
                                                    <div className="flex flex-col">
                                                        <p>{moment(item.close_dt).add(543, 'year').format('D MMM YYYY')}</p>
                                                        <p>เวลา {moment(item.close_dt).add(543, 'year').format('HH:mm น.')}</p>
                                                    </div>
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="w-[5%]">{item.duration_minutes !== null ? item.duration_minutes : '-'}</TableCell>
                                        </TableRow>
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {/* <div className='col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-6'>
                            <Card>
                                <CardHeader> <span className="text-default-900 text-xl font-bold">ข้อมูลการบันทึกกิจกรรม (Activity)</span></CardHeader>
                                <CardBody>
                                    <FullCalendar
                                        locale={thLocale}
                                        plugins={[dayGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        // dateClick={handleDateClick}
                                        events={events}
                                        height="auto"
                                        firstDay={1} // เริ่มจากวันจันทร์
                                        dayCellContent={(arg) => (
                                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', padding: '10px 0' }}>
                                                {arg.dayNumberText} 
                                            </div>
                                        )}
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'dayGridMonth,dayGridWeek,dayGridDay', // ปุ่มเปลี่ยนมุมมอง
                                        }}
                                        dayHeaderContent={(args) => {
                                            const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
                                            return <div>{dayNames[args.date.getDay()]}</div>;
                                        }}
                                    />
                                </CardBody>
                            </Card>
                        </div>
                        <div className='col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-6'>
                            <Card>
                                <CardHeader> <span className="text-default-900 text-xl font-bold">ตารางปฏิบัติงาน ICT (เวรนอกเวลาราชการ)</span></CardHeader>
                                <CardBody>
                                    <FullCalendar
                                        locale={thLocale}
                                        plugins={[dayGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        // dateClick={handleDateClick}
                                        events={listShift}
                                        height="auto"
                                        firstDay={1} // เริ่มจากวันจันทร์
                                        dayCellContent={(arg) => (
                                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', padding: '10px 0' }}>
                                                {arg.dayNumberText} 
                                            </div>
                                        )}
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'dayGridMonth,dayGridWeek,dayGridDay', // ปุ่มเปลี่ยนมุมมอง
                                        }}
                                        dayHeaderContent={(args) => {
                                            const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
                                            return <div>{dayNames[args.date.getDay()]}</div>;
                                        }}
                                    />
                                </CardBody>
                            </Card>
                        </div> */}



                        {/* <div className='col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 gap-3 flex justify-end'>
                            <ConfigProvider locale={locale}>
                                <DatePicker
                                    allowClear={false}
                                    style={{ borderRadius: 13 }}
                                    size="large"
                                    className='w-[15%]'
                                />
                            </ConfigProvider>
                            <ConfigProvider locale={locale}>
                                <DatePicker
                                    allowClear={false}
                                    style={{ borderRadius: 13 }}
                                    size="large"
                                    className='w-[15%]'
                                />
                            </ConfigProvider>
                            <Button
                                isLoading
                                color="secondary"
                                spinner={<Icon icon="line-md:loading-loop" className="h-6 w-6" />}
                            >
                                ประมวนผล
                            </Button>
                        </div> */}
                        {/* <div className='col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-6'>
                            <Card>
                                <CardHeader>
                                    <p className='font-bold'>จำนวนประเภทปัญหาที่แจ้ง (SLA)</p>
                                </CardHeader>
                                <CardBody>
                                    <h1></h1>
                                    <ReactApexChart options={options} series={series} type="bar" height={400} />


                                </CardBody>
                            </Card>
                        </div> */}
                    </div>
                </div>
            </Layout>
        </>
    )
}

export default Index