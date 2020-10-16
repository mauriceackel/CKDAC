import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MappingZoneModule } from '~/app/components/openapi-mapping-zone/mapping-zone.module';
import { RequestZoneModule } from '~/app/components/request-zone/request-zone.module';
import { GenericDialogModule } from '~/app/utils/generic-dialog/generic-dialog.module';
import { FilterPipeModule } from '~/app/utils/pipes/filter.pipe';
import { JoinPipeModule } from '~/app/utils/pipes/join.pipe';
import { TransformationComponent } from './transformation.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { ProgressIndicatorModule } from '~/app/components/progress-indicator/progress-indicator.module';

@NgModule({
  declarations: [
    TransformationComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MappingZoneModule,
    MatTabsModule,
    MatSelectModule,
    JoinPipeModule,
    MatExpansionModule,
    GenericDialogModule,
    RequestZoneModule,
    FilterPipeModule,
    OverlayModule,
    ProgressIndicatorModule
  ],
  exports: [
    TransformationComponent
  ]
})
export class TransformationModule { }
