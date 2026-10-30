import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

createRoot(document.getElementById('root')).render(createElement(App));
