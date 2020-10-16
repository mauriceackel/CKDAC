import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProgressIndicatorComponent } from './progress-indicator.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    ProgressIndicatorComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  exports: [
    ProgressIndicatorComponent
  ]
})
export class ProgressIndicatorModule { }
