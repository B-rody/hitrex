import { useState, useEffect } from 'react';
import { Recorder } from './renderer/features/recorder/Recorder';
import { Editor } from './renderer/features/editor/Editor';
import { RenderView } from './renderer/features/editor/RenderView';
import { ProjectLibrary } from './renderer/features/projects/ProjectLibrary';
import { OverlayView } from './renderer/OverlayView';
import { TitleBar } from './renderer/components/TitleBar';

function App() {
  const [view, setView] = useState<'library' | 'recorder' | 'editor' | 'render' | 'overlay'>('recorder');
  const [projectPath, setProjectPath] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'render') {
      setView('render');
    } else if (params.get('overlay') === 'true') {
      setView('overlay');
      // Make body transparent for overlay
      document.body.style.background = 'transparent';
      document.body.style.backgroundImage = 'none';
    }
  }, []);

  const handleRecordingSaved = (path: string) => {
    setProjectPath(path);
    setView('editor');
  };

  const handleBackToLibrary = () => {
    setView('library');
    setProjectPath(null);
  };

  if (view === 'render') {
    return <RenderView />;
  }

  if (view === 'overlay') {
    return <OverlayView />;
  }

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col overflow-hidden">
      <TitleBar />
      <div className="flex-1">
        {view === 'library' ? (
          <ProjectLibrary
            onNewRecording={() => setView('recorder')}
            onOpenProject={(path) => {
              setProjectPath(path);
              setView('editor');
            }}
          />
        ) : view === 'recorder' ? (
          <Recorder
            onSaved={handleRecordingSaved}
            onLibrary={handleBackToLibrary}
          />
        ) : (
          projectPath && (
            <Editor
              projectPath={projectPath}
              onBack={handleBackToLibrary}
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;


