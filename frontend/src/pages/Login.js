import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { AuthContext } from '../contexts/AuthContext';


export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            await login(username, password);
            setUser(true);
            navigate('/');
        }catch(err){
            alert('Login Failed');
        }
    };


    return(
        <form onSubmit={handleSubmit}>
            <h2> Login</h2>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
            <button type="submit">Login</button>        
        </form>
    );
}