import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainDesign } from './design/MainDesign';
import { AuthProvider } from './auth/AuthProvider';
import { DesignProvider } from './design/DesignProvider';

export default function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
          <DesignProvider>
              <Routes>
                <Route path="/design" element={<MainDesign />}/>
              </Routes>
            </DesignProvider>
        </AuthProvider>
    </BrowserRouter>
  );
}
