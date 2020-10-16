import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ITask, TaskType } from '~/app/models/task.model';
import { TaskService } from '~/app/services/task.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public task = new FormControl(undefined, Validators.required);

  public tasks = new Array<ITask>();

  constructor(private router: Router, public taskService: TaskService) { }

  public async ngOnInit() {
    this.tasks = await this.taskService.getTasks();
    if(this.taskService.TaskRunning) {
      this.task.setValue(this.tasks.find(t => t.id === this.taskService.ActiveTask.id))
    }
  }

  public startTask(task: ITask) {
    this.taskService.startTask(task);

    switch(task.type) {
      case TaskType.MANUAL_MAP: this.router.navigate(['/manual'], { queryParams: { sourceId: task.sourceInterface, targetId: task.targetInterface } }); break;
      case TaskType.TRANSFORM_MAP: this.router.navigate(['/transformation'], { queryParams: { sourceId: task.sourceInterface, targetId: task.targetInterface } }); break;
      case TaskType.ADD_INTERFACE: this.router.navigate(['/describe'], { queryParams: { selectedId: task.sourceInterface } }); break;
      default: throw new Error("Unknown mapping type");
    }
  }

  public abortTask() {
    this.taskService.abortTask();
    this.task.reset();
  }
}
