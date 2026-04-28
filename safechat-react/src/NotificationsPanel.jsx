// src/NotificationsPanel.jsx
export default function NotificationsPanel({ onClose, notifications }) {
    const typeClasses = {
        warning: 'bg-sc-tertiary/30 text-sc-on-tertiary border-b border-sc-tertiary/20',
        like: 'bg-sc-primary-light/15 text-sc-primary border-b border-sc-primary-light/15',
        comment: 'bg-sc-secondary/25 text-sc-on-secondary border-b border-sc-secondary/20',
        message: 'bg-sc-container-high text-sc-text border-b border-sc-outline/15',
    };

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div className="absolute top-16 right-4 w-80 frosted-glass rounded-card elevation-3 z-50 animate-slide-in-right overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
                <div className="p-5 flex justify-between items-center border-b border-sc-outline/20">
                    <h3 className="font-display font-bold text-sc-text text-lg">Notifications</h3>
                    <button onClick={onClose} className="text-sc-text-muted hover:text-sc-text transition-colors text-xl leading-none hover:scale-110 transition-transform">×</button>
                </div>
                <div className="flex flex-col max-h-96 overflow-y-auto">
                    {Array.isArray(notifications) && notifications.length > 0 ? (
                        notifications.map((note, idx) => (
                            <div key={note.id} className={`px-5 py-4 text-sm animate-fade-in-up ${typeClasses[note.type] || 'bg-sc-container border-b border-sc-outline/15'}`}
                                style={{ animationDelay: `${idx * 50}ms` }}>
                                {note.user ? <strong className="font-semibold capitalize mr-1">{note.user}</strong> : ''}
                                {note.text}
                            </div>
                        ))
                    ) : (
                        <p className="p-5 text-center text-sc-text-muted text-sm">No new notifications.</p>
                    )}
                </div>
            </div>
        </div>
    );
}