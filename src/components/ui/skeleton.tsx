import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center p-4 space-x-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

function MessageSkeleton() {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%] space-y-2">
        <Skeleton className="h-12 w-64 rounded-2xl rounded-br-md" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  )
}

export { Skeleton, ConversationSkeleton, MessageSkeleton }
