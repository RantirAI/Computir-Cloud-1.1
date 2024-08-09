import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { FlowOperationType, flowHelper } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { ApEdge } from './flow-canvas-utils';
import StepDragOverlay from './step-drag-overlay';

type FlowDragLayerProps = {
  children: React.ReactNode;
};

// https://github.com/clauderic/dnd-kit/pull/334#issuecomment-1965708784
const fixCursorSnapOffset: CollisionDetection = (args) => {
  // Bail out if keyboard activated
  if (!args.pointerCoordinates) {
    return rectIntersection(args);
  }
  const { x, y } = args.pointerCoordinates;
  const { width, height } = args.collisionRect;
  const updated = {
    ...args,
    // The collision rectangle is broken when using snapCenterToCursor. Reset
    // the collision rectangle based on pointer location and overlay size.
    collisionRect: {
      width,
      height,
      bottom: y + height / 2,
      left: x - width / 2,
      right: x + width / 2,
      top: y - height / 2,
    },
  };
  return rectIntersection(updated);
};

const FlowDragLayer = ({ children }: FlowDragLayerProps) => {
  const { toast } = useToast();
  const [
    setActiveDraggingStep,
    applyOperation,
    flowVersion,
    activeDraggingStep,
  ] = useBuilderStateContext((state) => [
    state.setActiveDraggingStep,
    state.applyOperation,
    state.flowVersion,
    state.activeDraggingStep,
  ]);

  const draggedStep = activeDraggingStep
    ? flowHelper.getStep(flowVersion, activeDraggingStep)
    : undefined;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDraggingStep(e.active.id.toString());
  };

  const handleDragCancel = () => {
    setActiveDraggingStep(null);
  };
  const handleDragEnd = (e: DragEndEvent) => {
    const collision = e?.collisions?.[0]?.data?.['droppableContainer'].data
      .current as ApEdge['data'];
    setActiveDraggingStep(null);
    if (collision && collision.parentStep && draggedStep) {
      const isPartOfInnerFlow = flowHelper.isPartOfInnerFlow({
        parentStep: draggedStep,
        childName: collision.parentStep,
      });
      if (isPartOfInnerFlow) {
        toast({
          title: 'Invalid Move',
          description: 'The destination location is inside the same step',
          duration: 3000,
        });
        return;
      }
      applyOperation(
        {
          type: FlowOperationType.MOVE_ACTION,
          request: {
            name: draggedStep.name,
            newParentStep: collision.parentStep,
            stepLocationRelativeToNewParent:
              collision.stepLocationRelativeToParent,
          },
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor),
  );

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={fixCursorSnapOffset}
    >
      {children}
      <DragOverlay
        dropAnimation={{ duration: 0 }}
        modifiers={[snapCenterToCursor]}
      >
        {draggedStep && <StepDragOverlay step={draggedStep} />}
      </DragOverlay>
    </DndContext>
  );
};

export { FlowDragLayer };
