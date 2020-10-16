import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTreeModule } from '@angular/material/tree';
import { JoinPipeModule } from '~/app/utils/pipes/join.pipe';
import { TransformationDialogModule } from '../transformation-dialog/transformation-dialog.module';
import { TargetIdDialog } from './targetid.dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    TargetIdDialog
  ],
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
  ],
  exports: [
    TargetIdDialog
  ]
})
export class TargetIdDialogModule { }
