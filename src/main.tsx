
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './Components/Home';
import Hero from './Components/Hero';
import Nav from './Components/Nav';
import Header from './Components/Header';
import Scroll from './Components/scroll';
import ErrorPage from './Components/ErrorPage';
import White from './Components/white';
import Test from './Components/Test';
import About from './Components/About';
import Solution from './Components/Solution';
import Verify from './Components/Verify';
import Watch from './Components/Watch';
import Data360Passport from './Components/Data360Passport';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
const router = createBrowserRouter([
  { path: "hero",     element: <Hero /> },
  {path: "test",     element: <Test /> },
  { path: "nav",      element: <Nav /> },
  { path: "/",        element: <Home /> },
  { path: "solution", element: <Solution /> },
  { path: "header",   element: <Header /> },
  { path: "about",    element: <About /> },
  { path: "white",    element: <White /> },
  { path: "verify",   element: <Verify /> },
  { path: "watch",    element: <Watch /> },
  { path: "passport", element: <Data360Passport /> },
  { path: "scroll",   element: <Scroll /> },
  { path: "*",        element: <ErrorPage /> },
]);
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
