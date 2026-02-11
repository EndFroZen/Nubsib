import React, { useEffect, useState } from 'react'
import Layout from '../../component/layout'
import HeaderTodolist from './header_todolist'
import Head from 'next/head'
import { Button, Card, CardBody, Checkbox, Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import jwt_decode from "jwt-decode"
import { Icon } from '@iconify/react';
import axios from 'axios'
import * as moment from 'moment'
import 'moment/locale/th'
moment.locale('th')
import config from '../../config'
const api = config.api
const Swal = require('sweetalert2')

import { ConfigProvider, DatePicker } from 'antd';
import locale from "antd/locale/th_TH";
import dayjs from 'dayjs';
import "dayjs/locale/th";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import thLocale from '@fullcalendar/core/locales/th'


const Activity = () => {

    const currentDate = dayjs().format('YYYY-MM-DD');


    useEffect(() => {
        getActivityCategories()
        getTimeSlots(jwt_decode(localStorage.getItem("token-psoffice")).username, currentDate)
        getActivityAllByUsername(jwt_decode(localStorage.getItem("token-psoffice")).username)
    }, [])

    const [activityAllByUsernameARR, setActivityAllByUsernameARR] = useState([]);
    const getActivityAllByUsername = async (username) => {
        // console.log(username)
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/activity/activity_all_by_username/${username}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            // console.log(res.data)
            setActivityAllByUsernameARR(res.data)
        } catch (error) {
            console.error(error);
        }
    }



    //======================================================= START ดึงข้อมูลประเภทงาน
    const [activityCategoriesARR, setActivityCategoriesARR] = useState([])
    const getActivityCategories = async () => {
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/activity/activity_categories_all`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            // console.log(res.data)
            setActivityCategoriesARR(res.data)
        } catch (error) {
            console.error(error);
        }
    }
    //======================================================= STOP ดึงข้อมูลประเภทงาน

    //======================================================= START ดึงข้อมูลเวลา
    const [timeSlotsARR, setTimeSlotsARR] = useState([])
    const [blockSelectAll, setBlockSelectAll] = useState({ block: false, amount: 0 }); // สถานะการบล็อกการเลือกทั้งหมด
    const getTimeSlots = async (username, selectedDate) => {
        // console.log(username, selectedDate)
        try {
            const token_psoffice = localStorage.getItem("token-psoffice");
            let res = await axios.get(`${api}/activity/activity_time_slots_all/${username}/${selectedDate}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
            setTimeSlotsARR(res.data)
            // const allHaveLogs = res.data.every((slot) => slot.activity_logs_id !== null);

            // setBlockSelectAll(allHaveLogs); // ถ้าจริง -> บล็อกปุ่ม

            const nullLogs = res.data.filter((slot) => slot.activity_logs_id === null);
            const nullCount = nullLogs.length;

            // console.log("จำนวน time slots ที่ยังไม่มี activity_logs:", nullCount);

            setBlockSelectAll({ block: nullCount === 0, amount: nullCount })
        } catch (error) {
            console.error(error);
        }
    }
    //======================================================= STOP ดึงข้อมูลเวลา
    // console.log(blockSelectAll)





    //====================================================== START เลือกประเภทงาน
    const [selectedCategoriesId, setSelectedCategoriesId] = useState(null);

    const handleSelect = (id) => {
        // console.log(id)
        setSelectedCategoriesId(prev => prev === id ? null : id);
    };

    //====================================================== STOP เลือกประเภทงาน



    //======================================================= START เลือกวันที่
    const [selectedDate, setSelectedDate] = useState(currentDate); // ใช้ currentDate
    const onChangeDate = (date, dateString) => {
        // console.log(date, dateString);
        if (date) {
            setSelectedTimeIds([]); // เคลียร์การเลือก
            setSelectedDate(dateString);
            getTimeSlots(jwt_decode(localStorage.getItem("token-psoffice")).username, dateString);
        } else {
            setSelectedDate(currentDate);
            setSelectedTimeIds([]); // เคลียร์การเลือก
            getTimeSlots(jwt_decode(localStorage.getItem("token-psoffice")).username, currentDate);
        }
    };
    //======================================================= STOP เลือกวันที่

    //===================================================== START เลือกเวลา ===================================================
    const [selectedTimeIds, setSelectedTimeIds] = useState([]);

    //====================================================== เลือกเวลารายชั่วโมง
    const toggleTimeSelection = (id) => {
        setSelectedTimeIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    //===================================================== เลือกเวลาทั้งหมด
    const handleToggleSelectAllTimeSlots = () => {
        // กรองเฉพาะ timeSlots ที่ activity_logs_id === null
        const filteredIds = timeSlotsARR
            .filter(slot => slot.activity_logs_id === null)
            .map(slot => slot.id);
        // console.log(filteredIds)
        // เช็คว่าทุกตัวใน filteredIds ถูกเลือกหรือยัง
        const allSelected = filteredIds.every(id => selectedTimeIds.includes(id));
        // console.log(allSelected)
        if (allSelected) {
            // ยกเลิกทั้งหมดเฉพาะใน filteredIds
            // แต่จะให้ clear ทั้งหมดหรือแค่ลบ filteredIds ออกจาก selectedTimeIds?
            // สมมติว่าให้ลบเฉพาะ filteredIds ออกจาก selectedTimeIds
            setSelectedTimeIds(prevSelected => prevSelected.filter(id => !filteredIds.includes(id)));
        } else {
            // เลือกทั้งหมดเฉพาะ filteredIds
            // รวมกับที่เลือกอยู่ก่อนแล้ว (ถ้าอยากแทนที่ ให้ใช้ setSelectedTimeIds(filteredIds))
            setSelectedTimeIds(prevSelected => {
                // รวม id ใหม่ที่ยังไม่อยู่ใน selectedTimeIds
                const newSelected = [...prevSelected];
                filteredIds.forEach(id => {
                    if (!newSelected.includes(id)) {
                        newSelected.push(id);
                    }
                });
                // console.log(newSelected)
                return newSelected;
            });
        }
    };

    //===================================================== STOP เลือกเวลา ===================================================


    //===================================================== START บันทึกกิจกรรม
    const handleSaveTimeSelection = async () => {
        const ActivityInsertData = {
            selectedDate,
            selectedCategoriesId,
            selectedTimeIds
        };

        if (!selectedDate) {
            Swal.fire({
                title: 'กรุณาเลือกวันที่',
                icon: 'warning',
                confirmButtonText: 'โอเค'
            })
            return;
        } else if (!selectedCategoriesId) {
            Swal.fire({
                title: blockSelectAll.block === false ? 'กรุณาเลือกประเภทงาน' : 'วันนี้ลงครบแล้ว',
                icon: 'warning',
                confirmButtonText: 'โอเค'
            })
            return;
        } else if (selectedTimeIds.length === 0) {
            Swal.fire({
                title: blockSelectAll.block === false ? 'กรุณาเลือกช่วงเวลา' : 'วันนี้ลงครบแล้ว',
                icon: 'warning',
                confirmButtonText: 'โอเค'
            })

            return;
        } else {
            // สามารถส่งข้อมูลไปยัง backend ได้ที่นี่
            // console.log(ActivityInsertData);
            try {
                const token_psoffice = localStorage.getItem("token-psoffice");
                let res = await axios.post(`${api}/activity/add_activity`, ActivityInsertData, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                // console.log(res.data)
                if (res.data.ok === true) {
                    Swal.fire({
                        title: 'บันทึกกิจกรรมสำเร็จ',
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 3000
                    })

                } else {
                    Swal.fire({
                        title: 'บันทึกกิจกรรมไม่สำเร็จ',
                        icon: 'error',
                        confirmButtonText: 'โอเค'
                    })
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'ERROR 500',
                    icon: 'error',
                    confirmButtonText: 'โอเค'
                })
            } finally {
                setSelectedTimeIds([]);
                setSelectedCategoriesId(null);
                // setSelectedDate(currentDate);
                getTimeSlots(jwt_decode(localStorage.getItem("token-psoffice")).username, selectedDate)
                getActivityAllByUsername(jwt_decode(localStorage.getItem("token-psoffice")).username)
            }
        }
    };
    //===================================================== STOP บันทึกกิจกรรม

    //------------------------------------------------------------------- START ตรงนี้ทำ Pagination
    const [rowsPerPage, setRowsPerPage] = React.useState(9)
    const [page, setPage] = React.useState(1)
    const pages = Math.ceil(activityAllByUsernameARR.length / rowsPerPage)
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    const onRowsPerPageChange = React.useCallback((e) => {
        setRowsPerPage(Number(e.target.value))
        setPage(1)
    }, [])
    //------------------------------------------------------------------- END ตรงนี้ทำ Pagination


    const deleteActivity = async (id) => {
        // console.log(id)

        Swal.fire({
            title: "ยืนยันการลบกิจกรรม",
            text: "คุณต้องการลบกิจกรรมนี้หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "ใช่, ฉันต้องการลบกิจกรรมนี้!",
            cancelButtonText: "ไม่, ฉันกดผิด"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token_psoffice = localStorage.getItem("token-psoffice");
                    let res = await axios.delete(`${api}/activity/delete_activity/${id}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
                    // console.log(res.data)
                    if (res.data.ok === true) {
                        Swal.fire({
                            title: 'ลบกิจกรรมสำเร็จ',
                            icon: 'success',
                            showConfirmButton: false,
                            timer: 3000
                        })
                    } else {
                        Swal.fire({
                            title: 'ลบกิจกรรมไม่สำเร็จ',
                            icon: 'error',
                            confirmButtonText: 'โอเค'
                        })
                    }

                } catch (error) {
                    console.error(error);
                    Swal.fire({
                        title: 'ERROR 500',
                        icon: 'error',
                        confirmButtonText: 'โอเค'
                    })
                } finally {
                    getTimeSlots(jwt_decode(localStorage.getItem("token-psoffice")).username, selectedDate)
                    getActivityAllByUsername(jwt_decode(localStorage.getItem("token-psoffice")).username)
                }
            }
        })
    }


    const [openCalendaDetail, setOpenCalendaDetail] = useState(false)

    const [events, setEvents] = useState([]);
    const handleOpenCalendaDetail = async () => {
        // get('/activity_count/:username',
        const token_psoffice = localStorage.getItem("token-psoffice");
        let res = await axios.get(`${api}/activity/activity_count/${jwt_decode(token_psoffice).username}`, { headers: { Authorization: `Bearer ${token_psoffice}` } })
        // console.log(res.data)
        // แปลงข้อมูลก่อนส่งเข้า setEvents
        const convertedEvents = res.data.map(item => ({
            date: dayjs(item.activity_date).format('YYYY-MM-DD'),
            title: item.count_ins < 9 ? 'ลงไม่ครบ' : 'ลงครบ',
            color: item.count_ins < 9 ? '#8E1616' : '#03A791', // สีแดงถ้า count_ins = 0, สีเขียวถ้า count_ins > 0
        }));

        setEvents(convertedEvents);


        setOpenCalendaDetail(true)
    }

    const handleCancelCalendaDetail = () => {
        setOpenCalendaDetail(false)
    }
    return (
        <>
            <Head>
                <title>บันทึกกิจกรรม</title>
            </Head>
            <Layout>
                <HeaderTodolist />
                <div className="py-6 px-4 md:px-6 lg:px-8">
                    <Card className="mb-3">
                        <CardBody>
                            <div className="gap-8 grid grid-cols-12">
                                <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-8">
                                    <div className="gap-3 grid grid-cols-2 items-center">
                                        <div className="col-span-1">
                                            <label className="block text-xl font-bold text-gray-800">เลือกประเภทงาน<span className='text-danger'>*</span></label>
                                        </div>
                                        <div className="col-span-1 flex justify-end items-center gap-2">
                                            <label className="font-bold text-gray-800">เลือกวันที่<span className='text-danger'>*</span></label>
                                            <ConfigProvider locale={locale}>
                                                <DatePicker
                                                    style={{ borderRadius: 13 }}
                                                    size="large"
                                                    className="w-40"
                                                    onChange={onChangeDate}
                                                    placeholder="เลือกวันที่"
                                                    value={dayjs(selectedDate, "YYYY-MM-DD")}
                                                    defaultValue={dayjs(selectedDate, "YYYY-MM-DD")}
                                                />
                                            </ConfigProvider>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="grid grid-cols-12 gap-3">
                                                {activityCategoriesARR.map((item, i) => (
                                                    <div
                                                        key={item.id}
                                                        className="col-span-3"
                                                    >
                                                        <Button
                                                            color={selectedCategoriesId === item.id ? "primary" : "default"}
                                                            className={`w-full h-16`}
                                                            variant={selectedCategoriesId === item.id ? 'shadow' : 'flat'}
                                                            onPress={() => handleSelect(item.id)}
                                                            isDisabled={blockSelectAll.block}
                                                        >
                                                            <div className="overflow-hidden">
                                                                <p className="text-lg font-bold">{item.title}</p>
                                                                <p className={`truncate ${selectedCategoriesId === item.id ? 'text-gray-100' : 'text-gray-700'}`}>{item.sub_title}</p>
                                                            </div>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-4">
                                    <div className="gap-3 grid grid-cols-12">
                                        <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                                            <div className="gap-3 grid grid-cols-2 items-center">
                                                <div className="col-span-1">
                                                    <label className="block text-xl font-bold text-gray-800">เลือกช่วงเวลา<span className='text-danger'>*</span></label>
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <Button
                                                        className="w-40"
                                                        color="danger"
                                                        variant={blockSelectAll.block === false && selectedTimeIds.length === blockSelectAll.amount ? "shadow" : 'flat'}
                                                        onPress={handleToggleSelectAllTimeSlots}
                                                        isDisabled={blockSelectAll.block} // บล็อกการเลือกทั้งหมดถ้ามี activity_logs_id
                                                    >
                                                        {blockSelectAll.block === false && selectedTimeIds.length === blockSelectAll.amount ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        {
                                            timeSlotsARR.map((item) => {
                                                const selected = selectedTimeIds.includes(item.id);
                                                return (
                                                    <div key={item.id} className="col-span-6 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                                                        <Button
                                                            onPress={() => toggleTimeSelection(item.id)}
                                                            color={item.activity_logs_id === null ? item.color : 'default'}
                                                            className={`w-full h-16`}
                                                            variant={selected ? "shadow" : 'flat'}
                                                            isDisabled={item.activity_logs_id === null ? false : true}
                                                        >
                                                            <div>
                                                                <p className="text-lg font-bold">{item.time_range}</p>
                                                                <p>
                                                                    {item.type === 'break' ? 'พักเที่ยง' : item.type === 'shift_end' ? 'ลงเวร' : ''}
                                                                </p>
                                                            </div>
                                                        </Button>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                                <div className="col-span-12 flex justify-end">
                                    <Button className='w-48' color="success" variant="flat" onPress={handleSaveTimeSelection} isDisabled={blockSelectAll.block}>บันทึกกิจกรรม</Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>


                    <Table
                        className="text-gray-700"
                        aria-label="Table manage user"
                        topContent={
                            <>
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-default-900 text-xl font-bold">ทั้งหมด {activityAllByUsernameARR.length} รายการ</span>
                                    <Button
                                        color='warning'
                                        variant="flat"
                                        startContent={<Icon className='h-6 w-6' icon="famicons:calendar" />}
                                        onPress={handleOpenCalendaDetail}
                                    >
                                        ตรวจสอบการลงกิจกรรม
                                    </Button>
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
                                        <option value="9">9</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </label>
                            </div>
                        }
                    >
                        <TableHeader>
                            <TableColumn>ลำดับ</TableColumn>
                            <TableColumn>วันที่</TableColumn>
                            <TableColumn>ช่วงเวลา</TableColumn>
                            <TableColumn>หัวข้อ</TableColumn>
                            <TableColumn>รายละเอียดเพิ่มเติม</TableColumn>
                            <TableColumn>ลบ</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {activityAllByUsernameARR.slice(start, end).map((item, i) => {
                                // console.log(item)
                                return <TableRow key={i} style={{ backgroundColor: dayjs(item.activity_date).format('YYYY-MM-DD') === currentDate && '#ECFAE5' }}>
                                    <TableCell>{start + i + 1}</TableCell>
                                    <TableCell>{moment(item.activity_date).add(543, 'year').format('D MMMM YYYY')}</TableCell>
                                    <TableCell><Chip color="success" variant="flat">{item.time_range}</Chip></TableCell>
                                    <TableCell>{item.title}</TableCell>
                                    <TableCell>{item.sub_title}</TableCell>
                                    <TableCell>
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            startContent={<Icon className='h-6 w-6' icon="fluent:delete-48-filled" />}
                                            // isDisabled={dayjs(item.activity_date).format('YYYY-MM-DD') !== currentDate}
                                            onPress={() => deleteActivity(item.id)}
                                        >
                                            ลบ
                                        </Button>
                                    </TableCell>

                                </TableRow>
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Layout>

            <Modal isOpen={openCalendaDetail} onClose={handleCancelCalendaDetail} placement='center' size='5xl' scrollBehavior='outside'>
                <ModalContent>
                    <ModalHeader className="flex text-yellow-700"><span><Icon icon="famicons:calendar" className='w-7 h-7 mr-2' /></span><span>ตรวจสอบการลงกิจกรรม</span></ModalHeader>
                    <ModalBody>
                        <FullCalendar
                            locale={thLocale}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            // dateClick={handleDateClick}
                            events={events}
                            height='auto'
                            firstDay={0} // เริ่มจากวันอาทิตย์
                            dayCellContent={(arg) => (
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
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
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="flat" onPress={handleCancelCalendaDetail}>
                            ปิด
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal >
        </>
    )
}

export default Activity