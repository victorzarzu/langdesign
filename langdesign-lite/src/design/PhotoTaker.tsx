import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import './css/design-area.css';
import { getLogger } from '../core';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const log = getLogger('PgotoTaker');

interface PhotoTakerProps {
  handleImage: (file: File) => void;
}

export const PhotoTaker: React.FC<PhotoTakerProps> = ({ handleImage }) => {
  const [showCamera, setShowCamera] = React.useState(false);

  return (
    <>
      <button
        className="button-upload"
        onClick={() => setShowCamera(!showCamera)}
      >
        Take a photo
      </button>
      <CameraModal handleImage={handleImage} modalShow={showCamera} setShowModal={setShowCamera} />
    </>
  );
};

interface CameraModalProps {
  handleImage: (file: File) => void;
  modalShow: boolean;
  setShowModal?: (show: boolean) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ handleImage, modalShow, setShowModal }) => {
  const webcamRef = useRef<any>(null);
  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = dataURItoBlob(imageSrc);
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    handleImage(file);
    setShowModal && setShowModal(false);
  };

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: mimeString });
  };

  return (
    <Modal
      show={modalShow}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Button onClick={() => setShowModal && setShowModal(false)}>Close</Button>
      </Modal.Header>
      <Modal.Body>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ width: '100%', height: 'auto' }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={capture}>
            Capture
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
