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
            console.log(email)
            console.log(password)
            emailLogin && emailLogin(email, password);
        } catch (e) {
            log(e);
        }
    }

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async () => {
        try {
            if(emailLogin) {
                await emailLogin(email, password);
            }
        } catch (e) {
            log(e);
        }
    };

    async function handleLoginGoogle() {
        log('Logging in Google')
        googleLogin && googleLogin();
    }

    return (
        <div className='login'>
            <div className='login-area'>
                <h1>Welcome back</h1>
                <div className='login-data-area'>
                    <input 
                        type="text"
                        placeholder='Email'
                        className='login-input'
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password"
                        placeholder='Password'
                        className='login-input'
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {authenticationError && 
                        <div className='auth-error-area'>
                            <p className='auth-error-text'>{authenticationError}</p>
                        </div>
                    }
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
