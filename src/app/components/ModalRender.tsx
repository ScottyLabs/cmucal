"use client";

import { useEventState } from "../../context/EventStateContext";
import ModalEvent from "./ModalEvent";
import ModalEventForm from "./ModalEventForm";
import ModalEventUpdate from "./ModalEventUpdate";
import { useEffect } from "react";

import dynamic from 'next/dynamic';
import ModalEventLink from "./ModalEventLink";
const ModalUploadOne = dynamic(() => import('./ModalUploadOne'), {
  ssr: false,
});



export default function ModalRender() {
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