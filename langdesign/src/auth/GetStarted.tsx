import { useContext, useEffect } from 'react';
import { AuthContext } from './AuthProvider';
import { useNavigate } from "react-router-dom";
import './css/index.css'

export const GetStarted: React.FC = () => {    
    const {isAuthenticated} = useContext(AuthContext);
    let navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);
    return (
        <div className='get-started'>
            <h1>Get started</h1>
            <div className='get-started-area'>
                <button className='get-started-button' onClick={() => navigate('/login')}>Log in</button>
                <button className='get-started-button' onClick={() => navigate('/sign-up')}>Sign up</button>
            </div>
        </div>
    )
}
