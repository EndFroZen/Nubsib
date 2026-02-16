
import React, { useEffect, useState } from 'react'
import Layout from '../../component/layout'
import HeaderNubsib from './header_nubsib'
import { Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Input, Tabs, Tab, Card, CardBody, CardFooter, Image } from "@heroui/react";
import Head from 'next/head'
import * as moment from 'moment'
import 'moment/locale/th'
moment.locale('th')
import config from '../../config'
const api = config.api
const ai_api = config.ai_api
const Swal = require('sweetalert2')
import "dayjs/locale/th";
import axios from 'axios'
const dateFormat = 'YYYY-MM-DD';
const format = 'HH:mm';

const Nubsib = () => {
    const [message, setMessage] = useState('')
    const AskChat = async () => {
        try {
            const res = await axios.post(`${ai_api}/chat`, {
                prompt: message
            })
            console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <>
            <Head>
                <title>บันทึกอุบัติการณ์</title>
            </Head>
            <Layout>
                <HeaderNubsib />
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <Input placeholder="ถาม AI" onChange={(e) => setMessage(e.target.value)} />
                    <Button onClick={AskChat}>ส่ง</Button>
                </div>
            </Layout>
        </>
    )
}

export default Nubsib