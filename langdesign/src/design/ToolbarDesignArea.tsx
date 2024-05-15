import React, { useState, useRef, useContext } from 'react';
import './css/design-area.css';
import { getLogger } from '../core';
import { DesignContext } from './DesignProvider';
import { saveAs } from 'file-saver';
import Form from 'react-bootstrap/Form';
import { FaArrowRotateLeft, FaArrowRotateRight, FaX, FaDownload, FaRegPenToSquare, FaCheck, FaRegTrashCan } from "react-icons/fa6";

const log = getLogger('FileUploader')

export const ToolbarDesignArea: React.FC = ({  }) => {
    const { upload, design, undo, loadDesign, startNew, forward, rename, currentDesign, designs } = useContext(DesignContext);
    const [isNameEditing, setIsNameEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isNextVisible, setIsNextVisible] = useState(false);
    const [editedName, setEditedName] = useState('');
    const designTitleInputRef = useRef<HTMLInputElement>(null);

    function forwardDisabled() {
        return currentDesign && currentDesign.images && 
        (currentDesign.images[currentDesign.currentImageIndex].children == undefined || currentDesign.images[currentDesign.currentImageIndex].children?.length == 0)
    }

    function handleSaveImage() {
        if (currentDesign && currentDesign.images) {
            const imageUrl = currentDesign.images[currentDesign.currentImageIndex].imageUrl;
            fetch(imageUrl)
                .then(response => response.blob())
                .then(blob => {
                    saveAs(blob, `${currentDesign.name}.png`);
                })
                .catch(error => {
                    console.error('Error saving image:', error);
                });
        }
    }

    function handleRename() {
        if(!isNameEditing) {
            setEditedName(currentDesign.name);
            setIsNameEditing(true);
            if(designTitleInputRef.current) {
                console.log('focus');
            }
            designTitleInputRef.current && designTitleInputRef.current.focus();
            return;
        }
        rename && rename(editedName, currentDesign.code);
        setIsNameEditing(false);
    }

    function handleUndo() {
        log('Undo')
        undo && undo();
    }

    function handleDeleteDesign() {

    }

  return (
    <div className="toolbar-design-area">
        <div className="toolbar-title">
            {!isNameEditing ? 
                <div className="design-title"><h1 id="design-title">{currentDesign.name}</h1></div>
                :
                    <Form.Control 
                        id="design-title-input" 
                        ref={designTitleInputRef} 
                        value={editedName} 
                        type="text" 
                        onChange={(e: any) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                                handleRename();
                            }
                        }}
                    />                            
            }
            <button className="toolbar-buttton" id='design-title-button' onClick={handleRename}>
                {!isNameEditing ? <FaRegPenToSquare /> : <FaCheck />} 
            </button>
        </div>
        <div className="toolbar-buttons">
            {confirmDelete && 
                <button className="toolbar-button" onClick={() => setConfirmDelete(false)}>
                    Cancel
                </button>
            }
            <button className="toolbar-button" onClick={handleDeleteDesign}>
                {!confirmDelete ? <FaRegTrashCan /> : 'Sure?' }
            </button>
            <button className="toolbar-button" onClick={handleSaveImage}>
                <FaDownload />
            </button>
            <button className="toolbar-button" onClick={handleUndo} disabled={currentDesign.currentImageIndex == 0}>
                <FaArrowRotateLeft />
            </button>
            <button className="toolbar-button" onClick={() => {setIsNextVisible(true)}} disabled={forwardDisabled()}>
                <FaArrowRotateRight />
            </button>
        </div>
    </div>
  );
};
