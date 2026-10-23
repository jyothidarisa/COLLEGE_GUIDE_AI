import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import RecommendationsPage from './pages/RecommendationsPage';
import ExploreCollegesPage from './pages/ExploreCollegesPage';
import CollegeDetailPage from './pages/CollegeDetailPage';
import ComparePage from './pages/ComparePage';
import ChatbotPage from './pages/ChatbotPage';
import SourcesPage from './pages/SourcesPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import FloatingChatWidget from './components/FloatingChatWidget';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-ivory text-charcoal">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/colleges" element={<ExploreCollegesPage />} />
            <Route path="/colleges/:id" element={<CollegeDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/chat" element={<ChatbotPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/models" element={<ModelPerformancePage />} />
            <Route path="/model-performance" element={<ModelPerformancePage />} />
          </Routes>
        </main>
        <Footer />
        <FloatingChatWidget />
      </div>
    </Router>
  );
}
