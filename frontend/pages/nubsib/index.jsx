import React, { useEffect, useState } from 'react'
import Layout from '../../component/layout'
import HeaderNubsib from './header_nubsib'
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

const Nubsib = () => {
    return (
        <>
            <Head>
                <title>บันทึกอุบัติการณ์</title>
            </Head>
            <Layout>
                <HeaderNubsib />
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Your content here */}
                </div>
            </Layout>
        </>
    )
}

export default Nubsib