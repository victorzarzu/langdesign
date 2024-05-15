import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { signInWithPopup, GoogleAuthProvider, signOut, FacebookAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from '../configs/firebase'
import { ref, set, onValue } from "firebase/database";

const log = getLogger('AuthProvider');

type LoginFn = () => void;
type LogoutFn = () => void;
type EmailLoginFn = (email : string, password : string) => void;
type EmailSignUpFn = (email : string, password : string) => void;

export interface AuthState {
    isAuthenticated: boolean;
    pendingLogout: boolean;
    googleLogin?: LoginFn;
    emailLogin?: EmailLoginFn;
    emailSignUp?: EmailLoginFn;
    facebookLogin?: LoginFn;
    logout?: LogoutFn;
    token?: string;
    uid?: string;
    email?: string;
    authenticationError?: string;
}

const initialState: AuthState = {
    isAuthenticated: false,
    pendingLogout: false,
};

export const AuthContext = React.createContext<AuthState>(initialState);

interface AuthProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>(initialState);
    const { isAuthenticated, pendingLogout,  token, uid } = state;
    const provider = new GoogleAuthProvider();
    const googleLogin = useCallback<LoginFn>(loginGoogleCallback, []);
    const emailLogin = useCallback<EmailLoginFn>(emailLoginCallback, []);
    const emailSignUp = useCallback<EmailSignUpFn>(emailSignupCallback, []);
    //const facebookLogin = useCallback<LoginFn>(loginFacebookCallback, []);
    const logout = useCallback<LogoutFn>(logoutCallback, []);
    useEffect(checkAuthenticateEffect, []);
    useEffect(logoutEffect, [pendingLogout])
    const value = { isAuthenticated, pendingLogout, googleLogin, logout, emailLogin, emailSignUp, token, uid };
    log('render');

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

    function writeUserDataIfNew(uid: string, email: string) {
        const userRef = ref(database, 'users/' + uid);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if(!data) {
                set(userRef, {
                    email: email,
                });
            }
          });
      }

    function loginGoogleCallback(): void {
        log('Log in')
        signInWithPopup(auth, provider)
            .then((result) => {
                log('Log in succeeded');
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential?.accessToken;
                const user = result.user;
                if(token) {
                    localStorage.setItem('token', token);
                }
                if(user) {
                    localStorage.setItem('uid', user.uid);
                }
                if(user.email) {
                    localStorage.setItem('email', user.email);
                }
                if(user.uid && user.email) {
                    writeUserDataIfNew(user.uid, user.email);
                }
                setState({
                    ...state,
                    token,
                    uid: user.uid,
                    email: user.email || "",
                    isAuthenticated: true
                })
            }).catch((error) => {
                log('Log in failed');
                setState({
                    ...state,
                    authenticationError: error.message
                })
                /*
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                */
            });
    }

    function loginFacebookCallback(): void {
        log('Log in')
        signInWithPopup(auth, provider)
            .then((result) => {
                log('Log in succeeded');
                const credential = FacebookAuthProvider.credentialFromResult(result);
                const token = credential?.accessToken;
                const user = result.user;
                /*if(token) {
                    localStorage.setItem('token', token);
                }
                if(user) {
                    localStorage.setItem('uid', user.uid);
                }
                if(user.email) {
                    localStorage.setItem('email', user.email);
                }
                setState({
                    ...state,
                    token,
                    uid: user.uid,
                    email: user.email || "",
                    isAuthenticated: true
                })*/
                console.log('token', token);
                console.log('user', user);
            }).catch((error) => {
                log('Log in failed');
                setState({
                    ...state,
                    authenticationError: error.message
                })
                /*
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                */
            });
    }

    function emailLoginCallback(email: string, password: string): void {
        log('Email log in')
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const token = userCredential?.accessToken;
                const user = userCredential.user;
                if(token) {
                    localStorage.setItem('token', token);
                }
                if(user) {
                    localStorage.setItem('uid', user.uid);
                }
                if(user.email) {
                    localStorage.setItem('email', user.email);
                }
                if(user.uid && user.email) {
                    writeUserDataIfNew(user.uid, user.email);
                }
                setState({
                    ...state,
                    token,
                    uid: user.uid,
                    email: user.email || "",
                    isAuthenticated: true
                })
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("An error occurred during sign-in:", errorMessage);
            });
    }

    function emailSignupCallback(email: string, password: string): void {
        log('Email log in')
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const token = userCredential?.accessToken;
                const user = userCredential.user;
                if(token) {
                    localStorage.setItem('token', token);
                }
                if(user) {
                    localStorage.setItem('uid', user.uid);
                }
                if(user.email) {
                    localStorage.setItem('email', user.email);
                }
                if(user.uid && user.email) {
                    writeUserDataIfNew(user.uid, user.email);
                }
                setState({
                    ...state,
                    token,
                    uid: user.uid,
                    email: user.email || "",
                    isAuthenticated: true
                })
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("An error occurred during sign-in:", errorMessage);
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
                const token = localStorage.getItem('token');
                const uid = localStorage.getItem('uid');
                const email = localStorage.getItem('email');
                if(token) {
                    setState({
                        ...state,
                        token,
                        uid: uid || undefined,
                        email: email || undefined,
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
                signOut(auth).then(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('uid');
                    localStorage.removeItem('email');
                    setState({
                        ...state,
                        token: '',
                        uid: undefined,
                        email: undefined,
                        isAuthenticated: false,
                    })

                  }).catch(() => {

                  });                
            } catch (error) {
                if (canceled) {
                    return;
                }
                log('Logout failed:', error);
                setState({
                    ...state,
                    pendingLogout: false,
                });
            }
        }
    }
};