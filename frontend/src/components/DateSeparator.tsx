interface Props {
  date: Date
}

export function DateSeparator({ date }: Props) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string

  // Format the date for display
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Check if it's today
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    label = 'Today'
  }
  // Check if it's yesterday
  else if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    label = 'Yesterday'
  } else {
    label = formatDate(date)
  }

  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-text-dim px-3 py-1 bg-bg-deep rounded-full">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
