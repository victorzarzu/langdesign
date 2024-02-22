import { useContext, useEffect } from 'react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";
import LoginButton from './LoginButton';

const log = getLogger('Login');

export const Login: React.FC = () => {    
    const { loginGoogle, isAuthenticated, authenticationError } = useContext(AuthContext);
    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);
    async function handleLoginGoogle() {
        log('Logging in Google')
        loginGoogle && loginGoogle()
    }
    return (
        <div className='login'>
            <h1>Welcome back</h1>
            {authenticationError && <p>Error authenticating</p>}
            <LoginButton text='Continue with Google' onLogin={handleLoginGoogle}/>
        </div>
    )
}
