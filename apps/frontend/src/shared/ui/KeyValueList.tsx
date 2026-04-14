type KeyValueItem = {
  label: string
  value: string
}

type KeyValueListProps = {
  items: KeyValueItem[]
}

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="grid gap-4">
      {items.map((item) => (
        <div
          className="grid gap-1 border-b border-border-soft/70 pb-4 last:border-none last:pb-0"
          key={item.label}
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">
            {item.label}
          </dt>
          <dd className="text-sm leading-7 text-text-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
