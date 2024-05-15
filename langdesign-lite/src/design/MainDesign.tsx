import { useContext } from 'react';
import { AuthContext } from '../auth/AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";
import { DesignArea } from './DesignArea';

import "./css/design.css";

const log = getLogger('Design');

export const MainDesign: React.FC = () => {    
    const { isAuthenticated, logout } = useContext(AuthContext);
    let navigate = useNavigate();

    const handleSignOut = () => {
        log('Logging out')
        logout && logout(); 
        navigate("/get-started"); 
    };

    return (
        <div className='main-design'>
            {isAuthenticated && (
                <div className="main-topbar">
                    <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
                </div>
            )}
            <div className='design'>
                <DesignArea />
            </div>
        </div>
    );
};
