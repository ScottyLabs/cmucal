"use client";

import { useEventState } from "../../context/EventStateContext";
// import { useContext } from "react";
import ModalEvent from "./ModalEvent";
import ModalEventForm from "./ModalEventForm";
import ModalEventUpdate from "./ModalEventUpdate";
import { useEffect } from "react";

// import ModalUploadOne from "./ModalUploadOne";
import dynamic from 'next/dynamic';
import ModalEventLink from "./ModalEventLink";
// Dynamically import ModalUploadOne
const ModalUploadOne = dynamic(() => import('./ModalUploadOne'), {
  ssr: false,
});



export default function ModalRender() {
    // const [selectedEvent, setSelectedEvent] = useState<number|null>(null);
    // const [modalView, setModalView] = useState<ModalView>(null);
    const { modalView, closeModal, modalData } = useEventState();
    console.log("[RENDER] modal: ", modalView);
    console.log("[MODAL DATA] ", modalData);
    
    useEffect(() => {
        console.log("[MODAL CHANGE]", modalView);
      }, [modalView]);

    if (!modalView) return null;
     
    return (
        <>
            {modalView==="details" && (
                // <div style={{ position: "fixed", top: 0, left: 0, backgroundColor: "lime", padding: 20, zIndex: 9999 }}>
                //     Modal is showing!
                // </div>
                <ModalEvent show={true} onClose={closeModal}
                savedEventDetails={modalData.savedEventDetails}/>
            )}
            {modalView==="update" && (
                <ModalEventUpdate show={true} onClose={closeModal} 
                oldEventInfo={modalData.eventInfo}
                savedEventTags={modalData.selectedTags}/>
            )}
            {modalView==="pre_upload" && (
                <ModalUploadOne show={true} onClose={closeModal} />
            )}
            {modalView==="uploadLink" && (
                <ModalEventLink show={true} onClose={closeModal} 
                selectedCategory={modalData.selectedCategory} />
            )}
            {modalView==="upload" && (
                <ModalEventForm show={true} onClose={closeModal} 
                selectedCategory={modalData.selectedCategory} />
            )}
        </>
    )
}