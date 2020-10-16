import { NgModule } from '@angular/core';
import { BaseComponent } from './base.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ExplanationModule } from './explanation/explanation.module';
import { DescribeModule } from './describe/describe.module';
import { TransformationModule } from './transformation/transformation.module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    BaseComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatToolbarModule,
    RouterModule,
    ExplanationModule,
    DescribeModule,
    TransformationModule,
    MatIconModule
  ],
  exports: [
    BaseComponent
  ]
})
export class BaseModule { }
