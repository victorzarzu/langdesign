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
import { modelServerAddress } from '../configs/modelServer';

const log = getLogger('DesignProvider');

type UploadFn = (image: File) => void;
type DesignFn = (image: File, prompt: string) => Promise<string>;
type StartNewFn = () => void;

export interface HistoryDesignProps {
    code: string;
    name: string;
}

export interface DesignsState { 
    currentImage?: File
    designLoading: boolean;
    designError?: string;
    upload?: UploadFn;
    design?: DesignFn;
    startNew?: StartNewFn;
}

const initialState: DesignsState = {
    designLoading: false,
};

export const DesignContext = React.createContext<DesignsState>(initialState);

interface DesignProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
    const [state, setState] = useState<DesignsState>(initialState);
    const {uid, isAuthenticated} = useContext(AuthContext);
    const { currentImage, designLoading, designError } = state;
    const upload = useCallback<UploadFn>(uploadCallback, [currentImage]);
    const design = useCallback<DesignFn>(designCallback, [currentImage]);
    const startNew = useCallback<StartNewFn>(startNewCallback, [currentImage]);
    const value = { currentImage, designLoading, designError, upload, design, startNew};
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
                    code: designsData[key].code,
                    name: designsData[key].name
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

    function startNewCallback() {
        setState(prevState => ({
            ...prevState,
            currentImage: undefined
        }));
    }

    function uploadCallback(image: File) {
        setState(prevState => ({
            ...prevState,
            currentImage: image
        }));
    }


    function blobToImage(blob: Blob) {
        return new Promise(resolve => {
            const url = URL.createObjectURL(blob)
            let img = new Image()
                img.onload = () => {
                    URL.revokeObjectURL(url)
                    resolve(img)
                }
                img.src = url
            })
    }
  

    async function sendForDesign(image: File, prompt: string): Promise<any> {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('prompt', prompt);
    
        try {
            const response = await axios.post(modelServerAddress, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                responseType: 'arraybuffer'
            });
            console.log(response.data)
            const blob = new Blob([response.data], { type: 'image/jpeg' });
            setState(prevState => ({
                ...prevState,
                currentImage: new File([blob], "img")
            }));
            console.log(blobToImage(blob))
            console.log('Request successful')
    
            return blob;
        } catch (error) {
            console.error('Error:', error);
            throw error; 
        }
    }

    function designCallback(imageFile: File, prompt: string): Promise<string> {
        console.log('called design callback')
        setState(prevState => ({
            ...prevState,
            designLoading: true
        }));
        return new Promise(async (resolve, reject) => {
            try {
                //const imageFile = await getImageFileFromUrl(imageUrl);
                const designedImageBlob = await sendForDesign(imageFile, prompt);
                setState(prevState => ({
                    ...prevState,
                    designLoading: false, 
                    designError: undefined
                })); 
            } catch (error) {
                reject(error);
                setState(prevState => ({
                    ...prevState,
                    designLoading: false, 
                    designError: 'Error designing image. Please try again.'
                }));
            }
        });
    }
};