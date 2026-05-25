interface Props {
  content: string
  sender: string
  time: string
}

export function MessageBubble({ content, sender, time }: Props) {
  return (
    <div className="animate-fade-in group">
      <div className="flex items-end gap-2.5 max-w-[85%] md:max-w-xl">
        <div className="w-6 h-6 rounded-full bg-bg-card border border-border flex items-center justify-center text-[10px] text-text-dim shrink-0">
          {sender[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-text-secondary">{sender}</span>
            <span className="text-[10px] text-text-dim">{time}</span>
          </div>
          <div className="bg-bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5">
            <p className="text-sm leading-relaxed text-text-primary break-words">{content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
