"use client";
// components/Modal.tsx

import Modal from './Modal';
import { useEventState } from "../../context/EventStateContext";
import { ReactNode, useState, useEffect } from "react";

import axios from 'axios';
import { useUser } from "@clerk/nextjs";
import { getAdminCategories } from '../utils/api/users';
import { CategoryOrg } from '../utils/types';

type ModalProps = {
  // showUploadModalOne: boolean;
  // setShowUploadModalOne: React.Dispatch<React.SetStateAction<boolean>>; 
  // showUploadModalTwo: boolean;
  // setShowUploadModalTwo: React.Dispatch<React.SetStateAction<boolean>>;
  // setSelectedCategory: React.Dispatch<React.SetStateAction<any>>;
  show: boolean;
  onClose: () => void;
};

// export default function ModalUploadOne({ showUploadModalOne, setShowUploadModalOne, 
//                                         showUploadModalTwo, setShowUploadModalTwo, setSelectedCategory, onClose}: ModalProps) {
export default function ModalUploadOne({ show, onClose }: ModalProps) {

  const [selectedOption, setSelectedOption] = useState<CategoryOrg | null>(null);
  const { user } = useUser();  // clerk user object
  const [loading, setLoading] = useState<boolean>(true);
  const [adminCategories, setAdminCategories] = useState<CategoryOrg[]>([]);
  const { openUploadLink } = useEventState();

  if (!user) return null;

  useEffect(() => {
    const fetchAdminCategories = async () => {
      if (!user?.id) return;

      // console.log("Fetching admin categories for Clerk ID:", user.id);

      const categories = await getAdminCategories(user.id);
      if (categories) {
        setAdminCategories(categories);
      }
    };

    fetchAdminCategories();
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-4">Loading Calendars...</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your authorized calendars.</p>
        </div>
      </div>
    );
  }
  

  return (
    <Modal show={show} onClose={onClose}>
    {/* <>
     
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      >
      
      
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        > */}
          <h2 className="text-lg font-semibold mb-4">Choose a calendar</h2>
        <select
          className="w-full border rounded-md p-2 mb-4"
          value={selectedOption?.id ?? ""}
          onChange={(e) => {
            const selected = adminCategories.find((cat) => String(cat.id) === e.target.value);
            setSelectedOption(selected || null);
          }}
        >
          <option value="" disabled>Select a calendar</option>
          {adminCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.organization_name} — {category.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          No available calendars? Please fill out this
          <a href='https://forms.gle/DaaShMuQpbYiSNLn6' target='_blank' className="text-blue-600 hover:underline"> google form </a>
          to request edit access to an organization's calendar.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md w-full"
          disabled={!selectedOption}
          onClick={() => {
            if (selectedOption) {
              // setSelectedCategory(selectedOption);
              console.log("Selected category:", selectedOption);
              // setShowUploadModalOne(false);
              // setShowUploadModalTwo(true);
              openUploadLink(selectedOption);
            }
          }}
        >
          Next
        </button>
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white"
            onClick={onClose}
          >
            &times;
          </button>
        {/* </div>
      </div>
      </div> */}
      </Modal>
    // </>
  );
}
