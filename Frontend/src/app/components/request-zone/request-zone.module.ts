import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RequestZoneComponent } from './request-zone.component';
import { JsonEditorModule } from '~/app/components/json-editor/json-editor.module';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    RequestZoneComponent
  ],
  imports: [
    CommonModule,
    JsonEditorModule,
    MatButtonModule,
    MatCardModule,
  ],
  exports: [
    RequestZoneComponent
  ]
})
export class RequestZoneModule { }
