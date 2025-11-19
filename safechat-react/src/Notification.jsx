// src/Notification.jsx
export default function Notification({ message, onClose }) {
  return (
    <div className="fixed top-5 right-5 bg-yellow-500 text-black p-4 rounded-lg shadow-lg z-50 animate-fade-in-down">
      <div className="flex items-center">
        <span className="font-bold mr-2">⚠️ Warning</span>
        <p>{message}</p>
        <button onClick={onClose} className="ml-4 text-black font-bold">X</button>
      </div>
    </div>
  );
}