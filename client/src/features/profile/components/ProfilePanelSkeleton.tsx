type ProfilePanelSkeletonProps = {
  variant?: 'column' | 'sheet'
}

const bone = 'animate-pulse bg-background-alt'
const boneOnAlt = 'animate-pulse bg-primary'

const ProfilePanelSkeleton = ({ variant = 'column' }: ProfilePanelSkeletonProps) => {
  const isSheet = variant === 'sheet'

  return (
    <div
      className={
        isSheet
          ? 'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-background py-2 lg:rounded-2xl lg:bg-background-alt'
          : 'relative mt-14 flex min-h-0 flex-1 flex-col rounded-2xl bg-background-alt py-2'
      }
      aria-busy="true"
      aria-label="Loading profile"
    >
      {isSheet ? (
        <div className="flex shrink-0 flex-col items-center gap-2 px-4 pb-2 pt-1">
          <div className={`h-20 w-20 rounded-full border-4 border-background ${boneOnAlt}`} />
          <div className={`h-5 w-32 rounded-md ${boneOnAlt}`} />
        </div>
      ) : (
        <>
          <div
            className={`absolute -top-14 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full border-8 border-background ${boneOnAlt}`}
          />
          <div className="mx-auto mt-10 flex min-h-10 w-full max-w-72 items-center justify-center px-3">
            <div className={`h-6 w-36 rounded-md ${boneOnAlt}`} />
          </div>
        </>
      )}

      <div className="mt-4 flex min-h-22 w-full flex-col items-center px-3 pb-2 sm:min-h-26 sm:px-4">
        <div className={`h-4 w-10 rounded-md ${boneOnAlt}`} />
        <div className={`mt-3 h-12 w-[78%] max-w-72 rounded-xl ${boneOnAlt}`} />
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-hidden border-t border-border/80 px-3 pb-4 pt-4">
        <div className="rounded-2xl bg-primary/35 px-3 py-3.5">
          <div className={`mb-3 h-4 w-40 rounded-md ${bone}`} />
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`aspect-5/4 rounded-lg ${bone}`} />
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-primary/35 px-3 py-3.5">
          <div className={`mb-3 h-4 w-28 rounded-md ${bone}`} />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`h-10 rounded-xl ${bone}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePanelSkeleton
