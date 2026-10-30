// The variant and state lists components accept, kept apart from the component files so those
// export only components (fast refresh needs that).

export const bannerTones = ['info', 'caution', 'danger'] as const
export type BannerTone = (typeof bannerTones)[number]

export const iconButtonVariants = ['plain', 'tonal', 'filled'] as const
export type IconButtonVariant = (typeof iconButtonVariants)[number]

export const sheetSnaps = ['collapsed', 'half', 'full'] as const
export type SheetSnap = (typeof sheetSnaps)[number]

export const permissionKinds = ['location', 'notifications'] as const
export type PermissionKind = (typeof permissionKinds)[number]

export const rideClasses = ['economy', 'comfort', 'luxury'] as const
export type RideClass = (typeof rideClasses)[number]

export const stepStates = ['done', 'current', 'upcoming'] as const
export type StepState = (typeof stepStates)[number]
