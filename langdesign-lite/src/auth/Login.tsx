import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";
import LoginButton from './LoginButton';
import { useForm } from 'react-hook-form';
import './css/index.css';

const log = getLogger('Login');

export const Login: React.FC = () => {    
    const { googleLogin, emailLogin, isAuthenticated, authenticationError } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);
    async function handleLoginEmail() {
        log('Logging in email')
        try{
            emailLogin && emailLogin(email, password);
        } catch (e) {
            log(e);
        }
    }
    async function handleLoginGoogle() {
        log('Logging in Google')
        googleLogin && googleLogin();
    }
    const {
        register,
        handleSubmit,
        formState: { errors }
      } = useForm();
    return (
        <div className='login'>
            <div className='login-area'>
                <h1>Welcome back</h1>
                <div className='login-data-area'>
                    <input 
                        type="text"
                        placeholder='Email'
                        className='login-input'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password"
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='login-input'
                    />
                    {authenticationError && 
                        <span className='auth-error-area'>
                            <p className='auth-error-text'>{authenticationError}</p>
                        </span>}
                    <LoginButton text='Log in' onLogin={handleLoginEmail}/>
                    <div className="or-container">
                        <div className="or-line"></div>
                        <div className="or-text">or</div>
                        <div className="or-line"></div>
                    </div>
                    <LoginButton text='Continue with Google' onLogin={handleLoginGoogle}/>
                </div>
            </div>
        </div>
    )
}
