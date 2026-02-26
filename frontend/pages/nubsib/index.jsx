
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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const dateFormat = 'YYYY-MM-DD';
const format = 'HH:mm';

const Nubsib = () => {
    const [message, setMessage] = useState('')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)

    const AskChat = async () => {
        if (!message.trim()) return
        setLoading(true)
        setResponse('')
        setIsBlocked(false)
        try {
            const res = await axios.post(`${ai_api}/api/chat`, {
                prompt: message
            })
            if (res.data && res.data.data) {
                setResponse(res.data.data)
            }
        } catch (error) {
            console.log(error)
            if (error.response && error.response.data) {
                const data = error.response.data
                if (data.status === 'blocked') {
                    setIsBlocked(true)
                    setResponse(data.message)
                } else {
                    setResponse(data.message || error.message)
                }
            } else {
                setResponse('Error: ' + error.message)
            }
        } finally {
            setLoading(false)
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
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="ถาม AI (เช่น: ผู้ป่วยนอกวันนี้)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && AskChat()}
                        />
                        <Button color="primary" onClick={AskChat} isLoading={loading}>
                            {loading ? 'Processing...' : 'ส่ง'}
                        </Button>
                    </div>

                    {response && isBlocked && (
                        <Card className="border-2 border-red-400 bg-red-50 mb-4">
                            <CardBody>
                                <div className="flex items-center gap-2 mb-2">
                                    <Chip color="danger" variant="flat" size="sm">🚫 SQL ถูกบล็อก</Chip>
                                </div>
                                <p className="text-red-700 text-sm">
                                    {response}
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    ระบบอนุญาตเฉพาะคำสั่ง SELECT (อ่านข้อมูล) เท่านั้น ไม่อนุญาต INSERT, UPDATE, DELETE หรือคำสั่งแก้ไขข้อมูลอื่นๆ
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    {response && !isBlocked && (
                        <Card>
                            <CardBody>
                                <h3 className="font-bold mb-2">Generated SQL:</h3>
                                <div className="markdown-body p-4 rounded overflow-x-auto bg-white">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {response}
                                    </ReactMarkdown>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </Layout>
        </>
    )
}

export default Nubsib