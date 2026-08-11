import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';

export function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { 
            background: '#1e1e28', 
            color: '#f1f1f5',
            border: '1px solid rgba(255, 255, 255, 0.07)'
          } 
        }} 
      />
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
