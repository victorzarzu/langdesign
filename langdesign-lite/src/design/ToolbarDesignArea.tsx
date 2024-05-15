import { useContext, useState } from "react";
import "./css/design-area.css";
import { getLogger } from "../core";
import { saveAs } from 'file-saver';
import Form from 'react-bootstrap/Form';
import { FaRegTrashCan, FaArrowRotateLeft, FaArrowRotateRight, FaDownload, FaRegPenToSquare, FaCheck } from 'react-icons/fa6'; 
import { DesignContext } from "./DesignProvider";

export interface ToolbarDesignArea {
    setIsNextVisible: (nextVisible: boolean) => void;
    isNameEditing: boolean;
    setIsNameEditing: (nameEditing: boolean) => void;
}

const log = getLogger('ToolbarDesignArea');

export const ToolbarDesignArea: React.FC<ToolbarDesignArea> = ({setIsNextVisible, setIsNameEditing, isNameEditing}) => {    
    const [editedName, setEditedName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { undo, rename, deleteDesign, currentDesign } = useContext(DesignContext);

    function handleUndo() {
        log('Undo')
        undo && undo();
    }

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
            return;
        }
        rename && rename(editedName, currentDesign.code);
        setIsNameEditing(false);
    }

    function handleDeleteDesign() {
        if(!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setConfirmDelete(false);
        deleteDesign && deleteDesign(currentDesign.code);
    }

    return (
        <div className="toolbar-design-area">
        <div className="toolbar-title">
            {!isNameEditing ? 
                <div className="design-title"><h1 id="design-title">{currentDesign.name}</h1></div>
                :
                    <Form.Control 
                        id="design-title-input" 
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
