import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTreeModule } from '@angular/material/tree';
import { JoinPipeModule } from '~/app/utils/pipes/join.pipe';
import { TransformationDialogModule } from '../transformation-dialog/transformation-dialog.module';
import { MappingZoneComponent } from './mapping-zone.component';

@NgModule({
  declarations: [
    MappingZoneComponent
  ],
  imports: [
    CommonModule,
    MatTreeModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    JoinPipeModule,
    TransformationDialogModule,
  ],
  exports: [
    MappingZoneComponent
  ]
})
export class MappingZoneModule { }
