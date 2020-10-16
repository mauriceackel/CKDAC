import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TransformationDialog } from './transformation-dialog.component';

@NgModule({
  declarations: [TransformationDialog],
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ], exports: [
    TransformationDialog
  ], entryComponents: [
    TransformationDialog
  ]
})
export class TransformationDialogModule { }
