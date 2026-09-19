import React from 'react';

interface TopPageProps {
  onSelectTest: (testName: string) => void;
}

export const TopPage: React.FC<TopPageProps> = ({ onSelectTest }) => {
  return (
    <div className="top-page-container">
      <div className="top-page-overlay"></div>
      <div className="top-page-content">
        <h1 className="top-page-title">AI試験官による航空英語能力試験対策</h1>
        
        <div className="top-page-buttons">
          <button 
            className="top-page-btn" 
            onClick={() => onSelectTest('PictureDescription')}
          >
            Single Picture Description
          </button>
          
          <button 
            className="top-page-btn" 
            onClick={() => onSelectTest('ATCCommunication')}
          >
            ATC Communication
          </button>
          
          <button 
            className="top-page-btn" 
            onClick={() => onSelectTest('SequencePicture')}
          >
            Sequence Picture Description
          </button>
        </div>
      </div>
    </div>
  );
};
