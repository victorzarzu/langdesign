import { useContext, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";

const log = getLogger('Login');

export const SignUp: React.FC = () => {    
    const { login, isAuthenticated } = useContext(AuthContext);
    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);
    return (
        <>
            <div>
                <h2>Get started</h2>
                <GoogleLogin
                    onSuccess={credentialResponse => {
                        login?.(credentialResponse.credential || "")
                    }}
                    onError={() => {
                        console.log('Sign up Failed');
                    }}
                />
            </div>
        </>
    )
}
