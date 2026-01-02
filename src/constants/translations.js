// src/constants/translations.js

// اللغة الحالية: الإنجليزية
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
    cancelBtn: "Cancel", // مستخدم في Home
    newGroupTitle: "New Work Group",
    newGroupPlaceholder: "Project or Order Name",
    noGroups: "No work groups yet",
    deleteGroupTitle: "Delete Group",
    deleteGroupMsg: "Are you sure? All counters inside will be deleted.",
    deleteBtn: "Delete", // مستخدم في Home
    editFeature: "Coming Soon...",

    // --- Dashboard Screen ---
    itemsTitle: "Dashboard",
    noItems: "No items in this group",
    startItemMsg: "Press the green button to add an item",
    addItemBtn: "Add Item",
    newItemTitle: "New Counter Item",
    
    // --- Shared Buttons (Buttons inside Alerts) ---
    cancel: "Cancel",  // 👈 هذا اللي يدور عليه الكرت
    delete: "Delete",  // 👈 هذا اللي يدور عليه الكرت
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",

    // --- Counter Card Texts (مهم جداً) ---
    itemName: "Item Name",
    itemStep: "Step (Increment)",
    itemTarget: "Target Goal (Optional)",
    itemTargetPlaceholder: "e.g. 100, 500...",
    
    goal: "Goal", 
    step: "Step", 
    
    // --- Alert Messages (Functions) ---
    // 👇 هنا كان الخطأ، وحدنا الأسماء لتصبح كما يطلبها الكود
    
    deleteTitle: "Delete Counter",
    deleteMessage: (name) => `Are you sure you want to delete "${name}"?`, 
    
    resetTitle: "Reset Counter",
    resetMessage: (name) => `Are you sure you want to reset "${name}" to zero?`,
  }
};

export const TEXTS = textDatabase[LANGUAGE];