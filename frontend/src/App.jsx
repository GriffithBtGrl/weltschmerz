import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111118',
            color: '#e5e7eb',
            border: '1px solid #242430',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          },
        }}
      />
      <Navbar />
      <main>
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/create"   element={<CreatePost />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/user/:username" element={<Profile />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default App;