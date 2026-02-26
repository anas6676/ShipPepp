import { useState, useEffect } from 'react'
import { Upload, Camera, Database, Paintbrush, Moon, Sun, Printer } from 'lucide-react'

// Import components
import PDFUpload from './components/PDFUpload'
import CameraCapture from './components/CameraCapture'
import LabelPreview from './views/LabelPreview'
import LabelDesigner from './views/LabelDesigner'
import HistoryView from './views/HistoryView'

// View state enum
type View = 'UPLOAD' | 'CAMERA' | 'DESIGNER' | 'HISTORY' | 'PREVIEW';

function App() {
  const [currentView, setCurrentView] = useState<View>('UPLOAD')
  const [darkMode, setDarkMode] = useState(false)

  // Store the extracted data and file path globally across views 
  const [extractedData, setExtractedData] = useState<any>(null)
  const [sourceFilePath, setSourceFilePath] = useState<string | null>(null)

  // Detect mobile screen for default view
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile && currentView === 'UPLOAD') {
        setCurrentView('CAMERA');
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentView]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Handle successful extraction from file or camera
  const handleExtractionSuccess = (data: any, filePath?: string) => {
    setExtractedData(data)
    setSourceFilePath(filePath || null)
    setCurrentView('PREVIEW')
  }

  const resetFlow = () => {
    setExtractedData(null)
    setSourceFilePath(null)
    setCurrentView('UPLOAD')
  }

  return (
    <div className={`min-h-screen flex w-full relative ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar Navigation - Hidden on Mobile */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex-col transition-colors duration-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-dark-border">
          <Printer className="w-6 h-6 text-primary-500 mr-2" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-600">
            InkLabel Pro
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavButton
            active={currentView === 'UPLOAD' || currentView === 'PREVIEW'}
            onClick={() => setCurrentView('UPLOAD')}
            icon={<Upload size={20} />}
            label="Upload PDF"
          />
          <NavButton
            active={currentView === 'CAMERA'}
            onClick={() => setCurrentView('CAMERA')}
            icon={<Camera size={20} />}
            label="Capture Delivery"
          />
          <NavButton
            active={currentView === 'DESIGNER'}
            onClick={() => setCurrentView('DESIGNER')}
            icon={<Paintbrush size={20} />}
            label="Label Designer"
          />
          <NavButton
            active={currentView === 'HISTORY'}
            onClick={() => setCurrentView('HISTORY')}
            icon={<Database size={20} />}
            label="Database Manager"
          />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-dark-border">
          <button
            onClick={toggleDarkMode}
            className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* Add pb-24 on mobile to prevent content hiding behind the new bottom bar */}
      <main className="flex-1 bg-slate-50 dark:bg-dark-bg overflow-auto transition-colors duration-200 pb-24 md:pb-0">
        <header className="h-16 border-b border-slate-200 dark:border-dark-border bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm sticky top-0 flex items-center justify-between px-4 md:px-8 z-10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white truncate pr-4">
            {currentView === 'UPLOAD' && 'Upload PDF Note'}
            {currentView === 'PREVIEW' && 'Verify & Print Label'}
            {currentView === 'CAMERA' && 'Capture Note from Camera'}
            {currentView === 'DESIGNER' && 'Visual Label Designer'}
            {currentView === 'HISTORY' && 'Database Manager'}
          </h2>
          {/* Mobile Dark Mode Toggle Navbar Level */}
          <button
            onClick={toggleDarkMode}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {currentView === 'UPLOAD' && (
            <PDFUpload onSuccess={handleExtractionSuccess} />
          )}

          {currentView === 'PREVIEW' && (
            <LabelPreview
              extractedData={extractedData}
              sourceFilePath={sourceFilePath}
              onReset={resetFlow}
            />
          )}

          {currentView === 'CAMERA' && (
            <CameraCapture onSuccess={handleExtractionSuccess} />
          )}

          {currentView === 'DESIGNER' && (
            <LabelDesigner />
          )}

          {currentView === 'HISTORY' && (
            <HistoryView />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border-t border-slate-200 dark:border-dark-border z-50 flex justify-around items-end px-2 pb-4 pt-2">
        <MobileNavButton
          active={currentView === 'UPLOAD'}
          onClick={() => setCurrentView('UPLOAD')}
          icon={<Upload size={24} />}
          label="Upload"
        />

        {/* Massive Primary Camera Button in Center */}
        <div className="relative -top-6 flex flex-col items-center group">
          <button
            onClick={() => setCurrentView('CAMERA')}
            className={`p-4 rounded-full shadow-xl transition-transform active:scale-95 ${currentView === 'CAMERA' ? 'bg-primary-600 shadow-primary-500/40 text-white scale-110' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}
          >
            <Camera size={32} />
          </button>
          <span className="text-[10px] font-bold mt-2 text-primary-600 dark:text-primary-400">CAMERA</span>
        </div>

        <MobileNavButton
          active={currentView === 'HISTORY'}
          onClick={() => setCurrentView('HISTORY')}
          icon={<Database size={24} />}
          label="Database"
        />
      </div>
    </div>
  )
}

function NavButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
        }`}
    >
      <span className={`mr-3 ${active ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function MobileNavButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 gap-1 ${active ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300'}`}
    >
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-primary-50 dark:bg-primary-900/20 shadow-sm' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-primary-600 dark:text-primary-400' : ''}`}>{label}</span>
    </button>
  )
}

export default App
