import React, { useState } from 'react';
import api from '../services/api';

export default function Home() {
    const [file, setFile] = useState(null);
    const [filename, setFilename] = useState('');
    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a file');
        try {
            // 1) Request presigned POST from backend
            const presignRes = await api.post('audio/upload/', { content_type: file.type, filename });
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
                        const notifyRes = await api.post('audio/notify/', { key, filename });
                        const audio = notifyRes.data; // contains id, status, transcription_text, file_url
                        setLastAudio(audio);
                        // poll for transcription status
                        pollTranscription(audio.id);
        } catch (err) {
            console.error(err);
            alert('Upload Failed');
        }
    };

        const [lastAudio, setLastAudio] = useState(null);

        const pollTranscription = async (id) => {
            const interval = 10000; // ms
            const maxRetries = 60; // 3 minutes
            let attempts = 0;
            const timer = setInterval(async () => {
                attempts += 1;
                try {
                    const res = await api.get(`audio/${id}/status/`);
                    setLastAudio(res.data);
                    if (res.data.status === 'completed' || res.data.status === 'failed' || attempts >= maxRetries) {
                        clearInterval(timer);
                    }
                } catch (err) {
                    console.error('Polling error', err);
                    clearInterval(timer);
                }
            }, interval);
        };

    return (
        <div>
            <h1>Welcome to Audio Summary</h1>
            <p>Get started by logging in to upload audio and view summaries.</p>

            <h2>Audio File Upload</h2>
            <p>Upload your audio files to get concise summaries of their content.</p>
            <form onSubmit={handleUpload}>
                   <label>
                       Desired filename:
                       <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="my_audio_title.mp4" />
                   </label>
                <input type="file" accept="audio/*" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
                        {lastAudio && (
                            <div style={{marginTop:20}}>
                                <h3>Transcription Status: {lastAudio.status}</h3>
                                {lastAudio.status === 'processing' && <p>Processing... please wait.</p>}
                                {lastAudio.status === 'completed' && (
                                    <div>
                                        <h4>Transcription</h4>
                                        <pre style={{whiteSpace:'pre-wrap'}}>{lastAudio.transcription_text}</pre>
                                        {lastAudio.file_url && (
                                            <p>File: <a href={lastAudio.file_url} target="_blank" rel="noreferrer">{lastAudio.file_url}</a></p>
                                        )}
                                    </div>
                                )}
                                {lastAudio.status === 'failed' && <p>Transcription failed.</p>}
                            </div>
                        )}
        </div>
    );
}