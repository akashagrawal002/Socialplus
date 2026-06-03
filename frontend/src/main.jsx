import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161820',
            color: '#e8e9f0',
            border: '1px solid #1e2030',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#00d9a0', secondary: '#161820' } },
          error:   { iconTheme: { primary: '#ff6b6b', secondary: '#161820' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
