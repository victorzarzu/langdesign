import { useState, useContext } from "react"
import { ImageUploader } from "./ImageUploader";
import { FaPaperPlane } from 'react-icons/fa'; 
//import { DesignContext } from "./DesignProvider"
import { DesignContext } from "./DesignProvider";
import { getLogger } from "../core";
import { FaArrowRotateLeft } from "react-icons/fa6";

import './css/design-area.css'
import { AuthContext } from "../auth/AuthProvider";

const log = getLogger('DesignArea');

export const DesignArea: React.FC = () => {
    const [promptText, setPromptText] = useState('');
    const { upload, design, undo, loadDesign, currentDesign, designs } = useContext(DesignContext);
    const { uid } = useContext(AuthContext);

    function handleImageUpload(image: File) {
        log('File uploaded')
        //setUploadedImage(file)
        upload && upload(image, uid || "")
            .then(url => {
            })
            .catch(error => {
        });
    }

    function handlePromptSend() {
        log('Design started')
        design && currentDesign && currentDesign.images && design(currentDesign?.images[currentDesign.currentImageIndex].imageUrl, promptText, uid || "")
            .then(url => {
                setPromptText('')
            })
            .catch(error => {
        });
    }

    function handleUndo() {
        log('Undo')
        undo && undo();
    }

    return (
        <div className="design-area">
            {!currentDesign.images && 
                <div className="start-designing">
                    <h1 className="text-design">Start designing</h1>
                    <ImageUploader handleImage={handleImageUpload} />
                </div>
            }
            <div className="desings-list-area">
                    {designs && designs.map(design => (
                        <p key={design.name} className="design-list-element" onClick={() => loadDesign && loadDesign(design.name)}>{design.name.split("_").at(0)}</p>
                    ))}
            </div>
            {currentDesign.images && 
                <div className='current-design-area'>
                    <div className="toolbar-design-area">
                        <h2 id="design-title">{currentDesign.name.split("_").at(0)}</h2>
                        <div className="toolbar-buttons">
                            <button className="toolbar-button" onClick={handleUndo} disabled={currentDesign.currentImageIndex == 0}>
                                <FaArrowRotateLeft />
                            </button>
                        </div>
                    </div>
                    <div className="current-image-area">
                        <img className='presented-image-design' src={currentDesign && currentDesign.images && currentDesign?.images[currentDesign.currentImageIndex].imageUrl}/>
                    </div>
                </div>
            }
            {currentDesign.images && 
                <div className="prompt-area">
                    <input 
                        className="prompt-input" 
                        type="text" 
                        value={promptText} 
                        placeholder="Enter your prompt..."
                        onChange={(e) => setPromptText(e.target.value)} />
                    <button className="button-send" onClick={handlePromptSend} disabled={promptText == ''}>
                        <FaPaperPlane />
                    </button>
                </div>
            }
        </div>
    )
}
