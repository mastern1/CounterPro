// src/constants/translations.js

// اللغة الحالية: الإنجليزية
const LANGUAGE = 'en'; 

const textDatabase = {
  ar: {
    // ... (لن نحتاج العربي الآن)
  },
  
  en: {
    // Identity Screen
    welcomeTitle: "Counting Manager",
    welcomeUser: "Hello, Master 👋",
    enterName: "Enter name to start",
    namePlaceholder: "Type your name here",
    startButton: "Login & Start",
    alertName: "Please enter your name",
    alertError: "Alert",
    
    // Home Screen
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

    // Dashboard Screen
    itemsTitle: "Dashboard",
    noItems: "No items in this group",
    startItemMsg: "Press the green button to add an item",
    addItemBtn: "Add Item",
    newItemTitle: "New Counter Item",
    itemName: "Item Name",
    itemStep: "Step (Increment)",
    resetAlertTitle: "Reset",
    resetAlertMsg: "Reset counter to zero?",
    confirmBtn: "Confirm",
    deleteItemTitle: "Delete Item",
    deleteItemMsg: "Are you sure you want to delete this?",
    save: "Save"
  }
};

export const TEXTS = textDatabase[LANGUAGE];