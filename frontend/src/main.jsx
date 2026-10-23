import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './AppShell.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
