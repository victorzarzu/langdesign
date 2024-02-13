import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Login } from './auth/Login';
import { Design } from './design/Design';
import { AuthProvider } from "./auth/AuthProvider";
import { GetStarted } from './auth/GetStarted';
import { SignUp } from './auth/SignUp';
import { googleAuthClientId } from './configs';

export default function App() {
  return (
    <>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={googleAuthClientId}>
            <AuthProvider>
              <Routes>
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/login" element={<Login />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/design" element={<Design />} />
                <Route path="/" element={<Navigate to="/design" />} />
              </Routes>
            </AuthProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </>
  );
}
