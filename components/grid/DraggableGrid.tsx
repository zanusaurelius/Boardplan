"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PostCard from "./PostCard";
import { cn } from "@/lib/utils";

interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface Caption {
  id: string;
  platform: string;
  title: string;
  caption: string;
  hashtags: string;
}

interface Post {
  id: string;
  title: string | null;
  description: string;
  status: string;
  order: number;
  media: Media[];
  captions: Caption[];
}

interface SortableCardProps {
  post: Post;
  aspectRatio: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (post: Post) => void;
}

function SortableCard({ post, aspectRatio, isSelected, onSelect, onClick }: SortableCardProps) {
  const isLocked = post.status === "posted";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...(isLocked ? {} : { ...attributes, ...listeners })}>
      <PostCard
        post={post}
        aspectRatio={aspectRatio}
        isSelected={isSelected}
        onSelect={onSelect}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

interface DraggableGridProps {
  posts: Post[];
  columns: number;
  aspectRatio: string;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onPostClick: (post: Post) => void;
  onReorder: (orderedIds: string[]) => void;
}

export default function DraggableGrid({
  posts,
  columns,
  aspectRatio,
  selectedIds,
  onSelect,
  onPostClick,
  onReorder,
}: DraggableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const overPost = posts.find((p) => p.id === over.id);
      if (overPost?.status === "posted") return; // can't displace a posted item

      const oldIndex = posts.findIndex((p) => p.id === active.id);
      const newIndex = posts.findIndex((p) => p.id === over.id);

      const newPosts = [...posts];
      const [removed] = newPosts.splice(oldIndex, 1);
      newPosts.splice(newIndex, 0, removed);

      onReorder(newPosts.map((p) => p.id));
    }
  };

  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns] || "grid-cols-3";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={posts.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className={cn("grid gap-1.5", gridClass)}>
          {posts.map((post) => (
            <SortableCard
              key={post.id}
              post={post}
              aspectRatio={aspectRatio}
              isSelected={selectedIds.has(post.id)}
              onSelect={onSelect}
              onClick={onPostClick}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
