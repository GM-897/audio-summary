import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <div className="App">
      <nav>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link>
      </nav>
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
