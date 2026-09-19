import React from 'react';

interface SequenceImageDisplayProps {
  imageUrls: string[];
}

export const SequenceImageDisplay: React.FC<SequenceImageDisplayProps> = ({ imageUrls }) => {
  if (imageUrls.length === 1) {
    return (
      <div className="sequence-images-container-single" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <img 
          src={imageUrls[0]} 
          alt="4-panel sequence" 
          className="sequence-image-single"
          style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} 
        />
      </div>
    );
  }

  return (
    <div className="sequence-images-container">
      {imageUrls.map((url, index) => (
        <div key={index} className="sequence-image-wrapper">
          <img src={url} alt={`Panel ${index + 1}`} className="sequence-image" />
          <div className="sequence-number-badge">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};
