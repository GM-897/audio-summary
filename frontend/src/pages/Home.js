import React, { useState } from 'react';
import api from '../services/api';

export default function Home() {
    const [file, setFile] = useState(null);
    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a file');

        try {
            // 1) Request presigned POST from backend
            const presignRes = await api.post('audio/upload/', { content_type: file.type });
            const { url, fields, key } = presignRes.data;

            // 2) Build form data for S3 and upload directly
            const s3Form = new FormData();
            Object.entries(fields).forEach(([k, v]) => s3Form.append(k, v));
            s3Form.append('file', file);

            const s3Res = await fetch(url, { method: 'POST', body: s3Form });
            if (!s3Res.ok) {
                console.error('S3 upload failed', s3Res);
                return alert('Upload to S3 failed');
            }

            // 3) Notify backend that upload completed so it can create DB record
            const notifyRes = await api.post('audio/notify/', { key });
            alert('Uploaded: ' + notifyRes.data.filename);
        } catch (err) {
            console.error(err);
            alert('Upload Failed');
        }
    };

    return (
        <div>
            <h1>Welcome to Audio Summary</h1>
            <p>Get started by logging in to upload audio and view summaries.</p>

            <h2>Audio File Upload</h2>
            <p>Upload your audio files to get concise summaries of their content.</p>
            <form onSubmit={handleUpload}>
                <input type="file" accept="audio/*" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
        </div>
    );
}