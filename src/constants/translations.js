// src/constants/translations.js

const LANGUAGE = 'en';

const textDatabase = {
  en: {
    // --- Identity Screen ---
    welcomeTitle: "Counting Manager",
    welcomeUser: "Hello, Master 👋",
    enterName: "Enter name to start",
    namePlaceholder: "Type your name here",
    startButton: "Login & Start",
    alertName: "Please enter your name",
    alertError: "Alert",

    // --- Home Screen ---
    greeting: "Hi, ",
    groupsTitle: "Work Groups",
    statsGroups: "Groups",
    statsCount: "Total Count",
    newGroupBtn: "Create",
    cancelBtn: "Cancel",
    newGroupTitle: "New Work Group",
    newGroupPlaceholder: "Project or Order Name",
    noGroups: "No work groups yet",
    deleteGroupTitle: "Delete Group",
    deleteGroupMsg: "Are you sure? All counters inside will be deleted.",
    deleteBtn: "Delete",
    editFeature: "Coming Soon...",
    logOutBtn: "Logout",
    logOutTitle: "Logout Confirmation",
    logOutMsg: "Are you sure you want to logout? All unsynced data may be lost.",

    // --- Dashboard Screen ---
    itemsTitle: "Dashboard",
    noItems: "No items in this group",
    startItemMsg: "Press the green button to add an item",
    addItemBtn: "Add Item",
    newItemTitle: "New Counter Item",

    // --- Shared Buttons & Actions ---
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    confirmBtn: "Confirm", // Added because the Dashboard relies on it
    save: "Save",
    edit: "Edit",

    // --- Counter Card Texts ---
    itemName: "Item Name",
    itemStep: "Step (Increment)",
    itemTarget: "Target Goal (Optional)",
    itemTargetPlaceholder: "e.g. 100, 500...",

    goal: "Goal",
    step: "Step",

    // --- Alert Messages (Functions & Titles) ---

    deleteTitle: "Delete Counter",
    deleteMessage: (name) => `Are you sure you want to delete "${name}"?`,

    // Names unified with the Dashboard
    resetAlertTitle: "Reset Counter",
    resetMessage: (name) => `Are you sure you want to reset "${name}" to zero?`,
    resetAlertMsg: "Are you sure you want to reset this item?", // Fallback message
  }
};

export const TEXTS = textDatabase[LANGUAGE];
