import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './auth/Login';
import { MainDesign } from './design/MainDesign';
import { AuthProvider } from './auth/AuthProvider';
import { GetStarted } from './auth/GetStarted';
import { SignUp } from './auth/SignUp';
import { PrivateRoute } from './auth/PrivateRoute'; 
import { DesignProvider } from './design/DesignProvider';

export default function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
          <DesignProvider>
              <Routes>
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/login" element={<Login />} />
                <Route path="/sign-up" element={<SignUp />} />
                  <Route path="/design" element={<PrivateRoute element={MainDesign} />}/>
                <Route path="/" element={<Navigate to="/design" />} />
              </Routes>
            </DesignProvider>
        </AuthProvider>
    </BrowserRouter>
  );
}
