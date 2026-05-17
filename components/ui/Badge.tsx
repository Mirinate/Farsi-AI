import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple'

const variants: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

interface BadgeProps {
  label: string
  variant: BadgeVariant
  dot?: boolean
}

export function Badge({ label, variant, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'green' && 'bg-green-500',
          variant === 'red' && 'bg-red-500',
          variant === 'yellow' && 'bg-yellow-500',
          variant === 'blue' && 'bg-blue-500',
          variant === 'gray' && 'bg-gray-500',
          variant === 'purple' && 'bg-purple-500',
        )} />
      )}
      {label}
    </span>
  )
}
