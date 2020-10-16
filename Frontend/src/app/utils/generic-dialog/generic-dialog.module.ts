import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericDialog } from './generic-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [GenericDialog],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ], exports: [
    GenericDialog
  ], entryComponents: [
    GenericDialog
  ]
})
export class GenericDialogModule { }
