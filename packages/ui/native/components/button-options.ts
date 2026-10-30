export const buttonVariants = ['primary', 'secondary', 'ghost', 'destructive'] as const
export type ButtonVariant = (typeof buttonVariants)[number]

export const buttonSizes = ['sm', 'md', 'lg'] as const
export type ButtonSize = (typeof buttonSizes)[number]
