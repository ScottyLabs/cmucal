"use client";

import { useEventState } from "../../context/EventStateContext";
import ModalEvent from "./ModalEvent";
import ModalEventForm from "./ModalEventForm";
import ModalEventUpdate from "./ModalEventUpdate";
import EventPopover from "./EventPopover";

import dynamic from 'next/dynamic';
import ModalEventLink from "./ModalEventLink";
const ModalUploadOne = dynamic(() => import('./ModalUploadOne'), {
  ssr: false,
});

export default function ModalRender() {
    const { modalView, closeModal, modalData, popoverPosition } = useEventState();

    if (!modalView) return null;

    return (
        <>
            {modalView === "details" && (
                // Use popover on desktop, modal on mobile
                // Render both to avoid hydration issues and content flash
                <>
                    <div className="md:hidden">
                        <ModalEvent
                            show={true}
                            onClose={closeModal}
                            savedEventDetails={modalData.savedEventDetails}
                        />
                    </div>
                    <div className="hidden md:block">
                        <EventPopover
                            show={true}
                            onClose={closeModal}
                            position={popoverPosition}
                            savedEventDetails={modalData.savedEventDetails}
                        />
                    </div>
                </>
            )}
            {modalView === "update" && (
                <ModalEventUpdate
                    show={true}
                    onClose={closeModal}
                    oldEventInfo={modalData.eventInfo}
                    savedEventTags={modalData.selectedTags}
                />
            )}
            {modalView === "pre_upload" && (
                <ModalUploadOne show={true} onClose={closeModal} />
            )}
            {modalView === "uploadLink" && (
                <ModalEventLink
                    show={true}
                    onClose={closeModal}
                    selectedCategory={modalData.selectedCategory}
                />
            )}
            {modalView === "upload" && (
                <ModalEventForm
                    show={true}
                    onClose={closeModal}
                    selectedCategory={modalData.selectedCategory}
                />
            )}
        </>
    )
}