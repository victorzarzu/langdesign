import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext, AuthState } from './AuthProvider';
import { getLogger } from '../core';

const log = getLogger('PrivateRoute');

export interface PrivateRouteProps {
    element: React.ElementType;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ element: Element }) => {    
    const { isAuthenticated } = useContext<AuthState>(AuthContext);
    log('render, isAuthenticated', isAuthenticated);
    if (!isAuthenticated) {
      return <Navigate to="/get-started" replace />;
    }
  
    return <Element/>;
};
