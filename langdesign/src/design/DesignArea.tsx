import { useState, useContext, useRef } from "react"
import { ImageUploader } from "./ImageUploader";
import { FaPaperPlane } from 'react-icons/fa'; 
import { DesignContext } from "./DesignProvider";
import { getLogger } from "../core";
import { FaArrowRotateLeft, FaArrowRotateRight, FaX, FaDownload, FaRegPenToSquare, FaCheck } from "react-icons/fa6";
import { saveAs } from 'file-saver';
import Image from 'react-bootstrap/Image';

import './css/design-area.css'
import { AuthContext } from "../auth/AuthProvider";
import { HistoryDesign } from "./HistoryDesign";
import { ForwardDesignCard } from "./ForwardDesignCard";
import { ToolbarDesignArea } from "./ToolbarDesignArea";

const log = getLogger('DesignArea');

export const DesignArea: React.FC = () => {
    const [promptText, setPromptText] = useState('');
    const [editedName, setEditedName] = useState('');
    const [isNameEditing, setIsNameEditing] = useState(false);
    const [isNextVisible, setIsNextVisible] = useState(false)
    const { upload, design, undo, loadDesign, startNew, forward, rename, currentDesign, designs, designLoading, designError } = useContext(DesignContext);
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


    return (
        <div className="design-area">
            {!currentDesign.images && 
                <div className="start-designing">
                    <h1 className="text-design">Start designing</h1>
                    <ImageUploader handleImage={handleImageUpload} />
                </div>
            }
            <div className="desings-history-area">
                    <button id="start-new-button" onClick={handleStartNewDesign} disabled={!currentDesign.images}>New design</button>
                    {designs && designs.map(design => (
                        <HistoryDesign key={design.code} name={design.name || "New design"} onClick={() => {
                                loadDesign && loadDesign(design.code, design.name)
                                loadDesign && setIsNameEditing(false)
                                loadDesign && setIsNextVisible(false)
                            }} 
                        />
                        //<p key={design.name} className="design-list-element" onClick={() => loadDesign && loadDesign(design.name)}>{design.name.split("_").at(0)}</p>
                    ))}
            </div>
            {currentDesign.images && 
                <div className='current-design-area'>
                    <ToolbarDesignArea setNextVisible={setIsNextVisible}/> 
                    <div className="current-image-area">
                        {!designLoading && 
                            <div className="design-error">
                                <p className="design-error-text">{designError}</p>
                            </div>
                        }
                        {!designLoading && <Image className='presented-image-design' src={currentDesign && currentDesign.images && currentDesign.images[currentDesign.currentImageIndex].imageUrl}/>}
                        {designLoading && 
                            <div className="design-loading">
                                <h2>Designing...</h2>
                                <div className="loading-spinner"></div> 
                            </div>
                        }
                    </div>
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
                </div>
            }
            {isNextVisible && 
                <div className="current-design-area forward-design-area">
                    <div className="toolbar-forward-design-area">
                        <button id="close-forward-design-area-button" onClick={() => {setIsNextVisible(false)}}>
                            <FaX />
                        </button>
                    </div>
                    <div className="forward-area">
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
        </div>
    )
}
