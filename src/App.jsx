import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Board from './pages/Board'
import Collaborators from './pages/Collaborators'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:id" element={<Board />} />
        <Route path="/collaborators" element={<Collaborators />} />
      </Routes>
    </BrowserRouter>
  )
}
