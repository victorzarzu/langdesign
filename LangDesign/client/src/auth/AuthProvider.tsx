import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { googleLogout } from '@react-oauth/google';

const log = getLogger('AuthProvider');

type LoginFn = (token: string) => void;
type LogoutFn = () => void;

export interface AuthState {
    isAuthenticated: boolean;
    pendingLogout: boolean;
    login?: LoginFn;
    logout?: LogoutFn;
    token: string;
}

const initialState: AuthState = {
    isAuthenticated: false,
    pendingLogout: false,
    token: '',
};

export const AuthContext = React.createContext<AuthState>(initialState);

interface AuthProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>(initialState);
    const { isAuthenticated, pendingLogout,  token } = state;
    const login = useCallback<LoginFn>(loginCallback, []);
    const logout = useCallback<LogoutFn>(logoutCallback, []);
    useEffect(checkAuthenticateEffect, []);
    useEffect(logoutEffect, [pendingLogout])
    const value = { isAuthenticated, login, logout, token };
    log('render');

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

    function loginCallback(token: string): void {
        log('login');
        localStorage.setItem('token', token);
        setState({
            ...state,
            token,
            isAuthenticated: true,
        });
    }

    function logoutCallback(): void {
        log('logout');
        setState({
            ...state,
            pendingLogout: true
        });
    }

    function checkAuthenticateEffect() {
        let canceled = false;
        checkAuthenticate();
        return () => {
            canceled = true;
        }

        async function checkAuthenticate() {
            try {
                const tk = localStorage.getItem('token');
                if(tk) {
                    console.log('Token found', tk);
                    setState({
                        ...state,
                        token: tk,
                        isAuthenticated: true,
                    });
                }
            } catch (error) {
                if (canceled) {
                    return;
                }
                log('authenticate failed');
                setState({
                    ...state,
                });
            }
        }
    }

    function logoutEffect() {
        let canceled = false;
        if(pendingLogout) {
            logoutLocal();
        }
        return () => {
            canceled = true;
        }

        async function logoutLocal() {
            try {
                localStorage.removeItem('token');
                googleLogout();
                setState({
                    ...state,
                    token: ''
                })
            } catch (error) {
                if (canceled) {
                    return;
                }
                console.error('Logout failed:', error);
                setState({
                    ...state,
                    pendingLogout: false,
                });
            }
        }
    }
};