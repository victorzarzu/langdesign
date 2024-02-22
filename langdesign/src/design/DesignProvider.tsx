import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { storage } from '../configs/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { set, ref as dbRef, push, get } from 'firebase/database'
import { v4 } from 'uuid';
import { AuthContext } from '../auth/AuthProvider';
import { database } from '../configs/firebase';

const log = getLogger('DesignProvider');

type UploadFn = (image: File, uid: string) => Promise<string>;
type DesignFn = (image: string, prompt: string, uid: string) => Promise<string>;
type UndoFn = () => void;
type LoadDesignFn = (designName: string) => void;

export interface DesignImage {
    imageUrl: string;
    parentImageUrl: string;
    parentPrompt?: string;
    children?: DesignImage[];
}

export interface DesignProps {
    name: string,
    lastUpdated: number 
    images?: DesignImage[]
    currentImageIndex: number;
}

export interface ExistentDesignProps {
    name: string;
}

export interface DesignsState {
    designs: ExistentDesignProps[];
    currentDesign: DesignProps;
    upload?: UploadFn;
    design?: DesignFn;
    undo?: UndoFn;
    loadDesign?: LoadDesignFn;
}

const initialState: DesignsState = {
    designs: [],
    currentDesign: {name: '', lastUpdated: 1, currentImageIndex: 0}
};

export const DesignContext = React.createContext<DesignsState>(initialState);

interface DesignProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
    const [state, setState] = useState<DesignsState>(initialState);
    const {uid, isAuthenticated} = useContext(AuthContext);
    const { currentDesign, designs } = state;
    const upload = useCallback<UploadFn>(uploadCallback, [designs, uid]);
    const design = useCallback<DesignFn>(designCallback, [currentDesign]);
    const undo = useCallback<UndoFn>(undoCallback, [currentDesign]);
    const loadDesign = useCallback<LoadDesignFn>(loadDesignCallback, [currentDesign]);
    const value = { currentDesign, designs, upload, design, undo, loadDesign };
    const newDesignName = 'New design';
    log('render');

    useEffect(() => {
        if(!isAuthenticated) {
            setState(initialState)
        } else {
            fetchUserDesigns();
        }
    }, [isAuthenticated])

    return (
        <DesignContext.Provider value={value}>
            {children}
        </DesignContext.Provider>
    );

    async function fetchUserDesigns() {
        try {
            const snapshot = await get(dbRef(database, `users/${uid}/designs`));
            if (snapshot.exists()) {
                const designsData = snapshot.val();
                const designsArray = Object.keys(designsData).map(key => ({
                    name: designsData[key].name,
                }));
                setState(prevState => ({
                    ...prevState,
                    designs: designsArray.reverse()
                }));
            } else {
                console.log("No designs found for the user", uid);
            }
        } catch (error) {
            console.error("Error fetching user designs:", error);
        }
    }

    function getCurrentTimestamp(): number {
        return Math.floor(Date.now() / 1000)
    }

    function createDesign(firstImageUrl: string) {
        const designName = newDesignName + designs.length + '_' + uid + '_' + v4();
        const lastUpdated = getCurrentTimestamp()

        set(dbRef(database, 'designs/' + designName), {
            images: [{imageUrl: firstImageUrl, parentImageUrl: 'startImage'}],
            lastUpdated: lastUpdated
        });

        setState(prevState => ({
            ...prevState,
            designs: [
                { name: designName, lastUpdated: lastUpdated, currentImageIndex: 0 },
                ...prevState.designs,
            ],
            currentDesign: { name: designName, lastUpdated: lastUpdated, currentImageIndex: 0, images: [{ imageUrl: firstImageUrl, parentImageUrl: 'startImage' }] }
        }));

        return designName
    }

    function addDesignToUser(designName: string) {
        const userDesignsRef = dbRef(database, `users/${uid}/designs`);
        const newDesign = push(userDesignsRef);
        set(newDesign, {
            name: designName,
        })
    }

    function uploadCallback(image: File, uid: string): Promise<string> {
        const imageRef = ref(storage, `designs/${uid}/${image.name + v4()}`);
        return new Promise((resolve, reject) => {
            uploadBytes(imageRef, image).then((snapshot) => {
                getDownloadURL(snapshot.ref).then((url) => {
                    resolve(url); 
                    const designName = createDesign(url)
                    addDesignToUser(designName)
                }).catch(reject); 
            }).catch(reject); 
        });
    }

    async function loadDesignCallback(designName: string) {
        try {
            const snapshot = await get(dbRef(database, `designs/${designName}`));
            if (snapshot.exists()) {
                const designData = snapshot.val();
                setState(prevState => ({
                    ...prevState,
                    currentDesign: { 
                        ...prevState.currentDesign, 
                        currentImageIndex: designData.images.length - 1,
                        lastUpdated: designData.lastUpdated,
                        images: designData.images,
                        name: designName
                    }
                }));
            }
        } catch (error) {
            console.error("Error fetching user designs:", error);
        }
    }

    function undoCallback(): void {
        const undoIndex = currentDesign.images?.findIndex(image => currentDesign.images && image.imageUrl == currentDesign.images[currentDesign.currentImageIndex].parentImageUrl) || 0
        console.log('undo', undoIndex);
        setState(prevState => ({
            ...prevState,
            currentDesign: { 
                ...prevState.currentDesign, 
                currentImageIndex: undoIndex,
            }
        }));
    }
    
    async function getImageFileFromUrl(imageUrl: string): Promise<File> {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
    
            const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
    
            const file = new File([blob], fileName, { type: blob.type });
            return file;
        } catch (error) {
            console.error('Error fetching image:', error);
            throw error;
        }
    }

    async function addImageToDesign(designName: string, imageUrl: string, parentImageUrl: string) {
        const designRef = dbRef(database, 'designs/' + designName);
        
        try {
            const designSnapshot = await get(designRef);
            const currentDesign = designSnapshot.val();
            const lastUpdated = getCurrentTimestamp()
            
            if (currentDesign !== null) {
                const currentImages: DesignImage[] = currentDesign.images || [];
                //const parentIndex = currentImages.findIndex(image => image.imageUrl == currentDesign.images[currentDesign.currentImageIndex].parentImageUrl) || 0
                
                const updatedImages = [
                    ...currentImages,
                    { imageUrl: imageUrl, parentImageUrl: parentImageUrl }
                ];
                //updatedImages[parentIndex] = {...updatedImages[parentIndex], }

                await set(designRef, {
                    images: updatedImages,
                    lastUpdated: lastUpdated 
                });
                setState(prevState => ({
                    ...prevState,
                    currentDesign: { name: designName, lastUpdated: lastUpdated, currentImageIndex: updatedImages.length - 1, images: updatedImages }
                }));
            } else {
                console.error('Design document does not exist');
            }
        } catch (error) {
            console.error('Error adding image to design:', error);
            throw error;
        }
    }
    
    async function sendForDesign(image: File, prompt: string): Promise<any> {
        const formData = new FormData();
        formData.append('image', image);
    
        try {
            const response = await axios.post('http://127.0.0.1:5000/design', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                params: {
                    prompt: prompt
                },
                responseType: 'arraybuffer'
            });
            const blob = new Blob([response.data], { type: 'image/jpeg' });
            console.log('Request successful')
    
            return blob;
        } catch (error) {
            console.error('Error:', error);
            throw error; 
        }
    }
    
    function designCallback(imageUrl: string, prompt: string, uid: string): Promise<string> {
        console.log('called design callback')
        return new Promise(async (resolve, reject) => {
            try {
                const imageFile = await getImageFileFromUrl(imageUrl);
                const designedImageBlob = await sendForDesign(imageFile, prompt);
                
                const imageRef = ref(storage, `designs/${uid}/${imageFile.name + v4()}`);
                uploadBytes(imageRef, designedImageBlob).then((snapshot) => {
                    getDownloadURL(snapshot.ref).then((url) => {
                        addImageToDesign(currentDesign?.name || "", url, imageUrl);
                        resolve(url); 
                    }).catch(reject); 
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }
};