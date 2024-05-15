import { useState, useContext } from "react";
import { ImageUploader } from "./ImageUploader";
import { FaPaperPlane, FaX} from 'react-icons/fa6'; 

import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Form from 'react-bootstrap/Form';

import './css/design-area.css';
import { DesignContext } from "./DesignProvider";
import { getLogger } from "../core";

const log = getLogger('DesignArea');

export const DesignArea: React.FC = () => {
    const [promptText, setPromptText] = useState('');
    const { upload, design, startNew, currentImage, designLoading, designError } = useContext(DesignContext);

    function handleImageUpload(image: File) {
        log('File uploaded')
        upload && upload(image);
    }

    function handlePromptSend() {
        log('Design started')
        design && currentImage && design(currentImage, promptText);
        setPromptText('');
    }


    function handleStartNewDesign() {
        log('Start new design')
        startNew && startNew();
    }

    return (
        <div className="design-area">
            {!currentImage && 
                <div className="start-designing">
                    <h1 className="text-design">Start designing</h1>
                    <ImageUploader handleImage={handleImageUpload} />
                </div>
            }
            {currentImage && 
                <div className='current-design-area'>
                    <div className="current-image-area">
                        {!designLoading && <p id="design-error">{designError}</p>}
                        {!designLoading && <Image className='presented-image-design' src={currentImage && URL.createObjectURL(currentImage)}/>}
                        {designLoading && <div className="design-loading">
                            <p>Designing...</p>
                            <div className="loading-spinner"></div>
                        </div>}
                    </div>
                    <div className="prompt-area">
                        <Form.Control 
                            className="prompt-input" 
                            type="text" 
                            value={promptText} 
                            placeholder="Enter your prompt..."
                            onChange={(e) => setPromptText(e.target.value)} />
                        <Button className="button-send" onClick={handlePromptSend} disabled={promptText == ''}>
                            <FaPaperPlane />
                        </Button>
                    </div>
                </div>
            }
        </div>
    )
}
