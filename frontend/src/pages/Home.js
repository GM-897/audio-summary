import React, {useState} from 'react';
import api from '../services/api';

export default function Home() {
    const [file,setFile]
 =useState(null)  ;
 const handleFileChange = (e) => setFile(e.target.files[0]);

 const handleUpload = async (e) => {
    e.preventDefault();

    if(!file) return alert('Please select a file');
    const fd = new FormData();
    fd.append('file', file);
    try{
        const res = await api.post('audio/upload/',fd,{
            headers: {'Content-Type': 'multipart/form-data'}
        });

        alert('Uploaded: ' + res.data.file);
    }catch(err){
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