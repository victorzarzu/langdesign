import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";
import LoginButton from './LoginButton';
import { useForm } from 'react-hook-form';

const log = getLogger('SignUp');

export const SignUp: React.FC = () => {    
    const { googleLogin, emailSignUp, isAuthenticated, authenticationError } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);
    async function handleLoginGoogle() {
        log('Signing up')
        googleLogin && googleLogin()
    }
    async function handleSingupEmail() {
        log('Logging in email')
        try{
            emailSignUp && emailSignUp(email, password);
        } catch (e) {
            log(e);
        }
    }
    const {
        register,
        handleSubmit,
        formState: { errors }
      } = useForm();
    return (
        <div className='signup'>
            <div className='signup-area'>
                <h1>Welcome back</h1>
                <div className='signup-data-area'>
                    <input 
                        type="text"
                        placeholder='Email'
                        className='signup-input'
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password"
                        placeholder='Password'
                        className='signup-input'
                        autoComplete='new-password'
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {authenticationError && 
                        <span className='auth-error-area'>
                            <p className='auth-error-text'>{authenticationError}</p>
                        </span>}
                </div>
                <LoginButton text='Sign up' onLogin={handleSingupEmail}/>
                <div className="or-container">
                    <div className="or-line"></div>
                    <div className="or-text">or</div>
                    <div className="or-line"></div>
                </div>
                <LoginButton text='Continue with Google' onLogin={handleLoginGoogle}/>
            </div>
        </div>
    )
}
