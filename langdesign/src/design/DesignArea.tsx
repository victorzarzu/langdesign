import { useState, useContext } from "react"
import { ImageUploader } from "./ImageUploader";
import { FaPaperPlane } from 'react-icons/fa'; 
import { DesignContext } from "./DesignProvider";
import { getLogger } from "../core";
import { FaArrowRotateLeft, FaArrowRotateRight, FaX } from "react-icons/fa6";

import './css/design-area.css'
import { AuthContext } from "../auth/AuthProvider";
import { HistoryDesign } from "./HistoryDesign";
import { ForwardDesignCard } from "./ForwardDesignCard";

const log = getLogger('DesignArea');

export const DesignArea: React.FC = () => {
    const [promptText, setPromptText] = useState('');
    const [isNextVisible, setIsNextVisible] = useState(false)
    const { upload, design, undo, loadDesign, startNew, forward, currentDesign, designs } = useContext(DesignContext);
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

    function handleStartNewDesign() {
        log('Start new design')
        startNew && startNew();
    }

    function handleForwardClose(imageUrl: string) {
        if(!forward) {
            return;
        }
        forward(imageUrl);
        setIsNextVisible(false);
    }

    function forwardDisabled() {
        return currentDesign && currentDesign.images && 
        (currentDesign.images[currentDesign.currentImageIndex].children == undefined || currentDesign.images[currentDesign.currentImageIndex].children?.length == 0)
    }

    return (
        <div className="design-area">
            {!currentDesign.images && 
                <div className="start-designing">
                    <h1 className="text-design">Start designing</h1>
                    <ImageUploader handleImage={handleImageUpload} />
                </div>
            }
            <div className="desings-history-area">
                    <button id="start-new-button" onClick={handleStartNewDesign} disabled={!currentDesign.images}>Start new design</button>
                    {designs && designs.map(design => (
                        <HistoryDesign key={design.name} name={design.name.split("_").at(0) || ""} onClick={() => loadDesign && loadDesign(design.name)} />
                        //<p key={design.name} className="design-list-element" onClick={() => loadDesign && loadDesign(design.name)}>{design.name.split("_").at(0)}</p>
                    ))}
            </div>
            {currentDesign.images && 
                <div className='current-design-area'>
                    <div className="toolbar-design-area">
                        <h1 id="design-title">{currentDesign.name.split("_").at(0)}</h1>
                        <div className="toolbar-buttons">
                            <button className="toolbar-button" onClick={handleUndo} disabled={currentDesign.currentImageIndex == 0}>
                                <FaArrowRotateLeft />
                            </button>
                            <button className="toolbar-button" onClick={() => {setIsNextVisible(true)}} disabled={forwardDisabled()}>
                                <FaArrowRotateRight />
                            </button>
                        </div>
                    </div>
                    <div className="current-image-area">
                        <img className='presented-image-design' src={currentDesign && currentDesign.images && currentDesign.images[currentDesign.currentImageIndex].imageUrl}/>
                    </div>
                </div>
            }
            {isNextVisible && 
                <div className="current-design-area next-design-area">
                    <div className="toolbar-next-design-area">
                        <button id="close-next-design-area-button" onClick={() => {setIsNextVisible(false)}}>
                            <FaX />
                        </button>
                    </div>
                    <div>
                        {currentDesign && currentDesign.images && currentDesign.images[currentDesign.currentImageIndex].children?.map(image => (
                            <ForwardDesignCard 
                                key={image.imageUrl} 
                                imageUrl={image.imageUrl} 
                                prompt={image.creationPrompt || ""} 
                                onClick={() => handleForwardClose(image.imageUrl)} 
                            />
                        ))}
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
