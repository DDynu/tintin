interface Props {
  content: string
  isMe: boolean
  time: string
}

export function MessageBubble({ content, isMe, time }: Props) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs px-3 py-2 rounded-lg ${
          isMe
            ? 'bg-blue-500 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        <p className="text-sm">{content}</p>
        <span className="text-xs opacity-70">{time}</span>
      </div>
    </div>
  )
}
