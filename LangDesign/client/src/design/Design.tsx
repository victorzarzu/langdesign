import { useContext, useEffect } from 'react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import { useNavigate } from "react-router-dom";

const log = getLogger('Design');

export const Design: React.FC = () => {    
    //const {token} = useContext(AuthContext);
    let navigate = useNavigate();
    return (
        <>
            <h1>Design here</h1>
        </>
    )
}
