import { useContext, useEffect } from 'react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";

const log = getLogger('SignUp');

export const SignUp: React.FC = () => {    
    const { loginGoogle, isAuthenticated, authenticationError } = useContext(AuthContext);
    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);
    async function handleLoginGoogle() {
        log('Signing up')
        loginGoogle && loginGoogle()
    }
    return (
        <div className='sign-up'>
            <h1>Create your account</h1>
            {authenticationError && <p>Error authenticating</p>}
            <button onClick={handleLoginGoogle}>Continue with Google</button>
        </div>
    )
}
