import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EditorZoneComponent } from './editor-zone.component';
import { JsonEditorModule } from '~/app/components/json-editor/json-editor.module';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    EditorZoneComponent
  ],
  imports: [
    CommonModule,
    JsonEditorModule,
    MatButtonModule,
  ],
  exports: [
    EditorZoneComponent
  ]
})
export class EditorZoneModule { }
