import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

export default function Home() {
    const [file, setFile] = useState(null);
    const [filename, setFilename] = useState('');
    const [lastAudio, setLastAudio] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const pollRef = useRef(null);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const handleFileChange = (e) => {
        setError('');
        setFile(e.target.files[0] || null);
        if (e.target.files[0] && !filename) {
            setFilename(e.target.files[0].name);
        }
    };

    const resetForm = () => {
        setFile(null);
        setFilename('');
        setUploadProgress(0);
        setUploading(false);
        setError('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setError('');
        if (!file) return setError('Please select a file.');

        setUploading(true);
        setUploadProgress(0);

        try {
            // 1) Request presigned POST from backend
            const presignRes = await api.post('audio/upload/', { content_type: file.type, filename });
            const { url, fields, key } = presignRes.data;

            // 2) Build form data for S3
            const s3Form = new FormData();
            Object.entries(fields).forEach(([k, v]) => s3Form.append(k, v));
            s3Form.append('file', file);

            // 3) Upload to S3 with progress using XMLHttpRequest
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        const percent = Math.round((evt.loaded / evt.total) * 100);
                        setUploadProgress(percent);
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error(`S3 upload failed with status ${xhr.status}`));
                };
                xhr.onerror = () => reject(new Error('S3 upload network error'));
                xhr.send(s3Form);
            });

            // 4) Notify backend that upload completed so it can create DB record & enqueue task
            const notifyRes = await api.post('audio/notify/', { key, filename });
            const audio = notifyRes.data;
            setLastAudio(audio);
            // start polling for transcription status
            pollTranscription(audio.id);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const pollTranscription = (id) => {
        if (pollRef.current) clearInterval(pollRef.current);
        const interval = 5000; // ms
        const maxRetries = 120; // ~10 minutes
        let attempts = 0;
        pollRef.current = setInterval(async () => {
            attempts += 1;
            try {
                const res = await api.get(`audio/${id}/status/`);
                setLastAudio(res.data);
                if (res.data.status === 'completed' || res.data.status === 'failed' || attempts >= maxRetries) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
            } catch (err) {
                console.error('Polling error', err);
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        }, interval);
    };

    const humanFileSize = (size) => {
        if (!size) return '';
        const i = Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    const containerStyle = { maxWidth: 800, margin: '24px auto', fontFamily: 'Arial, sans-serif', padding: 16 };
    const cardStyle = { border: '1px solid #e1e1e1', borderRadius: 8, padding: 16, marginTop: 12, background: '#fff' };
    const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 600 };
    const inputStyle = { width: '100%', padding: 8, marginBottom: 8, borderRadius: 4, border: '1px solid #ccc' };
    const btnPrimary = { padding: '10px 16px', background: '#0b74de', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
    const btnDisabled = { ...btnPrimary, opacity: 0.6, cursor: 'not-allowed' };
    const progressOuter = { height: 10, background: '#f1f1f1', borderRadius: 6, overflow: 'hidden', marginTop: 8 };
    const progressInner = (p) => ({ width: `${p}%`, height: '100%', background: '#0b74de' });

    return (
        <div style={containerStyle}>
            <h1>Audio Summary</h1>
            <p>Upload audio to get transcriptions and summaries.</p>

            <div style={cardStyle}>
                <form onSubmit={handleUpload}>
                    <label style={labelStyle}>Desired filename (optional)</label>
                    <input
                        style={inputStyle}
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="my_audio_title.mp4"
                        aria-label="Desired filename"
                    />

                    <label style={labelStyle}>Select audio file</label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        aria-label="Choose audio file"
                    />
                    {file && (
                        <div style={{ marginTop: 8 }}>
                            <strong>{file.name}</strong> • {humanFileSize(file.size)} • {file.type}
                        </div>
                    )}

                    {uploading && (
                        <div style={{ marginTop: 12 }}>
                            <div style={progressOuter}>
                                <div style={progressInner(uploadProgress)} />
                            </div>
                            <div style={{ marginTop: 6 }}>{uploadProgress}% uploading...</div>
                        </div>
                    )}

                    {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <button type="submit" className={`btn btn-primary`} disabled={!file || uploading}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={uploading}>
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {lastAudio && (
                <div style={cardStyle}>
                    <h3>Transcription Status: {lastAudio.status}</h3>
                    {lastAudio.status === 'pending' && <p>Queued for processing.</p>}
                    {lastAudio.status === 'processing' && <p>Processing... this may take a few minutes.</p>}
                    {lastAudio.status === 'completed' && (
                        <div>
                            <h4>Transcription</h4>
                            <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 12, borderRadius: 6 }}>{lastAudio.transcription_text}</pre>
                            {lastAudio.file_url && (
                                <p style={{ marginTop: 8 }}>
                                    File: <a href={lastAudio.file_url} target="_blank" rel="noreferrer">{lastAudio.file_url}</a>
                                </p>
                            )}
                        </div>
                    )}
                    {lastAudio.status === 'failed' && <p style={{ color: 'crimson' }}>Transcription failed. Check server logs.</p>}
                    <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                        Uploaded: {new Date(lastAudio.created_at).toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}