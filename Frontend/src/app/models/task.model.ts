
export interface ITask {
  id: string
  name: string
  description: string
  sourceInterface: string
  targetInterface: string
  type: TaskType
}

export enum TaskType {
  MANUAL_MAP,
  TRANSFORM_MAP,
  ADD_INTERFACE
}
