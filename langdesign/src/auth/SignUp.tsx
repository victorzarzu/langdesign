import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";
import LoginButton from './LoginButton';
import './css/index.css';

const log = getLogger('Login');

export const SignUp: React.FC = () => {    
    const { googleLogin, emailSignUp, isAuthenticated, registeringError } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);

    async function handleSignupEmail() {
        log('Logging in email')
        try{
            emailSignUp && emailSignUp(email, password);
        } catch (e) {
            log(e);
        }
    }

    const onSubmit = async () => {
        try {
            if(emailSignUp) {
                await emailSignUp(email, password);
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
        <div className='sign-up'>
            <div className='sign-up-area'>
                <h1>Welcome back</h1>
                <div className='sign-up-data-area'>
                    <input 
                        type="text"
                        placeholder='Email'
                        className='sign-up-input'
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password"
                        placeholder='Password'
                        onChange={(e) => setPassword(e.target.value)}
                        className='sign-up-input'
                    />
                    {registeringError && 
                        <div className='auth-error-area'>
                            <p className='auth-error-text'>{registeringError}</p>
                        </div>
                    }
                    <LoginButton text='Sign-up' onLogin={handleSignupEmail}/>
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
