import Head from 'next/head'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardHeader, CardContent, Card } from '@/components/ui/card'
import imageCompression from 'browser-image-compression'
import { useState, useEffect } from 'react'

export default function components() {
    const [imagePreview, setImagePreview] = useState(
    ) // 你的 base64 图片数据
    const [compressing, setCompressing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState({ data: '', error: '' })

    // 添加 useEffect 钩子
    useEffect(() => {
        const pasteHandler = async event => {
            const items = (event.clipboardData || window.clipboardData).items
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile()
                    const file = new File([blob], 'pastedImage.jpg', { type: 'image/jpeg' })
                    await previewImage({ target: { files: [file] } })
                    break
                }
            }
        }

        window.addEventListener('paste', pasteHandler)
        return () => {
            window.removeEventListener('paste', pasteHandler)
        }
    }, [])

    const previewImage = async event => {
        const file = event.target.files[0]
        const validTypes = ['image/png', 'image/jpeg', 'image/webp']

        if (file && validTypes.includes(file.type)) {
            const options = {
                maxSizeMB: 1, // 最大文件大小为1MB
                maxWidthOrHeight: 1920, // 图片最大宽度或高度为1920像素
                useWebWorker: true
            }
            try {
                setCompressing(true)
                const compressedFile = await imageCompression(file, options)
                const reader = new FileReader()
                reader.onloadend = async () => {
                    setImagePreview(reader.result)
                    setCompressing(false)
                    const blob = await (await fetch(reader.result)).blob()
                    const file = new File([blob], 'compressedImage.jpg', { type: 'image/jpeg' })
                    await submitForm(file) // 在这里调用 submitForm 函数
                }
                reader.readAsDataURL(compressedFile)
            } catch (error) {
                console.error('Error during compression', error)
                alert('Cannot compress the image.')
                setCompressing(false)
            }
        } else {
            alert('Please select an image file (png, jpeg, webp).')
            setImagePreview('')
        }
    }

    const submitForm = async file => {
        setLoading(true)

        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        if (!response.ok) {
            const errorData = await response.json()
            setResult({ data: '', error: errorData.error })
            setLoading(false)
            return
        }
        const data = await response.json()
        setResult({ data: data.result, error: '' })
        setLoading(false)
    }

    return (
        <div className="container">
            <Head>
                <title>我知道你的猫在想什么！</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <main className="flex flex-col items-center justify-center min-h-screen py-2">
                <Card className="max-w-md ">
                    <CardHeader>
                        <div className="flex items-center">
                            <h2 className="text-2xl font-bold">我知道你的猫在想什么！</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {compressing ? (
                            <div style={{ textAlign: 'center' }}>Scaning image...</div>
                        ) : (
                            imagePreview && (
                                <img
                                    alt="Analyzed cat image"
                                    className="aspect-content object-cover"
                                    height="500"
                                    src={imagePreview}
                                    width="500"
                                />
                            )
                        )}
                        <div className="mt-4 rounded-lg p-4">
                            <p className="ml-2 text-lg" style={{ textAlign: 'center' }}>
                                {compressing
                                    ? '🐱🐱🐱🐱🐱🐱'
                                    : loading
                                    ? '分析中...'
                                    : result.error
                                    ? `发生错误，请重试。错误信息: ${result.error}`
                                    : result.data || '🐱: 你去哪儿了？我已经等你很久了'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <div className="w-full max-w-md px-2 py-2">
                    <form onSubmit={submitForm} encType="multipart/form-data">
                        <div className="grid w-full gap-2">
                            <Label htmlFor="catImage">上传你宠物的照片</Label>
                            <Input id="catImage" name="image" type="file" onChange={previewImage} />
                            <Button type="submit" variant="dark" disabled={loading || compressing}>
                                {compressing ? '扫描...' : loading ? '分析...' : '分析'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>

            <style jsx>{`
                .container {
                    width: 100%;
                    max-width: 100%;
                    padding: 0;
                    margin: 0 auto;
                }
                main {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 1rem;
                }
            `}</style>
        </div>
    )
}