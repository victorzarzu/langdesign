import React, { useRef } from 'react';
import './css/design-area.css';
import { getLogger } from '../core';

const log = getLogger('FileUploader')

interface ImageUploaderProps {
    handleImage: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ handleImage }) => {
    const hiddenFileInput = useRef<HTMLInputElement | null>(null);

    const handleClick = () => {
        hiddenFileInput && hiddenFileInput.current && hiddenFileInput.current.click();
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(!event.target.files) {
            return;
        }
        const fileUploaded = event.target.files[0];
        log("File uploaded")
        handleImage(fileUploaded);
    };

  return (
    <>
      <button
        className="button-upload"
        onClick={handleClick}
      >
        Upload a room image 
      </button>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{ display: 'none' }}
      />
    </>
  );
};
