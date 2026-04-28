// src/Notification.jsx
export default function Notification({ message, onClose }) {
  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in-down">
      <div className="flex items-center gap-3 rounded-full bg-sc-tertiary px-5 py-3 elevation-3 border border-sc-on-tertiary/15">
        <span className="text-sc-on-tertiary font-bold text-sm">⚠️</span>
        <p className="text-sc-on-tertiary text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 text-sc-on-tertiary/70 hover:text-sc-on-tertiary font-bold transition-colors hover:scale-110">✕</button>
      </div>
    </div>
  );
}