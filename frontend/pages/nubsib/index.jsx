
import React, { useEffect, useState, useMemo } from 'react'
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

const ROWS_PER_PAGE = 20;

const Nubsib = () => {
    const [message, setMessage] = useState('')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [sqlQuery, setSqlQuery] = useState('')
    const [queryResult, setQueryResult] = useState(null)
    const [queryError, setQueryError] = useState('')
    const [page, setPage] = useState(1)
    const [showExplanation, setShowExplanation] = useState(false)

    const totalPages = useMemo(() => {
        if (!queryResult || !queryResult.rows) return 1
        return Math.ceil(queryResult.rows.length / ROWS_PER_PAGE)
    }, [queryResult])

    const paginatedRows = useMemo(() => {
        if (!queryResult || !queryResult.rows) return []
        const start = (page - 1) * ROWS_PER_PAGE
        return queryResult.rows.slice(start, start + ROWS_PER_PAGE)
    }, [queryResult, page])

    const AskChat = async () => {
        if (!message.trim()) return
        setLoading(true)
        setResponse('')
        setIsBlocked(false)
        setSqlQuery('')
        setQueryResult(null)
        setQueryError('')
        setPage(1)
        setShowExplanation(false)
        try {
            const res = await axios.post(`${ai_api}/api/chat`, {
                prompt: message
            })
            if (res.data) {
                setResponse(res.data.data || '')
                setSqlQuery(res.data.sql || '')
                if (res.data.queryResult) {
                    setQueryResult(res.data.queryResult)
                }
                if (res.data.queryError) {
                    setQueryError(res.data.queryError)
                }
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
                <title>Nubsib AI Query</title>
            </Head>
            <Layout>
                <HeaderNubsib />
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Input */}
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="ถาม AI (เช่น: ผู้ป่วยนอกวันนี้มีกี่คน)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && AskChat()}
                        />
                        <Button color="primary" onClick={AskChat} isLoading={loading}>
                            {loading ? 'กำลังประมวลผล...' : 'ส่ง'}
                        </Button>
                    </div>

                    {/* SQL Blocked */}
                    {response && isBlocked && (
                        <Card className="border-2 border-red-400 bg-red-50 mb-4">
                            <CardBody>
                                <div className="flex items-center gap-2 mb-2">
                                    <Chip color="danger" variant="flat" size="sm">🚫 SQL ถูกบล็อก</Chip>
                                </div>
                                <p className="text-red-700 text-sm">{response}</p>
                                <p className="text-gray-500 text-xs mt-2">
                                    ระบบอนุญาตเฉพาะคำสั่ง SELECT (อ่านข้อมูล) เท่านั้น
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    {/* SQL Query Display */}
                    {sqlQuery && !isBlocked && (
                        <Card className="mb-4">
                            <CardBody>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm">SQL Query</h3>
                                        {queryResult && (
                                            <Chip color="success" variant="flat" size="sm">
                                                ✅ {queryResult.count} แถว
                                            </Chip>
                                        )}
                                        {queryError && (
                                            <Chip color="danger" variant="flat" size="sm">
                                                ❌ Query Error
                                            </Chip>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        onClick={() => setShowExplanation(!showExplanation)}
                                    >
                                        {showExplanation ? 'ซ่อนคำอธิบาย' : 'ดูคำอธิบาย AI'}
                                    </Button>
                                </div>
                                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                    <code>{sqlQuery}</code>
                                </pre>
                                {queryError && (
                                    <p className="text-red-500 text-xs mt-2">⚠️ {queryError}</p>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* AI Explanation (Collapsible) */}
                    {showExplanation && response && !isBlocked && (
                        <Card className="mb-4">
                            <CardBody>
                                <h3 className="font-bold text-sm mb-2">📝 คำอธิบายจาก AI</h3>
                                <div className="markdown-body p-3 rounded overflow-x-auto bg-white text-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {response}
                                    </ReactMarkdown>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Query Results Table */}
                    {queryResult && queryResult.columns && queryResult.rows && (
                        <Card>
                            <CardBody>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm">
                                        📊 ผลลัพธ์ ({queryResult.count} แถว)
                                    </h3>
                                </div>
                                <Table
                                    aria-label="Query Results"
                                    bottomContent={
                                        totalPages > 1 && (
                                            <div className="flex w-full justify-center">
                                                <Pagination
                                                    isCompact
                                                    showControls
                                                    showShadow
                                                    color="primary"
                                                    page={page}
                                                    total={totalPages}
                                                    onChange={setPage}
                                                />
                                            </div>
                                        )
                                    }
                                >
                                    <TableHeader>
                                        {['#', ...queryResult.columns].map((col) => (
                                            <TableColumn key={col}>{col}</TableColumn>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedRows.map((row, rowIdx) => (
                                            <TableRow key={rowIdx}>
                                                <TableCell>{(page - 1) * ROWS_PER_PAGE + rowIdx + 1}</TableCell>
                                                {queryResult.columns.map((col) => (
                                                    <TableCell key={col}>
                                                        {row[col] !== null && row[col] !== undefined
                                                            ? String(row[col])
                                                            : '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardBody>
                        </Card>
                    )}

                    {/* Response without SQL (fallback) */}
                    {response && !isBlocked && !sqlQuery && (
                        <Card>
                            <CardBody>
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